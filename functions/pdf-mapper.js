/**
 * PDF Field Mapper
 * Maps web form fields to PDF form field names in the Unifor template
 * 
 * The PDF template maintains all original Unifor fields and structure.
 * This mapper ensures web form data is correctly placed into the official document.
 */

export const fieldMapping = {
    // Member Information Section
    memberName: {
        pdfField: 'memberFullName',
        type: 'text',
        description: 'Member Full Name'
    },
    memberNumber: {
        pdfField: 'memberNumber',
        type: 'text',
        description: 'Member Number / Badge Number'
    },
    dateOfBirth: {
        pdfField: 'dateOfBirth',
        type: 'date',
        description: 'Date of Birth'
    },
    department: {
        pdfField: 'department',
        type: 'text',
        description: 'Department / Division'
    },
    email: {
        pdfField: 'contactEmail',
        type: 'email',
        description: 'Email Address'
    },
    phone: {
        pdfField: 'contactPhone',
        type: 'tel',
        description: 'Phone Number'
    },
    
    // Claim Details Section
    claimStartDate: {
        pdfField: 'claimPeriodStart',
        type: 'date',
        description: 'Claim Period Start Date'
    },
    claimEndDate: {
        pdfField: 'claimPeriodEnd',
        type: 'date',
        description: 'Claim Period End Date'
    },
    claimType: {
        pdfField: 'claimType',
        type: 'select',
        description: 'Type of Claim (Wages Lost / Lost Time / Expenses / Combined)',
        options: {
            'Wages Lost': 'WagesLost',
            'Lost Time': 'LostTime',
            'Expenses': 'Expenses',
            'Combined': 'Combined'
        }
    },
    totalAmount: {
        pdfField: 'totalAmountClaimed',
        type: 'number',
        description: 'Total Amount Claimed (in dollars)',
        formatter: (value) => parseFloat(value).toFixed(2)
    },
    claimDescription: {
        pdfField: 'claimDescription',
        type: 'textarea',
        description: 'Detailed Description of Claim',
        multiline: true
    },
    
    // Supporting Documentation Section
    documentation: {
        pdfField: 'supportingDocumentation',
        type: 'textarea',
        description: 'List of Supporting Documents',
        multiline: true
    },
    
    // Union Representative Section
    stewardName: {
        pdfField: 'stewardName',
        type: 'text',
        description: 'Union Steward / Representative Name'
    },
    stewardContact: {
        pdfField: 'stewardContact',
        type: 'tel',
        description: 'Steward Contact Information'
    },
    
    // Signature & Date Section
    signatureDate: {
        pdfField: 'dateOfSignature',
        type: 'date',
        description: 'Date of Signature'
    },
    signature: {
        pdfField: 'memberSignature',
        type: 'image',
        description: 'Member Signature (PNG image)',
        format: 'image/png',
        position: {
            x: 50,
            y: 700,
            width: 150,
            height: 60
        }
    }
};

/**
 * Get all PDF fields from the mapping
 * @returns {Array} Array of PDF field names
 */
export function getPDFFields() {
    return Object.values(fieldMapping).map(field => field.pdfField);
}

/**
 * Get web form field for a given PDF field
 * @param {string} pdfField - PDF field name
 * @returns {object|null} Form field mapping or null if not found
 */
export function getFormFieldByPDF(pdfField) {
    return Object.entries(fieldMapping).find(
        ([_, mapping]) => mapping.pdfField === pdfField
    ) || null;
}

/**
 * Format field value according to its type
 * @param {string} fieldName - Web form field name
 * @param {any} value - Field value
 * @returns {any} Formatted value
 */
export function formatFieldValue(fieldName, value) {
    const mapping = fieldMapping[fieldName];
    if (!mapping) return value;
    
    if (mapping.formatter) {
        return mapping.formatter(value);
    }
    
    switch (mapping.type) {
        case 'number':
            return parseFloat(value) || 0;
        case 'date':
            return formatDate(value);
        case 'select':
            return mapping.options[value] || value;
        case 'email':
            return String(value).toLowerCase().trim();
        case 'tel':
            return String(value).trim();
        default:
            return String(value).trim();
    }
}

/**
 * Format date for PDF (MM/DD/YYYY format)
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Formatted date (MM/DD/YYYY)
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
}

/**
 * Prepare form data for PDF filling
 * @param {FormData} formData - Form data from submission
 * @returns {object} Cleaned and formatted data ready for PDF
 */
export async function preparePDFData(formData) {
    const pdfData = {};
    
    for (const [formField, mapping] of Object.entries(fieldMapping)) {
        const value = formData.get(formField);
        
        if (value && mapping.type !== 'image') {
            const formattedValue = formatFieldValue(formField, value);
            pdfData[mapping.pdfField] = formattedValue;
        }
    }
    
    return pdfData;
}

/**
 * Prepare signature image data
 * @param {string} signatureDataURL - Canvas data URL
 * @returns {object} Signature data ready for PDF insertion
 */
export function prepareSignatureData(signatureDataURL) {
    return {
        pdfField: fieldMapping.signature.pdfField,
        imageData: signatureDataURL,
        position: fieldMapping.signature.position
    };
}
