/**
 * Cloudflare Worker Function: Generate Wages Lost Time and Expense PDF
 * 
 * This worker:
 * 1. Receives form data from the web form
 * 2. Reads the original PDF template
 * 3. Maps web form fields to PDF fields
 * 4. Populates the PDF with form data
 * 5. Inserts the signature image
 * 6. Returns the completed PDF for download
 * 
 * The original PDF template remains unchanged on the server.
 */

import { PDFDocument, PDFPage, rgb, PDFImage } from 'pdf-lib';

export default {
    async fetch(request, env) {
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        try {
            // Parse form data
            const formData = await request.formData();
            
            // Get the PDF template from storage
            const pdfTemplate = await getPDFTemplate(env);
            if (!pdfTemplate) {
                return errorResponse('PDF template not found', 500);
            }

            // Load the PDF
            const pdfDoc = await PDFDocument.load(pdfTemplate);

            // Get form fields from PDF
            const form = pdfDoc.getForm();
            
            // Extract and validate form data
            const claimData = extractFormData(formData);
            if (!claimData.valid) {
                return errorResponse(claimData.errors.join(', '), 400);
            }

            // Fill PDF fields
            fillPDFFields(form, claimData.data);

            // Handle signature if provided
            const signatureDataURL = formData.get('signature');
            if (signatureDataURL) {
                await addSignatureToPDF(pdfDoc, signatureDataURL, form);
            }

            // Flatten the form (make it non-interactive after filling)
            form.flatten();

            // Save and return PDF
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
};

/**
 * Get the PDF template from R2 storage or file system
 */
async function getPDFTemplate(env) {
    try {
        // Try R2 storage first (if configured)
        if (env.TEMPLATE_BUCKET) {
            const object = await env.TEMPLATE_BUCKET.get('Wages Lost Time and Expense_Bilingual_Fillable_Revised Mar 26.pdf');
            if (object) {
                return await object.arrayBuffer();
            }
        }
        
        // Fallback: fetch from public URL
        const response = await fetch('https://raw.githubusercontent.com/bigwin4real/viaunion/main/Wages Lost Time and Expense_Bilingual_Fillable_Revised Mar 26.pdf');
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
 * Extract and validate form data
 */
function extractFormData(formData) {
    const errors = [];
    const data = {};

    // Required fields
    const required = [
        'memberName', 'memberNumber', 'email', 
        'claimStartDate', 'claimEndDate', 'claimType', 
        'totalAmount', 'claimDescription', 'signatureDate'
    ];

    // Extract all form fields
    for (const [key, value] of formData.entries()) {
        if (key === 'signature') continue; // Handle separately
        data[key] = value ? String(value).trim() : '';
    }

    // Validate required fields
    for (const field of required) {
        if (!data[field]) {
            errors.push(`${field} is required`);
        }
    }

    // Validate email format
    if (data.email && !isValidEmail(data.email)) {
        errors.push('Invalid email address');
    }

    // Validate total amount
    const amount = parseFloat(data.totalAmount);
    if (isNaN(amount) || amount <= 0) {
        errors.push('Total amount must be a positive number');
    }

    // Validate dates
    if (data.claimStartDate && data.claimEndDate) {
        const start = new Date(data.claimStartDate);
        const end = new Date(data.claimEndDate);
        if (start > end) {
            errors.push('Claim start date must be before end date');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        data
    };
}

/**
 * Fill PDF form fields with data
 */
function fillPDFFields(form, data) {
    const fieldMapping = {
        memberName: 'memberFullName',
        memberNumber: 'memberNumber',
        dateOfBirth: 'dateOfBirth',
        department: 'department',
        email: 'contactEmail',
        phone: 'contactPhone',
        claimStartDate: 'claimPeriodStart',
        claimEndDate: 'claimPeriodEnd',
        claimType: 'claimType',
        totalAmount: 'totalAmountClaimed',
        claimDescription: 'claimDescription',
        documentation: 'supportingDocumentation',
        stewardName: 'stewardName',
        stewardContact: 'stewardContact',
        signatureDate: 'dateOfSignature'
    };

    for (const [webField, pdfField] of Object.entries(fieldMapping)) {
        const value = data[webField];
        if (!value) continue;

        try {
            const field = form.getField(pdfField);
            
            if (field.isCheckbox && field.isCheckbox()) {
                field.check();
            } else if (field.isRadioGroup && field.isRadioGroup()) {
                const mappedValue = mapClaimType(webField, value);
                field.select(mappedValue);
            } else {
                field.setText(formatFieldValue(webField, value));
            }
        } catch (error) {
            console.log(`Field ${pdfField} not found in PDF`);
        }
    }
}

/**
 * Map claim type to PDF field value
 */
function mapClaimType(fieldName, value) {
    if (fieldName === 'claimType') {
        const mapping = {
            'Wages Lost': 'WagesLost',
            'Lost Time': 'LostTime',
            'Expenses': 'Expenses',
            'Combined': 'Combined'
        };
        return mapping[value] || value;
    }
    return value;
}

/**
 * Format field values for PDF
 */
function formatFieldValue(fieldName, value) {
    if (fieldName === 'signatureDate' || fieldName === 'claimStartDate' || fieldName === 'claimEndDate' || fieldName === 'dateOfBirth') {
        return formatDate(value);
    }
    if (fieldName === 'totalAmount') {
        return parseFloat(value).toFixed(2);
    }
    return value;
}

/**
 * Format date to MM/DD/YYYY
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
}

/**
 * Add signature image to PDF
 */
async function addSignatureToPDF(pdfDoc, signatureDataURL, form) {
    try {
        const base64Data = signatureDataURL.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const signatureImage = await pdfDoc.embedPng(bytes);
        const firstPage = pdfDoc.getPage(0);
        const { width, height } = firstPage.getSize();

        firstPage.drawImage(signatureImage, {
            x: 50,
            y: height - 150,
            width: 150,
            height: 60
        });

    } catch (error) {
        console.error('Error adding signature to PDF:', error);
    }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Return error response
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
