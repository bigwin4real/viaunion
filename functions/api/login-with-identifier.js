export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Supabase login is not configured." }, 503);
  }

  const identifier = String(body.identifier || "").trim();
  const password = String(body.password || "");
  if (!identifier || !password) return json({ error: "Username/email and password are required." }, 400);

  const email = identifier.includes("@")
    ? identifier.toLowerCase()
    : await lookupEmailByUsername(env, identifier);

  if (!email) return json({ error: "Invalid username/email or password." }, 401);

  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.msg === "string" ? payload.msg : (payload?.error_description || payload?.error || "Invalid username/email or password.");
    return json({ error: /confirm/i.test(message) ? "This account is approved, but the email is not confirmed yet. Ask an admin to use Repair access." : message }, response.status);
  }

  return json({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token
  });
}

async function lookupEmailByUsername(env, identifier) {
  const username = normalizeUsername(identifier);
  if (!username) return "";
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=email&limit=1`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );
  if (!response.ok) return "";
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? String(rows[0]?.email || "").trim().toLowerCase() : "";
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
