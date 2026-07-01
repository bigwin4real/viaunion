export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const targetUserId = String(body.profileId || "").trim();
  if (!targetUserId) return json({ error: "Missing profileId." }, 400);

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Supabase admin confirmation is not configured." }, 503);
  }

  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return json({ error: "Missing authorization token." }, 401);

  const actorResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`
    }
  });
  if (!actorResponse.ok) return json({ error: "Unable to verify current session." }, 401);
  const actor = await actorResponse.json();
  const actorId = actor?.id;
  if (!actorId) return json({ error: "Unable to verify current session." }, 401);

  const adminProfileResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(actorId)}&select=id,role,assigned_roles,active,access_status`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );
  if (!adminProfileResponse.ok) return json({ error: "Unable to verify admin access." }, 403);
  const [adminProfile] = await adminProfileResponse.json();
  const assignedRoles = Array.isArray(adminProfile?.assigned_roles) ? adminProfile.assigned_roles : [];
  const isAdmin = adminProfile?.active && (adminProfile?.role === "admin" || assignedRoles.includes("admin"));
  if (!isAdmin) return json({ error: "Admin access required." }, 403);

  const confirmResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(targetUserId)}`, {
    method: "PUT",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email_confirm: true })
  });
  if (!confirmResponse.ok) {
    const detail = await confirmResponse.text();
    return json({ error: "Supabase rejected the email confirmation update.", detail }, 502);
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
