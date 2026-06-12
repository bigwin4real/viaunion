// Signature Canvas Setup
const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Set canvas size
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

// Signature drawing functions
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
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
});

// Touch support for mobile
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
    e.preventDefault();
});

canvas.addEventListener('touchend', () => {
    isDrawing = false;
});

// Clear signature
document.getElementById('clearSignature').addEventListener('click', (e) => {
    e.preventDefault();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    
    // Validation
    if (!canvas.toDataURL().includes('image')) {
        showMessage('Please provide a signature', 'error');
        return;
    }
    
    try {
        document.getElementById('submitForm').disabled = true;
        showMessage('Processing your claim form...', 'info');
        
        // Collect form data
        const formData = new FormData(form);
        
        // Get signature as data URL
        const signatureData = canvas.toDataURL('image/png');
        formData.append('signature', signatureData);
        
        // Send to worker for PDF generation
        const response = await fetch('/api/generate-wages-pdf', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || 'Failed to generate PDF');
        }
        
        // Download the PDF
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
        
        // Optional: Show option to email
        setTimeout(() => {
            if (confirm('Would you like to email this completed form?')) {
                showEmailOption(formData);
            }
        }, 500);
        
    } catch (error) {
        console.error('Form submission error:', error);
        showMessage(`Error: ${error.message}`, 'error');
    } finally {
        document.getElementById('submitForm').disabled = false;
    }
});

async function showEmailOption(formData) {
    const email = document.getElementById('email').value;
    const proceed = confirm(`Send completed form to ${email}?`);
    
    if (!proceed) return;
    
    try {
        showMessage('Sending email...', 'info');
        
        const response = await fetch('/api/email-wages-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                memberName: document.getElementById('memberName').value,
                memberNumber: document.getElementById('memberNumber').value
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to send email');
        }
        
        showMessage('Email sent successfully!', 'success');
    } catch (error) {
        console.error('Email error:', error);
        showMessage(`Email error: ${error.message}`, 'error');
    }
}
