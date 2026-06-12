const portalConfig = window.STEWARD_PORTAL_CONFIG || {};
const portalSupabaseUrl = portalConfig.supabaseUrl || "YOUR_SUPABASE_URL";
const portalSupabaseKey = portalConfig.supabaseAnonKey || "YOUR_SUPABASE_ANON_KEY";
const portalIsConfigured = portalSupabaseUrl.startsWith("https://") && portalSupabaseKey.length > 30;
const portalIsLocalPreview = ["localhost", "127.0.0.1", ""].includes(window.location.hostname) && new URLSearchParams(window.location.search).get("preview") === "1";

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
// Days of the week, matching functions/api/pdf-mapper.js
const DAYS = [
    { key: 'mon', label: 'Monday' },
    { key: 'tue', label: 'Tuesday' },
    { key: 'wed', label: 'Wednesday' },
    { key: 'thu', label: 'Thursday' },
    { key: 'fri', label: 'Friday' },
    { key: 'sat', label: 'Saturday' },
    { key: 'sun', label: 'Sunday' }
];

// Build the weekly grid rows
const dayGrid = document.getElementById('dayGrid');
for (const day of DAYS) {
    const row = document.createElement('div');
    row.className = 'day-row';
    row.innerHTML = `
        <div class="day-label">${day.label}</div>
        <input type="date" name="${day.key}Date" aria-label="${day.label} date">
        <input type="time" name="${day.key}From" aria-label="${day.label} from">
        <input type="time" name="${day.key}To" aria-label="${day.label} to">
        <input type="number" step="0.25" min="0" name="${day.key}Straight" aria-label="${day.label} straight time hours" placeholder="0.0">
        <input type="number" step="0.25" min="0" name="${day.key}Overtime" aria-label="${day.label} overtime hours" placeholder="0.0">
        <textarea name="${day.key}Reason" aria-label="${day.label} reason for claim" placeholder="Reason for claim"></textarea>
    `;
    dayGrid.appendChild(row);
}

// Signature Canvas Setup
const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let hasSignature = false;

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
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

// Form handling
const form = document.getElementById('wagesForm');
const messageDiv = document.getElementById('formMessage');

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

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!hasSignature) {
        showMessage('Please provide a signature', 'error');
        return;
    }

    try {
        document.getElementById('submitForm').disabled = true;
        showMessage('Generating your claim form PDF...', 'info');

        const formData = new FormData(form);

        const signatureData = canvas.toDataURL('image/png');
        formData.append('signature', signatureData);

        const response = await fetch('/api/generate-wages-pdf', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.error || error.message || 'Failed to generate PDF');
        }

        const blob = await response.blob();
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
}
