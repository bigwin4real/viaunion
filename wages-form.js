const portalConfig = window.STEWARD_PORTAL_CONFIG || {};
const portalSupabaseUrl = portalConfig.supabaseUrl || "YOUR_SUPABASE_URL";
const portalSupabaseKey = portalConfig.supabaseAnonKey || "YOUR_SUPABASE_ANON_KEY";
const portalIsConfigured = portalSupabaseUrl.startsWith("https://") && portalSupabaseKey.length > 30;
const portalIsLocalPreview = ["localhost", "127.0.0.1", ""].includes(window.location.hostname) && new URLSearchParams(window.location.search).get("preview") === "1";
const PDF_TEMPLATE_NAME = "Wages Lost Time and Expense_Bilingual_Fillable_Revised Mar 26.pdf";
const REASON_PREFIX = "RAISONS DE LA RÉCLAMATION REASONS FOR CLAIM GIVE FULL DETAILS TERMS SUCH AS UNION BUSINESS ETC ARE NOT SUFFICIENT DONNER DES DÉTAILS PRÉCIS LES RAISONS COMME TRAVAIL DE SYNDICAT ETC NE SONT PAS SUFFISANTES";

initWagesForm();

async function initWagesForm() {
    const allowed = await canAccessWagesForm();
    if (!allowed) return;
    document.body.classList.remove("locked");
    setupWagesForm();
}

async function canAccessWagesForm() {
    if (portalIsLocalPreview) return true;
    if (!portalIsConfigured || !window.supabase) return false;

    const client = window.supabase.createClient(portalSupabaseUrl, portalSupabaseKey);
    const { data: userData } = await client.auth.getUser();
    const user = userData?.user;
    if (!user) return false;

    const { data: profile, error } = await client
        .from("profiles")
        .select("role, active")
        .eq("id", user.id)
        .single();

    if (error || !profile?.active) return false;
    return ["admin", "steward"].includes(profile.role);
}

function setupWagesForm() {
    const form = document.getElementById('wagesForm');
    const messageDiv = document.getElementById('formMessage');
    const dayGrid = document.getElementById('dayGrid');
    const generalReasonPanel = document.getElementById('general-reason-panel');

    // Days of the week, matching the official PDF row labels.
    const DAYS = [
        { key: 'mon', label: 'Monday' },
        { key: 'tue', label: 'Tuesday' },
        { key: 'wed', label: 'Wednesday' },
        { key: 'thu', label: 'Thursday' },
        { key: 'fri', label: 'Friday' },
        { key: 'sat', label: 'Saturday' },
        { key: 'sun', label: 'Sunday' }
    ];

    for (const day of DAYS) {
        const row = document.createElement('div');
        row.className = 'day-row disabled';
        row.dataset.dayKey = day.key;
        row.innerHTML = `
            <label class="day-enable">
                <input type="checkbox" name="${day.key}Enabled" aria-label="Include ${day.label}">
                <span>${day.label}</span>
            </label>
            <label class="day-field">
                <span>Date</span>
                <input type="date" name="${day.key}Date" aria-label="${day.label} date" disabled>
            </label>
            <label class="day-field">
                <span>From</span>
                <input type="time" name="${day.key}From" aria-label="${day.label} from" disabled>
            </label>
            <label class="day-field">
                <span>To</span>
                <input type="time" name="${day.key}To" aria-label="${day.label} to" disabled>
            </label>
            <label class="day-field reason-field">
                <span>Reason for claim</span>
                <textarea name="${day.key}Reason" aria-label="${day.label} reason for claim" placeholder="Reason for claim" disabled></textarea>
            </label>
        `;
        dayGrid.appendChild(row);
    }

function syncClaimMode() {
    const mode = form.querySelector('input[name="claimMode"]:checked')?.value || "general";
    const useDays = mode === "days";
    dayGrid.hidden = !useDays;
    generalReasonPanel.hidden = useDays;
}

function syncDayRow(row) {
    const enabled = row.querySelector('input[type="checkbox"]').checked;
    row.classList.toggle("disabled", !enabled);
    row.querySelectorAll(".day-field input, .day-field textarea").forEach((field) => {
        field.disabled = !enabled;
        if (!enabled) field.value = "";
    });
}

form.querySelectorAll('input[name="claimMode"]').forEach((input) => {
    input.addEventListener("change", syncClaimMode);
});

dayGrid.querySelectorAll(".day-row").forEach((row) => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    checkbox.addEventListener("change", () => syncDayRow(row));
    syncDayRow(row);
});
syncClaimMode();

// Signature Canvas Setup
const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let hasSignature = false;

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
    isDrawing = true;
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
    hasSignature = true;
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
});

canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    lastX = touch.clientX - rect.left;
    lastY = touch.clientY - rect.top;
    isDrawing = true;
    e.preventDefault();
});

canvas.addEventListener('touchmove', (e) => {
    if (!isDrawing) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
    hasSignature = true;
    e.preventDefault();
});

canvas.addEventListener('touchend', () => {
    isDrawing = false;
});

document.getElementById('clearSignature').addEventListener('click', (e) => {
    e.preventDefault();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature = false;
});

function showMessage(text, type = 'info') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    setTimeout(() => {
        if (type !== 'success') {
            messageDiv.className = 'message';
        }
    }, type === 'success' ? 3000 : 5000);
}

function resetForm() {
    form.reset();
    setCombinedName();
    dayGrid.querySelectorAll(".day-row").forEach(syncDayRow);
    syncClaimMode();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature = false;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('signatureDate').value = today;
}

document.getElementById('resetForm').addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
});

// Set today's date by default
document.getElementById('signatureDate').valueAsDate = new Date();
document.getElementById('firstName').addEventListener('input', setCombinedName);
document.getElementById('lastName').addEventListener('input', setCombinedName);

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setCombinedName();

    if (!hasSignature) {
        showMessage('Please provide a signature', 'error');
        return;
    }
    if (!hasClaimDetails()) {
        showMessage('Enter a general reason, or select at least one day and fill in details for that day.', 'error');
        return;
    }

    try {
        document.getElementById('submitForm').disabled = true;
        showMessage('Generating your claim form PDF...', 'info');

        const pdfBytes = await makePdf();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Wages-Claim-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        showMessage('PDF generated and downloaded successfully!', 'success');

        const email = document.getElementById('email').value;
        if (email) {
            setTimeout(() => {
                if (confirm(`Would you like to email a copy of this submission confirmation to ${email}?`)) {
                    sendConfirmationEmail(email);
                }
            }, 500);
        }

    } catch (error) {
        console.error('Form submission error:', error);
        showMessage(`Error: ${error.message}`, 'error');
    } finally {
        document.getElementById('submitForm').disabled = false;
    }
});

async function sendConfirmationEmail(email) {
    try {
        showMessage('Sending confirmation email...', 'info');

        const response = await fetch('/api/email-wages-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                memberName: document.getElementById('memberName').value
            })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.error || 'Failed to send email');
        }

        showMessage(result.message || 'Email sent successfully!', 'success');
    } catch (error) {
        console.error('Email error:', error);
        showMessage(`Email error: ${error.message}`, 'error');
    }
}

async function makePdf() {
    if (!window.PDFLib) throw new Error("PDF tools are still loading. Try again in a moment.");

    const templateResponse = await fetch(encodeURI(PDF_TEMPLATE_NAME));
    if (!templateResponse.ok) throw new Error("Could not load the official PDF template.");

    const pdfDoc = await window.PDFLib.PDFDocument.load(await templateResponse.arrayBuffer());
    const pdfForm = pdfDoc.getForm();
    const formData = new FormData(form);

    setPdfText(pdfForm, "Nom", formData.get("memberName"));
    setPdfText(pdfForm, "Adresse 1", formData.get("address1"));
    setPdfText(pdfForm, "Adresse 2", formData.get("address2"));
    setPdfText(pdfForm, "Code postal", formData.get("postalCode"));
    setPdfText(pdfForm, "Employee number", formData.get("employeeNumber"));
    setPdfText(pdfForm, "Submitted by", formData.get("submittedBy"));
    setPdfText(pdfForm, "WORKPLACE", formData.get("workplace"));
    setPdfText(pdfForm, "CLASSIFICATION", formData.get("classification"));
    setPdfText(pdfForm, "NAS", formData.get("sin"));
    setPdfText(pdfForm, "UNITUNITÉ", formData.get("unit"));
    setPdfText(pdfForm, "LOCAL UNIONSYNDICAT LOCAL", formData.get("localUnion"));
    setPdfText(pdfForm, "Payroll Period EndingPériode de paye terminé le", formatDate(formData.get("payrollPeriodEnding")));

    const suffixes = {
        mon: "MON LUN",
        tue: "TUES MAR",
        wed: "WED MER",
        thu: "THUR JEU",
        fri: "FRI VEN",
        sat: "SAT SAM",
        sun: "SUN DIM"
    };

    const claimMode = formData.get("claimMode") || "general";
    if (claimMode === "general") {
        const reason = formData.get("generalReason");
        if (reason) setPdfText(pdfForm, `${REASON_PREFIX}MON LUN`, reason);
    }

    for (const [key, suffix] of Object.entries(suffixes)) {
        if (claimMode !== "days" || !formData.get(`${key}Enabled`)) continue;
        setPdfText(pdfForm, `DATE${suffix}`, formatDate(formData.get(`${key}Date`)));
        setPdfText(pdfForm, `FROMDE${suffix}`, formData.get(`${key}From`));
        setPdfText(pdfForm, `TOÀ${suffix}`, formData.get(`${key}To`));
        setPdfText(pdfForm, `${REASON_PREFIX}${suffix}`, formData.get(`${key}Reason`));
    }

    setPdfText(pdfForm, "MUST BE SIGNED BY CLAIMANTDOIT ÉTRE SIGNÉ PAR LE DEMANDEUR", formatDate(formData.get("signatureDate")));

    const signatureImage = await pdfDoc.embedPng(canvas.toDataURL("image/png"));
    pdfDoc.getPages()[0].drawImage(signatureImage, {
        x: 405,
        y: 83,
        width: 178,
        height: 42
    });

    pdfForm.flatten();
    return pdfDoc.save();
}

function setCombinedName() {
    const first = document.getElementById('firstName')?.value.trim() || "";
    const last = document.getElementById('lastName')?.value.trim() || "";
    document.getElementById('memberName').value = [first, last].filter(Boolean).join(" ");
}

function hasClaimDetails() {
    const formData = new FormData(form);
    const claimMode = formData.get("claimMode") || "general";
    if (claimMode === "general") return Boolean(String(formData.get("generalReason") || "").trim());
    return DAYS.some((day) => {
        if (!formData.get(`${day.key}Enabled`)) return false;
        return [
            `${day.key}Date`,
            `${day.key}From`,
            `${day.key}To`,
            `${day.key}Reason`
        ].some((field) => Boolean(String(formData.get(field) || "").trim()));
    });
}

function setPdfText(pdfForm, fieldName, value) {
    try {
        const text = value ? String(value).trim() : "";
        if (text) pdfForm.getTextField(fieldName).setText(text);
    } catch {
        // Some official PDF fields vary by template revision; skip missing fields.
    }
}

function formatDate(value) {
    if (!value) return "";
    const parts = String(value).split("-");
    if (parts.length !== 3) return String(value);
    const [year, month, day] = parts;
    return `${month}/${day}/${year}`;
}
}
