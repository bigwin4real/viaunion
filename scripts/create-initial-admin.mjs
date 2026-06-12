import { randomUUID } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const EMAIL = process.env.ADMIN_EMAIL;
const FULL_NAME = process.env.ADMIN_NAME || "Local 4005 Admin";
const TEMP_PASSWORD = process.env.ADMIN_TEMP_PASSWORD || randomUUID();

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !EMAIL) {
  console.error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and ADMIN_EMAIL before running this script.");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json"
};

const { user, created } = await createOrFindUser();
await patchProfile(user.id);
if (SUPABASE_ANON_KEY) await sendPasswordResetEmail();

console.log(`Created/updated admin account for ${FULL_NAME} <${EMAIL}>`);
if (created) console.log(`Temporary password: ${TEMP_PASSWORD}`);
else console.log("Auth user already existed; password was not changed.");
if (SUPABASE_ANON_KEY) console.log("Password reset email requested through Supabase.");

async function createOrFindUser() {
  const createdUser = await request("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: EMAIL,
      password: TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: FULL_NAME,
        requested_role: "admin",
        request_note: "Initial Local 4005 admin account"
      }
    })
  });

  if (!createdUser.error) return { user: createdUser, created: true };
  if (!String(createdUser.error.message || "").toLowerCase().includes("already")) {
    throw new Error(createdUser.error.message || JSON.stringify(createdUser.error));
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
      role: "admin",
      active: true,
      access_status: "approved",
      approved_at: new Date().toISOString()
    })
  });
}

async function sendPasswordResetEmail() {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: EMAIL })
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
  if (!response.ok && !data.error) {
    data.error = { message: data.message || text || response.statusText };
  }
  return data;
}
