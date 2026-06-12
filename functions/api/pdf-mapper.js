/**
 * PDF Field Mapper
 *
 * Maps web form fields to the ACTUAL AcroForm field names found in
 * "Wages Lost Time and Expense_Bilingual_Fillable_Revised Mar 26.pdf".
 *
 * The PDF is a single-page bilingual (EN/FR) Unifor voucher with:
 *  - A header block (name, address, workplace, classification, SIN, unit,
 *    local union, payroll period ending)
 *  - A Monday-Sunday grid, each day having: Date, From, To, Straight time
 *    hours, Overtime hours, and a "Reason for claim" text box
 *  - Subtotal / total hour rows for straight time and overtime
 *  - A claimant signature + date field
 *  - Several office-use-only fields (rates, deductions, totals, approvals)
 *    which are intentionally left blank by the web form.
 */

// Header / member information fields
export const headerFieldMapping = {
    memberName: 'Nom',
    address1: 'Adresse 1',
    address2: 'Adresse 2',
    postalCode: 'Code postal',
    workplace: 'WORKPLACE',
    classification: 'CLASSIFICATION',
    sin: 'NAS',
    unit: 'UNITUNITÉ',
    localUnion: 'LOCAL UNIONSYNDICAT LOCAL',
    payrollPeriodEnding: 'Payroll Period EndingPériode de paye terminé le'
};

// Days of the week, in the order they appear on the form (Mon-Sun),
// each mapped to its PDF field-name suffix.
export const days = [
    { key: 'mon', suffix: 'MON LUN', label: 'Monday' },
    { key: 'tue', suffix: 'TUES MAR', label: 'Tuesday' },
    { key: 'wed', suffix: 'WED MER', label: 'Wednesday' },
    { key: 'thu', suffix: 'THUR JEU', label: 'Thursday' },
    { key: 'fri', suffix: 'FRI VEN', label: 'Friday' },
    { key: 'sat', suffix: 'SAT SAM', label: 'Saturday' },
    { key: 'sun', suffix: 'SUN DIM', label: 'Sunday' }
];

const REASON_PREFIX =
    'RAISONS DE LA RÉCLAMATION REASONS FOR CLAIM GIVE FULL DETAILS TERMS SUCH AS UNION BUSINESS ETC ARE NOT SUFFICIENT DONNER DES DÉTAILS PRÉCIS LES RAISONS COMME TRAVAIL DE SYNDICAT ETC NE SONT PAS SUFFISANTES';

/**
 * Build the PDF field names for a single day row.
 */
export function dayFieldMapping(day) {
    return {
        date: `DATE${day.suffix}`,
        from: `FROMDE${day.suffix}`,
        to: `TOÀ${day.suffix}`,
        straight: `STRAIGHT RÉGULIÉRES${day.suffix}`,
        overtime: `OVERTIME SUPPLÉMENTAIRES${day.suffix}`,
        reason: `${REASON_PREFIX}${day.suffix}`
    };
}

// Subtotal / total fields (computed automatically from the grid)
export const totalsFieldMapping = {
    straightSubtotal: 'STRAIGHT RÉGULIÉRESSUBTOTALSSOMMES PARTIELLES',
    overtimeSubtotal: 'OVERTIME SUPPLÉMENTAIRESSUBTOTALSSOMMES PARTIELLES',
    straightTotal: 'STRAIGHT RÉGULIÉRESTOTAL HOURSTOTAUX HORAIRE',
    overtimeTotal: 'OVERTIME SUPPLÉMENTAIRESTOTAL HOURSTOTAUX HORAIRE'
};

// Claimant signature/date field (the only section a member fills/signs)
export const signatureFieldMapping = {
    signatureDate: 'MUST BE SIGNED BY CLAIMANTDOIT ÉTRE SIGNÉ PAR LE DEMANDEUR'
};
