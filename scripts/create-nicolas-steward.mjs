import { randomUUID } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const EMAIL = "hacheyn@me.com";
const FULL_NAME = "Nicolas Hachey";
const PUBLIC_TITLE = "Shop Steward";
const LOCATION = "Moncton VCC";
const CONTRACT = "Contract 1";
const TEMP_PASSWORD = process.env.NICOLAS_TEMP_PASSWORD || randomUUID();
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || "https://viarail4005moncton.pages.dev";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json"
};

const { user, created } = await createOrFindUser();
await patchProfile(user.id);
await upsertDirectoryEntry(user.id);
if (SUPABASE_ANON_KEY) await sendPasswordResetEmail();

console.log(`Created/updated steward account for ${FULL_NAME} <${EMAIL}>`);
if (created) {
  console.log(`Temporary password: ${TEMP_PASSWORD}`);
} else {
  console.log("Auth user already existed; password was not changed.");
}
console.log("Ask Nicolas to sign in and change the password after Supabase email/password auth is configured.");
if (SUPABASE_ANON_KEY) {
  console.log("Password reset email requested through Supabase.");
} else {
  console.log("Set SUPABASE_ANON_KEY as well if you want this script to request the password reset email.");
}

async function createOrFindUser() {
  const created = await requestAllowError("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: EMAIL,
      password: TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: FULL_NAME,
        requested_role: "steward",
        request_note: "Initial Moncton VCC shop steward account"
      }
    })
  });

  if (!created.error) return { user: created, created: true };
  if (!String(created.error.message || "").toLowerCase().includes("already")) {
    throw new Error(created.error.message || JSON.stringify(created.error));
  }

  const existing = await findUserByEmail(EMAIL);
  if (!existing) throw new Error("User already exists but could not be found.");
  return { user: existing, created: false };
}

async function findUserByEmail(email) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const users = await request(`/auth/v1/admin/users?page=${page}&per_page=100`);
    const existing = users.users?.find((item) => item.email?.toLowerCase() === target);
    if (existing) return existing;
    if (!users.users || users.users.length < 100) return null;
  }
  return null;
}

async function patchProfile(userId) {
  await request("/rest/v1/profiles?on_conflict=id", {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: userId,
      email: EMAIL,
      full_name: FULL_NAME,
      share_email: false,
      share_phone: false,
      role: "steward",
      active: true,
      access_status: "approved",
      approved_at: new Date().toISOString()
    })
  });
}

async function upsertDirectoryEntry(profileId) {
  await request("/rest/v1/public_directory_entries?on_conflict=profile_id,directory_role", {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      profile_id: profileId,
      directory_role: "steward",
      display_name: FULL_NAME,
      public_title: PUBLIC_TITLE,
      location: LOCATION,
      contract: CONTRACT,
      public_contact: null,
      is_public: true,
      display_order: 10
    })
  });
}

async function sendPasswordResetEmail() {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(PUBLIC_SITE_URL)}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: EMAIL
    })
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Could not request password reset email: ${text}`);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.message || data.error?.message || text || response.statusText);
  }
  return data;
}

async function requestAllowError(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok && !data.error) {
    data.error = { message: data.message || data.msg || text || response.statusText };
  }
  return data;
}
