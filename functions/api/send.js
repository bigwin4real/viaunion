export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const name = body.name || "Submission";
    const pdf = body.pdf;

    if (!env.RESEND_API_KEY || !env.MAIL_TO || !env.MAIL_FROM) {
      return new Response("Missing email environment variables", { status: 500 });
    }

    const payload = {
      from: env.MAIL_FROM,
      to: [env.MAIL_TO],
      subject: `Unifor Local 4005 Lost Time Form - ${name}`,
      text: "Attached is a completed Unifor Local 4005 lost time / expense form.",
      attachments: [
        {
          filename: "Unifor_Local_4005_Lost_Time_Form.pdf",
          content: pdf
        }
      ]
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(error, { status: 500 });
    }

    return new Response("Sent", { status: 200 });
  } catch (err) {
    return new Response(err.message || "Email failed", { status: 500 });
  }
}
