export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const required = ["memberName", "memberEmail", "agreement", "issueType", "summary", "to", "subject", "body"];
  const missing = required.filter((field) => !String(body[field] || "").trim());
  if (missing.length) return json({ error: `Missing required fields: ${missing.join(", ")}` }, 400);

  if (!env.RESEND_API_KEY || !env.GRIEVANCE_FROM_EMAIL) {
    return json({ error: "Email sending is not configured." }, 503);
  }

  const recipients = [body.to];
  const cc = body.cc ? [body.cc] : [];
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.GRIEVANCE_FROM_EMAIL,
      to: recipients,
      cc,
      reply_to: body.memberEmail,
      subject: body.subject,
      text: body.body
    })
  });

  if (!response.ok) {
    const text = await response.text();
    return json({ error: "Email provider rejected the message.", detail: text }, 502);
  }

  return json({ ok: true });
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
