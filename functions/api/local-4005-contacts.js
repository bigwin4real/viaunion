const SOURCES = {
  executive: "https://www.unifor4000.com/contact",
  regional: "https://www.unifor4000.com/Representants-regionaux",
  local: "https://www.unifor.org/about-unifor/locals/local-4005"
};

const FALLBACK = {
  adminContact: {
    name: "Steve Harding",
    role: "President, Local 4005 / VP to the President of Council 4000",
    area: "Local 4005",
    contact: "Cell: (506) 627-8446",
    note: "Verified from Unifor National Council 4000 public contact page."
  },
  executiveTeam: [
    {
      name: "Steve Harding",
      role: "President, Local 4005 / VP to the President of Council 4000",
      area: "Local 4005",
      contact: "Cell: (506) 627-8446"
    },
    {
      name: "Rheanne Gautreau",
      role: "Regional Representative - Local 4005",
      area: "NB / PEI / NS / NL",
      contact: "Cell: (506) 871-2683"
    }
  ]
};

export async function onRequestGet() {
  try {
    const [executiveHtml, regionalHtml] = await Promise.all([
      fetchText(SOURCES.executive),
      fetchText(SOURCES.regional)
    ]);

    const president = parsePresident(executiveHtml) || FALLBACK.executiveTeam[0];
    const regional = parseRegionalRep(regionalHtml) || FALLBACK.executiveTeam[1];

    return json({
      adminContact: {
        ...president,
        note: "Pulled from Unifor National Council 4000 public contact details."
      },
      executiveTeam: [
        president,
        regional,
        { name: "To be confirmed", role: "Other Local 4005 executive positions", area: "Local 4005", contact: "Not listed on the public Unifor source pages." }
      ],
      sources: SOURCES,
      updatedAt: new Date().toISOString()
    });
  } catch {
    return json({ ...FALLBACK, sources: SOURCES, fallback: true, updatedAt: new Date().toISOString() });
  }
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Local4005MonctonSite/1.0" },
    cf: { cacheTtl: 3600, cacheEverything: true }
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  return normalize(await response.text());
}

function parsePresident(text) {
  const section = match(text, /President Local 4005\s+(.*?)\s+(?:Image|Privacy|©)/i);
  if (!section) return null;
  const name = match(section, /(?:VP to the President of Council 4000\s+)?([A-Z][A-Za-z' .-]+?)\s+Cell\s*:/);
  const phone = match(section, /Cell\s*:\s*([()+\d\s-]+)/i);
  if (!name) return null;
  return {
    name,
    role: section.includes("VP to the President") ? "President, Local 4005 / VP to the President of Council 4000" : "President, Local 4005",
    area: "Local 4005",
    contact: phone ? `Cell: ${phone.trim()}` : "Contact listed on Council 4000 contact page"
  };
}

function parseRegionalRep(text) {
  const section = match(text, /Regional Representative - Local 4005\s+(.*?)\s+Regional Representative - CNTL/i);
  if (!section) return null;
  const name = match(section, /(Rheanne Gautreau|[A-Z][A-Za-z' .-]+?)\s+11 Ocean/i);
  const phone = match(section, /Cell\s*:\s*([()+\d\s-]+)/i);
  if (!name) return null;
  return {
    name,
    role: "Regional Representative - Local 4005",
    area: "New Brunswick / Prince Edward Island / Nova Scotia / NL",
    contact: phone ? `Cell: ${phone.trim()}` : "Contact listed on Council 4000 regional representatives page"
  };
}

function normalize(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function match(text, pattern) {
  const result = text.match(pattern);
  return result ? result[1].trim() : "";
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
