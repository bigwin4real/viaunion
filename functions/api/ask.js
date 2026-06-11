const SOURCES = [
  {
    title: "Council 4000 Collective Agreements",
    url: "https://www.unifor4000.com/collective-agreements",
    notes: "Council 4000 lists VIA Rail Agreement No. 1 - National and Agreement No. 2 - National as 2025-2027, plus VIA supplemental agreements and the Safety and Health Agreement."
  },
  {
    title: "Council 4000 Bylaws & Constitution",
    url: "https://www.unifor4000.com/bylaws-constitution",
    notes: "Public page for National Council 4000 bylaws and the Unifor Constitution."
  },
  {
    title: "Council 4000 Grievance Forms",
    url: "https://www.unifor4000.com/grievance-forms",
    notes: "Public grievance form page with Local 4005 resources and other member links."
  },
  {
    title: "Union Savings",
    url: "https://unionsavings.ca/en",
    notes: "Member discount platform linked from Council 4000 resources."
  }
];

export async function onRequestPost({ request, env }) {
  if (!env.AI) return json({ error: "Cloudflare Workers AI binding is not configured." }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }

  const question = String(body.question || "").trim();
  if (!question) return json({ error: "Question is required." }, 400);

  const aiResponse = await env.AI.run(env.AI_MODEL || "@cf/meta/llama-3.1-8b-instruct", {
    messages: [
      {
        role: "system",
        content: "You answer public questions for a VIA Rail Local 4005 Moncton union board. Use only the supplied source notes. Do not give legal advice. If the answer requires exact contract interpretation, tell the user to verify the agreement and contact a steward."
      },
      {
        role: "user",
        content: `Question: ${question}\n\nSource notes:\n${SOURCES.map((source) => `- ${source.title}: ${source.notes} Source: ${source.url}`).join("\n")}`
      }
    ]
  });

  const answer = aiResponse.response || aiResponse.result || "I could not produce an answer from the available public notes.";
  return json({ answer, sources: SOURCES });
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
