export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const targetUserId = String(body.profileId || "").trim();
  const targetEmail = String(body.email || "").trim().toLowerCase();
  const targetUsername = normalizeUsername(body.username || "");
  if (!targetUserId && !targetEmail && !targetUsername) return json({ error: "Missing profile target." }, 400);

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Supabase admin repair is not configured." }, 503);
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

  const adminProfile = await findAdminProfile(env, actor, token);
  if (adminProfile === undefined) return json({ error: "Unable to verify admin access." }, 403);
  const assignedRoles = normalizeRoles(adminProfile?.assigned_roles);
  const directRole = normalizeRole(adminProfile?.role);
  const isAdmin =
    adminProfile?.active === true
    && (adminProfile?.access_status === "approved" || !adminProfile?.access_status)
    && (directRole === "admin" || assignedRoles.includes("admin"));
  if (!isAdmin) {
    return json({ error: "Admin access required." }, 403);
  }

  const serviceHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
  };
  const targetProfile = await findTargetProfile(env, { id: targetUserId, email: targetEmail, username: targetUsername }, serviceHeaders);
  if (targetProfile === undefined) return json({ error: "Unable to load the target profile." }, 502);
  if (!targetProfile) return json({ error: "Target profile was not found." }, 404);

  const normalizedAssignedRoles = normalizeRoles(targetProfile.assigned_roles);
  const normalizedRole = normalizeRole(targetProfile.role) || normalizedAssignedRoles[0] || "committee";

  const confirmResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(targetProfile.id)}`, {
    method: "PUT",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email_confirm: true,
      user_metadata: {
        full_name: targetProfile.full_name || targetProfile.email || "",
        username: targetProfile.username || "",
        requested_role: normalizedRole,
        phone: targetProfile.phone || null,
        share_email: !!targetProfile.share_email,
        share_phone: !!targetProfile.share_phone
      }
    })
  });
  if (!confirmResponse.ok) {
    const detail = await confirmResponse.text();
    return json({ error: "Supabase rejected the access repair update.", detail }, 502);
  }

  const profileRepairResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(targetProfile.id)}`, {
    method: "PATCH",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      active: true,
      access_status: "approved",
      role: normalizedRole,
      assigned_roles: normalizedAssignedRoles.length ? normalizedAssignedRoles : [normalizedRole],
      approved_by: actorId,
      approved_at: new Date().toISOString()
    })
  });
  if (!profileRepairResponse.ok) {
    const detail = await profileRepairResponse.text();
    return json({ error: "Auth email was confirmed, but profile repair failed.", detail }, 502);
  }

  return json({ ok: true, repaired: true });
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

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (!value) return "";
  return value === "election_committee" ? "committee" : value;
}

function normalizeRoles(roles) {
  if (Array.isArray(roles)) return roles.map(normalizeRole).filter(Boolean);
  if (typeof roles === "string") {
    return roles
      .replace(/^\{|\}$/g, "")
      .split(",")
      .map((value) => value.replace(/^"|"$/g, ""))
      .map(normalizeRole)
      .filter(Boolean);
  }
  return [];
}

async function findAdminProfile(env, actor, userToken) {
  const serviceHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
  };
  const userHeaders = {
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${userToken}`
  };

  const bySession = await fetchProfileById(env, actor?.id || "", userHeaders);
  if (bySession !== undefined && bySession) return bySession;

  const byServiceId = await fetchProfileById(env, actor?.id || "", serviceHeaders);
  if (byServiceId !== undefined && byServiceId) return byServiceId;

  if (bySession === undefined || byServiceId === undefined) return undefined;

  const actorEmail = String(actor?.email || "").trim();
  if (actorEmail) {
    const byEmailResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/profiles?email=ilike.${encodeURIComponent(actorEmail)}&select=id,email,role,assigned_roles,active,access_status,created_at&order=created_at.desc`,
      { headers: serviceHeaders }
    );
    if (!byEmailResponse.ok) return undefined;
    const byEmail = await byEmailResponse.json();
    if (Array.isArray(byEmail) && byEmail[0]) return byEmail[0];
  }

  const actorUsername = normalizeUsername(
    actor?.user_metadata?.username
      || actor?.app_metadata?.username
      || ""
  );
  if (!actorUsername) return null;

  const byUsernameResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?username=eq.${encodeURIComponent(actorUsername)}&select=id,email,role,assigned_roles,active,access_status,created_at&order=created_at.desc`,
    { headers: serviceHeaders }
  );
  if (!byUsernameResponse.ok) return undefined;
  const byUsername = await byUsernameResponse.json();
  return Array.isArray(byUsername) ? byUsername[0] || null : null;
}

async function fetchProfileById(env, id, headers) {
  if (!id) return null;
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=id,email,role,assigned_roles,active,access_status`,
    { headers }
  );
  if (!response.ok) return undefined;
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function findTargetProfile(env, target, headers) {
  const select = "id,email,username,role,assigned_roles,share_email,share_phone,full_name,phone";
  if (target.id) {
    const byId = await fetchProfileRows(env, `id=eq.${encodeURIComponent(target.id)}&select=${select}`, headers);
    if (byId === undefined) return undefined;
    if (byId[0]) return byId[0];
  }
  if (target.email) {
    const byEmail = await fetchProfileRows(env, `email=ilike.${encodeURIComponent(target.email)}&select=${select}&order=created_at.desc`, headers);
    if (byEmail === undefined) return undefined;
    if (byEmail[0]) return byEmail[0];
  }
  if (target.username) {
    const byUsername = await fetchProfileRows(env, `username=eq.${encodeURIComponent(target.username)}&select=${select}&order=created_at.desc`, headers);
    if (byUsername === undefined) return undefined;
    if (byUsername[0]) return byUsername[0];
  }
  return null;
}

async function fetchProfileRows(env, query, headers) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?${query}`, { headers });
  if (!response.ok) return undefined;
  const rows = await response.json();
  return Array.isArray(rows) ? rows : [];
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
