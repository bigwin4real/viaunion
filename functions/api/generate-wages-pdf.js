/**
 * Cloudflare Pages Function: Generate Wages Lost Time and Expense PDF
 *
 * POST /api/generate-wages-pdf
 *
 * 1. Receives the wages claim form data (header info + Mon-Sun grid).
 * 2. Loads the official bilingual Unifor PDF template.
 * 3. Fills the matching AcroForm fields, computing weekly subtotals/totals.
 * 4. Stamps the member's signature image onto the claimant signature field.
 * 5. Flattens and returns the completed PDF.
 *
 * The original PDF template on disk is never modified.
 */

import { PDFDocument } from 'pdf-lib';
import {
    headerFieldMapping,
    days,
    dayFieldMapping,
    totalsFieldMapping,
    signatureFieldMapping
} from './pdf-mapper.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const formData = await request.formData();

        const pdfTemplate = await getPDFTemplate(env, request);
        if (!pdfTemplate) {
            return errorResponse('PDF template not found', 500);
        }

        const pdfDoc = await PDFDocument.load(pdfTemplate);
        const form = pdfDoc.getForm();

        const claimData = extractFormData(formData);
        if (!claimData.valid) {
            return errorResponse(claimData.errors.join(', '), 400);
        }

        fillHeaderFields(form, claimData.data);
        fillDayGrid(form, claimData.data);
        fillTotals(form, claimData.data);
        fillSignatureDate(form, claimData.data);

        const signatureDataURL = formData.get('signature');
        if (signatureDataURL) {
            await addSignatureToPDF(pdfDoc, form, signatureDataURL);
        }

        form.flatten();

        const pdfBytes = await pdfDoc.save();

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Wages-Claim-${new Date().toISOString().split('T')[0]}.pdf"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (error) {
        console.error('PDF generation error:', error);
        return errorResponse(`PDF generation failed: ${error.message}`, 500);
    }
}

export async function onRequest(context) {
    if (context.request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }
    return onRequestPost(context);
}

/**
 * Load the PDF template. Tries R2 first (if bound), then falls back to
 * fetching the copy bundled alongside the static site (same origin).
 */
async function getPDFTemplate(env, request) {
    const TEMPLATE_NAME = 'Wages Lost Time and Expense_Bilingual_Fillable_Revised Mar 26.pdf';

    try {
        if (env.TEMPLATE_BUCKET) {
            const object = await env.TEMPLATE_BUCKET.get(TEMPLATE_NAME);
            if (object) {
                return await object.arrayBuffer();
            }
        }

        // Fall back to the copy deployed with the static site itself.
        const url = new URL(request.url);
        const templateUrl = `${url.origin}/${encodeURIComponent(TEMPLATE_NAME)}`;
        const response = await fetch(templateUrl);
        if (response.ok) {
            return await response.arrayBuffer();
        }

        return null;
    } catch (error) {
        console.error('Error retrieving PDF template:', error);
        return null;
    }
}

/**
 * Extract and validate form data from the submitted FormData.
 */
function extractFormData(formData) {
    const errors = [];
    const data = {};

    const requiredHeader = ['memberName', 'signatureDate'];

    for (const [key, value] of formData.entries()) {
        if (key === 'signature') continue;
        data[key] = value ? String(value).trim() : '';
    }

    for (const field of requiredHeader) {
        if (!data[field]) {
            errors.push(`${field} is required`);
        }
    }

    // At least one day must have some hours or a reason entered.
    const hasAnyDayData = days.some((day) => {
        const straight = parseFloat(data[`${day.key}Straight`]);
        const overtime = parseFloat(data[`${day.key}Overtime`]);
        const reason = data[`${day.key}Reason`];
        return (!isNaN(straight) && straight > 0) ||
               (!isNaN(overtime) && overtime > 0) ||
               (reason && reason.length > 0);
    });

    if (!hasAnyDayData) {
        errors.push('At least one day must have hours or a reason for claim entered');
    }

    return {
        valid: errors.length === 0,
        errors,
        data
    };
}

/**
 * Fill the header / member information fields.
 */
function fillHeaderFields(form, data) {
    for (const [webField, pdfField] of Object.entries(headerFieldMapping)) {
        const value = data[webField];
        if (!value) continue;

        if (webField === 'payrollPeriodEnding') {
            setText(form, pdfField, formatDate(value));
        } else {
            setText(form, pdfField, value);
        }
    }
}

/**
 * Fill the Monday-Sunday grid (date, from, to, straight, overtime, reason)
 * and compute per-day numeric totals along the way.
 */
function fillDayGrid(form, data) {
    for (const day of days) {
        const mapping = dayFieldMapping(day);

        const date = data[`${day.key}Date`];
        const from = data[`${day.key}From`];
        const to = data[`${day.key}To`];
        const straight = data[`${day.key}Straight`];
        const overtime = data[`${day.key}Overtime`];
        const reason = data[`${day.key}Reason`];

        if (date) setText(form, mapping.date, formatDate(date));
        if (from) setText(form, mapping.from, from);
        if (to) setText(form, mapping.to, to);
        if (straight) setText(form, mapping.straight, formatHours(straight));
        if (overtime) setText(form, mapping.overtime, formatHours(overtime));
        if (reason) setText(form, mapping.reason, reason);
    }
}

/**
 * Compute and fill the straight-time / overtime subtotal and total fields
 * from the per-day grid values.
 */
function fillTotals(form, data) {
    let straightTotal = 0;
    let overtimeTotal = 0;

    for (const day of days) {
        const straight = parseFloat(data[`${day.key}Straight`]);
        const overtime = parseFloat(data[`${day.key}Overtime`]);
        if (!isNaN(straight)) straightTotal += straight;
        if (!isNaN(overtime)) overtimeTotal += overtime;
    }

    if (straightTotal > 0) {
        setText(form, totalsFieldMapping.straightSubtotal, formatHours(straightTotal));
        setText(form, totalsFieldMapping.straightTotal, formatHours(straightTotal));
    }
    if (overtimeTotal > 0) {
        setText(form, totalsFieldMapping.overtimeSubtotal, formatHours(overtimeTotal));
        setText(form, totalsFieldMapping.overtimeTotal, formatHours(overtimeTotal));
    }
}

/**
 * Fill the claimant signature date field. The signature image itself is
 * drawn separately via addSignatureToPDF.
 */
function fillSignatureDate(form, data) {
    const value = data.signatureDate;
    if (!value) return;
    setText(form, signatureFieldMapping.signatureDate, formatDate(value));
}

/**
 * Draw the signature image over the claimant signature field on the page.
 */
async function addSignatureToPDF(pdfDoc, form, signatureDataURL) {
    try {
        const base64Data = signatureDataURL.split(',')[1];
        if (!base64Data) return;

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const signatureImage = await pdfDoc.embedPng(bytes);
        const page = pdfDoc.getPage(0);

        let rect = null;
        try {
            const field = form.getField(signatureFieldMapping.signatureDate);
            const widgets = field.acroField.getWidgets();
            if (widgets && widgets.length > 0) {
                rect = widgets[0].getRectangle();
            }
        } catch (error) {
            console.log('Signature field widget not found, using fallback position');
        }

        // Draw the signature just above/left of the "must be signed" field,
        // scaled to fit a reasonable signature box.
        const targetWidth = 180;
        const scale = targetWidth / signatureImage.width;
        const targetHeight = signatureImage.height * scale;

        const x = rect ? rect.x : 50;
        const y = rect ? rect.y + rect.height + 4 : 230;

        page.drawImage(signatureImage, {
            x,
            y,
            width: targetWidth,
            height: targetHeight
        });
    } catch (error) {
        console.error('Error adding signature to PDF:', error);
    }
}

/**
 * Safely set a text field's value, ignoring fields that don't exist or
 * aren't text fields.
 */
function setText(form, pdfFieldName, value) {
    try {
        const field = form.getField(pdfFieldName);
        if (field && typeof field.setText === 'function') {
            field.setText(String(value));
        }
    } catch (error) {
        console.log(`Field not found or not settable: ${pdfFieldName}`);
    }
}

/**
 * Format an hours value to a fixed 2-decimal string, dropping trailing
 * zeros isn't necessary here since hours fields are narrow.
 */
function formatHours(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num % 1 === 0 ? String(num) : num.toFixed(2);
}

/**
 * Format an ISO date (YYYY-MM-DD) to MM/DD/YYYY for display on the form.
 * Non-ISO values are returned unchanged.
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${month}/${day}/${year}`;
}

/**
 * Return a JSON error response.
 */
function errorResponse(message, status = 400) {
    return new Response(
        JSON.stringify({ error: message }),
        {
            status,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}
