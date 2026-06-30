const SOURCES = [
  {
    title: "Council 4000 Collective Agreements",
    url: "https://www.unifor4000.com/collective-agreements",
    notes: "Council 4000 lists VIA Rail Agreement No. 1 - National and Agreement No. 2 - National as 2025-2027, plus VIA supplemental agreements and the Safety and Health Agreement."
  }
];

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const question = String(body.question || "").trim();
  if (!question) return json({ error: "Question is required." }, 400);

  try {
    if (env.AI) {
      const aiResponse = await env.AI.run(env.AI_MODEL || "@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content: "You answer questions only about VIA Rail Agreement No. 1, Agreement No. 2, supplemental agreements, and the Safety and Health Agreement for Local 4005 members. Use only the supplied source notes. If the question is not about these agreements, say this tool is only for agreement questions. Do not give legal advice. If exact contract interpretation is needed, tell the user to verify the agreement text and contact a steward."
          },
          {
            role: "user",
            content: `Question: ${question}\n\nSource notes:\n${SOURCES.map((source) => `- ${source.title}: ${source.notes} Source: ${source.url}`).join("\n")}`
          }
        ]
      });

      const answer = aiResponse.response || aiResponse.result || "I could not produce an answer from the available public notes.";
      return json({ answer, sources: SOURCES, mode: "ai" });
    }
  } catch (error) {
    console.error("Agreement AI fallback", error);
  }

  return json({
    answer: fallbackAnswer(question),
    sources: SOURCES,
    mode: "fallback"
  });
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

function fallbackAnswer(question) {
  const normalized = question.toLowerCase();
  if (normalized.includes("contract 2") || normalized.includes("agreement no. 2")) {
    return "Council 4000 lists VIA Rail Agreement No. 2 - National as part of the current 2025-2027 collective agreements. Use the Council 4000 agreements page to open the current text and verify the exact article.";
  }
  if (normalized.includes("contract 1") || normalized.includes("agreement no. 1")) {
    return "Council 4000 lists VIA Rail Agreement No. 1 - National as part of the current 2025-2027 collective agreements. Use the Council 4000 agreements page to open the current text and verify the exact article.";
  }
  if (normalized.includes("safety")) {
    return "Council 4000 also links the VIA Rail Safety and Health Agreement from the agreements page. Open that agreement for the exact wording before relying on it.";
  }
  if (normalized.includes("supplement")) {
    return "Council 4000 lists supplemental agreements for VIA Rail alongside Agreement No. 1 and Agreement No. 2 on the collective agreements page.";
  }
  return "This agreement assistant is limited to the public VIA Rail agreement notes on this site. For exact interpretation, open the current agreement text and confirm the article with a steward.";
}
