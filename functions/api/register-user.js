export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Supabase invite registration is not configured." }, 503);
  }

  const fullName = String(body.full_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const inviteCode = String(body.invite_code || "").trim();
  const requestedRole = normalizeRole(String(body.requested_role || "").trim());
  const requestNote = String(body.request_note || "").trim();
  const phone = String(body.phone || "").trim();
  const shareEmail = Boolean(body.share_email);
  const sharePhone = Boolean(body.share_phone);

  if (!fullName) return json({ error: "Full name is required." }, 400);
  if (!email) return json({ error: "Email is required." }, 400);
  if (!password || password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);
  if (!inviteCode) return json({ error: "Invite code is required." }, 400);

  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json"
  };

  const inviteResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/invite_codes?code=eq.${encodeURIComponent(inviteCode)}&select=code,requested_role`,
    { headers }
  );
  if (!inviteResponse.ok) {
    const detail = await inviteResponse.text();
    return json({ error: "Unable to verify invite code.", detail }, 502);
  }
  const inviteRows = await inviteResponse.json();
  const invite = Array.isArray(inviteRows) ? inviteRows[0] : null;
  if (!invite) return json({ error: "Invite code is invalid." }, 400);

  const inviteRole = normalizeRole(invite.requested_role);
  if (requestedRole && inviteRole && requestedRole !== inviteRole) {
    return json({ error: `This invite only allows ${inviteRole} access.` }, 400);
  }

  const existingProfileResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id,email&limit=1`,
    { headers }
  );
  if (!existingProfileResponse.ok) {
    const detail = await existingProfileResponse.text();
    return json({ error: "Unable to verify existing account status.", detail }, 502);
  }
  const existingProfiles = await existingProfileResponse.json();
  const existingProfile = Array.isArray(existingProfiles) ? existingProfiles[0] || null : null;

  if (existingProfile?.id) {
    const confirmResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(existingProfile.id)}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          requested_role: inviteRole || requestedRole || "steward",
          invite_code: inviteCode,
          request_note: requestNote || `Invite: ${inviteCode}`,
          phone: phone || null,
          share_email: shareEmail,
          share_phone: sharePhone
        }
      })
    });
    if (!confirmResponse.ok) {
      const detail = await confirmResponse.text();
      return json({ error: "Supabase rejected the invite confirmation update.", detail }, 502);
    }

    const profileUpdateResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(existingProfile.id)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        full_name: fullName,
        phone: phone || null,
        share_email: shareEmail,
        share_phone: sharePhone,
        role: inviteRole || requestedRole || "steward",
        assigned_roles: [inviteRole || requestedRole || "steward"],
        active: true,
        access_status: "approved",
        request_note: requestNote || `Invite: ${inviteCode}`
      })
    });
    if (!profileUpdateResponse.ok) {
      const detail = await profileUpdateResponse.text();
      return json({ error: "Account email was confirmed, but profile activation failed.", detail }, 502);
    }

    return json({ ok: true, user_id: existingProfile.id, reused_existing_account: true });
  }

  const createResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        requested_role: inviteRole || requestedRole || "steward",
        invite_code: inviteCode,
        request_note: requestNote || `Invite: ${inviteCode}`,
        phone: phone || null,
        share_email: shareEmail,
        share_phone: sharePhone
      }
    })
  });

  if (!createResponse.ok) {
    const detailText = await createResponse.text();
    return json({ error: "Supabase rejected the invite registration request.", detail: detailText }, 502);
  }

  const createdUser = await createResponse.json();
  return json({ ok: true, user_id: createdUser?.id || createdUser?.user?.id || null });
}

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (!value) return "";
  return value === "election_committee" ? "committee" : value;
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
