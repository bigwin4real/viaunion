/**
 * Cloudflare Worker Function: Email Wages PDF
 * 
 * Optional email delivery for completed forms using Resend API
 * 
 * Setup:
 * 1. Create account at https://resend.com
 * 2. Get API key and verified sender email
 * 3. Set environment secrets:
 *    wrangler secret put RESEND_API_KEY
 *    wrangler secret put GRIEVANCE_FROM_EMAIL
 */

export default {
    async fetch(request, env) {
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        if (!env.RESEND_API_KEY || !env.GRIEVANCE_FROM_EMAIL) {
            return new Response(
                JSON.stringify({ 
                    message: 'Email service not configured. PDF has been generated.',
                    note: 'Steward/admin can manually email the completed form if needed.'
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        try {
            const body = await request.json();
            const { email, memberName, memberNumber } = body;

            if (!email || !memberName) {
                return new Response(
                    JSON.stringify({ error: 'Missing required fields' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: env.GRIEVANCE_FROM_EMAIL,
                    to: email,
                    subject: `Wages Lost Time and Expense Claim - Submitted`,
                    html: generateEmailHTML(memberName, memberNumber),
                    reply_to: env.GRIEVANCE_FROM_EMAIL
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Resend API error:', error);
                return new Response(
                    JSON.stringify({ 
                        error: 'Email service temporarily unavailable',
                        debug: error.message 
                    }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const result = await response.json();
            
            return new Response(
                JSON.stringify({ 
                    success: true,
                    message: 'Claim form email sent successfully',
                    emailId: result.id
                }),
                { 
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );

        } catch (error) {
            console.error('Email function error:', error);
            return new Response(
                JSON.stringify({ error: error.message }),
                { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
    }
};

function generateEmailHTML(memberName, memberNumber) {
    const currentDate = new Date().toLocaleDateString();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #003366; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
        .field { margin-bottom: 15px; }
        .field-label { font-weight: bold; color: #003366; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
        .success { color: #2e7d32; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Unifor Wages Lost Time and Expense Claim</h1>
            <p style="margin: 0;">Local 4005 - Moncton</p>
        </div>
        
        <div class="content">
            <p class="success">✓ Your claim form has been successfully submitted</p>
            
            <div class="field">
                <span class="field-label">Member Name:</span><br>
                ${escapeHtml(memberName)}
            </div>
            
            <div class="field">
                <span class="field-label">Member Number:</span><br>
                ${escapeHtml(memberNumber)}
            </div>
            
            <div class="field">
                <span class="field-label">Submission Date:</span><br>
                ${currentDate}
            </div>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            
            <h3 style="color: #003366;">Next Steps</h3>
            <ul>
                <li>Your completed claim form has been generated and is ready to submit</li>
                <li>Keep the PDF copy for your records</li>
                <li>Submit the form to your union steward or the Local 4005 office</li>
                <li>You will be notified of any additional documentation needed</li>
            </ul>
            
            <div class="footer">
                <p><strong>Important:</strong> This is an automated email. Please do not reply directly. For questions about your claim, contact your shop steward or the Local 4005 office.</p>
                <p>Unifor Local 4005 — VIA Rail Moncton</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
}
