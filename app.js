const config = window.STEWARD_PORTAL_CONFIG || {};
const SUPABASE_URL = config.supabaseUrl || "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = config.supabaseAnonKey || "YOUR_SUPABASE_ANON_KEY";
const DOCUMENT_BUCKET = config.documentBucket || "steward-documents";

const isConfigured = SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 30;
const isLocalhost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const previewMode = !isConfigured && isLocalhost && new URLSearchParams(window.location.search).get("preview") === "1";
const supabaseClient = isConfigured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const sampleCases = [
  { id: "preview-1", member_name: "Sample Member", member_contact: "member@example.ca", contract: "Contract 1", issue_type: "Grievance", status: "Intake", next_deadline: nextDate(3), next_action: "Confirm facts and collect supporting documents", summary: "Example intake for a scheduling dispute. Replace with real data after Supabase is configured.", assigned_steward_id: null, created_at: new Date().toISOString() },
  { id: "preview-2", member_name: "Training Case", member_contact: "555-0100", contract: "Contract 2", issue_type: "Payroll", status: "Waiting on company", next_deadline: nextDate(6), next_action: "Follow up with company representative", summary: "Example payroll claim tracking item for steward workflow testing.", assigned_steward_id: null, created_at: new Date().toISOString() }
];

const sampleResources = [
  { id: "r1", title: "Collective Agreements", category: "Agreements", contract: "Shared", description: "Protected links to Contract 1 and Contract 2 reference copies.", url: "#" },
  { id: "r2", title: "Grievance Template", category: "Templates", contract: "Shared", description: "Standard form language and filing checklist for shop stewards.", url: "#" },
  { id: "r3", title: "Claims and Payroll Guide", category: "Guides", contract: "Contract 2", description: "Common claim paths, supporting evidence, and follow-up notes.", url: "#" },
  { id: "r4", title: "Moncton Steward Contacts", category: "Contacts", contract: "Shared", description: "Internal contacts placeholder for authorized users only.", url: "#" },
  { id: "r5", title: "Health and Safety Notes", category: "Committees", contract: "Shared", description: "Committee notes, inspection references, and escalation paths.", url: "#" },
  { id: "r6", title: "Meeting Minutes", category: "Meetings", contract: "Shared", description: "Protected meeting records and action items.", url: "#" }
];

const publicAnnouncements = [
  { title: "Welcome to the Local 4005 Moncton union board", date: "2026-06-10", contract: "Shared", category: "Notice", summary: "Public notices, member resources, and Contract 1 / Contract 2 updates will appear here." },
  { title: "Contract 1 resources", date: "2026-06-10", contract: "Contract 1", category: "Resources", summary: "Use this section for public-safe Contract 1 guides, meeting notices, and general information." },
  { title: "Contract 2 resources", date: "2026-06-10", contract: "Contract 2", category: "Resources", summary: "Use this section for public-safe Contract 2 guides, meeting notices, and general information." }
];

const publicResources = [
  { title: "Collective agreements", category: "Agreements", contract: "Shared", description: "Public or member-safe agreement references and update notes." },
  { title: "Meetings", category: "Meetings", contract: "Shared", description: "Meeting notices and general agenda information." },
  { title: "New member guide", category: "Guide", contract: "Shared", description: "Plain-language starting point for Local 4005 members." },
  { title: "Claims and payroll", category: "Guide", contract: "Shared", description: "Public-safe guidance on where to start with common questions." },
  { title: "Health and safety", category: "Committee", contract: "Shared", description: "Committee information and public-safe safety resources." },
  { title: "Contact a steward", category: "Support", contract: "Shared", description: "Use this area for approved contact instructions." }
];

let currentUser = null;
let currentProfile = null;
let cases = [];
let resources = [];
let notes = [];
let documents = [];
let selectedCaseId = null;

const app = document.querySelector("#app");

if (previewMode) {
  currentUser = { id: "preview-user", email: "preview@local4005.test" };
  currentProfile = { id: "preview-user", full_name: "Preview Steward", role: "steward" };
  cases = [...sampleCases];
  resources = [...sampleResources];
  renderPortal();
} else if (isConfigured) {
  startAuthenticatedApp();
  wirePublicBoard();
} else {
  wirePublicBoard();
}

async function startAuthenticatedApp() {
  const { data } = await supabaseClient.auth.getUser();
  currentUser = data.user;
  if (!currentUser) return;

  const { data: profile, error } = await supabaseClient.from("profiles").select("*").eq("id", currentUser.id).single();
  if (error || !profile?.active) {
    await supabaseClient.auth.signOut();
    const authMessage = document.querySelector("#auth-message");
    if (authMessage) authMessage.textContent = "This account is not authorized for the steward portal.";
    return;
  }

  currentProfile = profile;
  await loadData();
  renderPortal();
}

function wirePublicBoard() {
  renderPublicBoard();
  document.querySelector("#staff-login")?.addEventListener("click", renderAuth);
  ["public-search", "public-contract"].forEach((id) => {
    document.querySelector(`#${id}`)?.addEventListener("input", renderPublicBoard);
  });
}

function renderPublicBoard() {
  const term = document.querySelector("#public-search")?.value.trim().toLowerCase() || "";
  const contract = document.querySelector("#public-contract")?.value || "all";
  const matches = (item) => {
    const text = [item.title, item.category, item.contract, item.summary, item.description].join(" ").toLowerCase();
    return (!term || text.includes(term)) && (contract === "all" || item.contract === contract || item.contract === "Shared");
  };
  const announcements = publicAnnouncements.filter(matches);
  const announcementList = document.querySelector("#announcement-list");
  const announcementTotal = document.querySelector("#announcement-total");
  if (announcementTotal) announcementTotal.textContent = `${announcements.length} shown`;
  if (announcementList) {
    announcementList.innerHTML = announcements.map((item) => `
      <article class="announcement-card">
        <div class="meta-row">
          <span class="pill">${escapeHtml(item.contract)}</span>
          <span class="pill">${escapeHtml(item.category)}</span>
          <span class="pill">${escapeHtml(item.date)}</span>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
      </article>
    `).join("") || `<div class="empty">No public notices match the current filters.</div>`;
  }

  const resourceList = document.querySelector("#public-resource-list");
  const publicRows = publicResources.filter(matches);
  if (resourceList) {
    resourceList.innerHTML = publicRows.map((item) => `
      <article class="resource-item">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <div class="meta-row">
          <span class="pill">${escapeHtml(item.category)}</span>
          <span class="pill">${escapeHtml(item.contract)}</span>
        </div>
      </article>
    `).join("") || `<div class="empty">No resources match the current filters.</div>`;
  }
}

function renderAuth() {
  app.innerHTML = document.querySelector("#auth-template").innerHTML;
  document.querySelector("#back-public").addEventListener("click", () => window.location.reload());
  document.querySelector("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const authMessage = document.querySelector("#auth-message");
    if (!isConfigured) {
      authMessage.innerHTML = `Supabase is not configured. Create <strong>config.js</strong> from <strong>config.example.js</strong> with your project URL and anon key.`;
      if (isLocalhost) authMessage.innerHTML += ` For layout review only, open <a href="?preview=1">localhost preview mode</a>.`;
      return;
    }

    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    authMessage.textContent = error ? error.message : "Signed in.";
    if (!error) await startAuthenticatedApp();
  });
}

async function loadData() {
  const [{ data: caseRows }, { data: resourceRows }] = await Promise.all([
    supabaseClient.from("cases").select("*").order("updated_at", { ascending: false }),
    supabaseClient.from("resources").select("*").order("category")
  ]);
  cases = caseRows || [];
  resources = resourceRows || [];
  selectedCaseId = cases[0]?.id || null;
  if (selectedCaseId) await loadCaseChildren(selectedCaseId);
}

async function loadCaseChildren(caseId) {
  if (previewMode) {
    notes = [{ id: "n1", body: "Preview note. Real notes are stored in Supabase with an audit trail.", created_at: new Date().toISOString() }];
    documents = [];
    return;
  }
  const [{ data: noteRows }, { data: documentRows }] = await Promise.all([
    supabaseClient.from("case_notes").select("*").eq("case_id", caseId).order("created_at", { ascending: false }),
    supabaseClient.from("case_documents").select("*").eq("case_id", caseId).order("created_at", { ascending: false })
  ]);
  notes = noteRows || [];
  documents = documentRows || [];
}

function renderPortal() {
  app.innerHTML = document.querySelector("#portal-template").innerHTML;
  wirePortalEvents();
  document.querySelector("#user-label").textContent = `${currentProfile.full_name || currentUser.email} (${currentProfile.role})`;
  selectedCaseId = selectedCaseId || cases[0]?.id || null;
  renderAll();
}

function wirePortalEvents() {
  document.querySelector("#sign-out").addEventListener("click", async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
    window.location.href = window.location.pathname;
  });
  ["search", "contract-filter", "status-filter"].forEach((id) => document.querySelector(`#${id}`).addEventListener("input", renderAll));
  document.querySelector("#new-case").addEventListener("click", clearCaseForm);
  document.querySelector("#save-case").addEventListener("click", saveCase);
  document.querySelector("#document-upload").addEventListener("change", uploadDocument);
}

function renderAll() {
  renderStats();
  renderCases();
  renderCaseForm();
  renderResources();
}

function filteredCases() {
  const term = document.querySelector("#search")?.value.trim().toLowerCase() || "";
  const contract = document.querySelector("#contract-filter")?.value || "all";
  const status = document.querySelector("#status-filter")?.value || "all";
  return cases.filter((item) => {
    const text = [item.member_name, item.member_contact, item.issue_type, item.status, item.summary, item.next_action].join(" ").toLowerCase();
    return (!term || text.includes(term)) && (contract === "all" || item.contract === contract) && (status === "all" || item.status === status);
  });
}

function renderStats() {
  const open = cases.filter((item) => !["Resolved", "Withdrawn"].includes(item.status));
  const due = open.filter((item) => item.next_deadline && daysUntil(item.next_deadline) <= 7 && daysUntil(item.next_deadline) >= 0);
  document.querySelector("#open-count").textContent = open.length;
  document.querySelector("#deadline-count").textContent = due.length;
  document.querySelector("#waiting-count").textContent = cases.filter((item) => item.status === "Waiting on company").length;
  document.querySelector("#resolved-count").textContent = cases.filter((item) => item.status === "Resolved").length;
}

function renderCases() {
  const list = document.querySelector("#case-list");
  const rows = filteredCases();
  document.querySelector("#case-total").textContent = `${rows.length} shown`;
  if (!rows.length) {
    list.innerHTML = `<div class="empty">No cases match the current filters.</div>`;
    return;
  }
  list.innerHTML = rows.map((item) => `
    <button class="case-card ${item.id === selectedCaseId ? "active" : ""}" type="button" data-case-id="${item.id}">
      <h3>${escapeHtml(item.member_name)}</h3>
      <p>${escapeHtml(item.issue_type)} · ${escapeHtml(item.next_action || "No next action set")}</p>
      <div class="meta-row"><span class="pill">${escapeHtml(item.contract)}</span><span class="pill ${item.status === "Resolved" ? "ok" : ""}">${escapeHtml(item.status)}</span>${item.next_deadline ? `<span class="pill ${daysUntil(item.next_deadline) <= 7 ? "warn" : ""}">${escapeHtml(item.next_deadline)}</span>` : ""}</div>
    </button>
  `).join("");
  list.querySelectorAll("[data-case-id]").forEach((button) => button.addEventListener("click", async () => {
    selectedCaseId = button.dataset.caseId;
    await loadCaseChildren(selectedCaseId);
    renderAll();
  }));
}

function renderCaseForm() {
  const item = cases.find((row) => row.id === selectedCaseId);
  if (!item) return clearCaseForm();
  setValue("case-id", item.id);
  setValue("member-name", item.member_name);
  setValue("member-contact", item.member_contact);
  setValue("case-contract", item.contract);
  setValue("issue-type", item.issue_type);
  setValue("case-status", item.status);
  setValue("next-deadline", item.next_deadline);
  setValue("next-action", item.next_action);
  setValue("summary", item.summary);
  setValue("new-note", "");
  renderDocuments();
  renderActivity();
}

function renderResources() {
  const term = document.querySelector("#search")?.value.trim().toLowerCase() || "";
  const contract = document.querySelector("#contract-filter")?.value || "all";
  const rows = resources.filter((item) => {
    const text = [item.title, item.category, item.description].join(" ").toLowerCase();
    return (!term || text.includes(term)) && (contract === "all" || item.contract === contract || item.contract === "Shared");
  });
  document.querySelector("#resource-list").innerHTML = rows.map((item) => `<article class="resource-item"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description || "")}</p><div class="meta-row"><span class="pill">${escapeHtml(item.category)}</span><span class="pill">${escapeHtml(item.contract)}</span></div></article>`).join("") || `<div class="empty">No resources match the current filters.</div>`;
}

function renderDocuments() {
  const list = document.querySelector("#document-list");
  list.innerHTML = documents.map((item) => `<li><strong>${escapeHtml(item.file_name)}</strong><button class="secondary" type="button" data-doc-path="${escapeHtml(item.storage_path)}">Open</button></li>`).join("") || `<li class="empty">No documents uploaded for this case.</li>`;
  list.querySelectorAll("[data-doc-path]").forEach((button) => button.addEventListener("click", () => openDocument(button.dataset.docPath)));
}

function renderActivity() {
  document.querySelector("#activity-list").innerHTML = notes.map((item) => `<li><strong>${new Date(item.created_at).toLocaleString()}</strong><p>${escapeHtml(item.body)}</p></li>`).join("") || `<li class="empty">No activity yet.</li>`;
}

function clearCaseForm() {
  selectedCaseId = null;
  ["case-id", "member-name", "member-contact", "next-deadline", "next-action", "summary", "new-note"].forEach((id) => setValue(id, ""));
  setValue("case-contract", "Contract 1");
  setValue("issue-type", "Grievance");
  setValue("case-status", "Intake");
  documents = [];
  notes = [];
  renderDocuments();
  renderActivity();
}

async function saveCase() {
  const payload = { member_name: value("member-name"), member_contact: value("member-contact"), contract: value("case-contract"), issue_type: value("issue-type"), status: value("case-status"), next_deadline: value("next-deadline") || null, next_action: value("next-action"), summary: value("summary"), updated_by: currentUser.id };
  const noteText = value("new-note");
  if (previewMode) {
    const id = value("case-id") || crypto.randomUUID();
    const existingIndex = cases.findIndex((item) => item.id === id);
    const nextCase = { ...payload, id, created_at: new Date().toISOString() };
    if (existingIndex >= 0) cases[existingIndex] = nextCase;
    else cases.unshift(nextCase);
    selectedCaseId = id;
    if (noteText) notes.unshift({ id: crypto.randomUUID(), body: noteText, created_at: new Date().toISOString() });
    renderAll();
    return;
  }
  const caseId = value("case-id");
  const result = caseId ? await supabaseClient.from("cases").update(payload).eq("id", caseId).select().single() : await supabaseClient.from("cases").insert({ ...payload, created_by: currentUser.id }).select().single();
  if (result.error) return alert(result.error.message);
  selectedCaseId = result.data.id;
  if (noteText) await supabaseClient.from("case_notes").insert({ case_id: selectedCaseId, body: noteText, created_by: currentUser.id });
  await loadData();
  await loadCaseChildren(selectedCaseId);
  renderAll();
}

async function uploadDocument(event) {
  const file = event.target.files[0];
  if (!file || !selectedCaseId) return;
  if (previewMode) {
    alert("Document upload requires configured Supabase storage.");
    event.target.value = "";
    return;
  }
  const storagePath = `${selectedCaseId}/${Date.now()}-${file.name}`;
  const upload = await supabaseClient.storage.from(DOCUMENT_BUCKET).upload(storagePath, file);
  if (upload.error) return alert(upload.error.message);
  const record = await supabaseClient.from("case_documents").insert({ case_id: selectedCaseId, file_name: file.name, storage_path: storagePath, mime_type: file.type, file_size: file.size, uploaded_by: currentUser.id });
  if (record.error) return alert(record.error.message);
  await loadCaseChildren(selectedCaseId);
  renderDocuments();
  event.target.value = "";
}

async function openDocument(path) {
  const { data, error } = await supabaseClient.storage.from(DOCUMENT_BUCKET).createSignedUrl(path, 300);
  if (error) return alert(error.message);
  window.open(data.signedUrl, "_blank", "noopener");
}

function value(id) {
  return document.querySelector(`#${id}`).value.trim();
}

function setValue(id, nextValue) {
  const element = document.querySelector(`#${id}`);
  if (element) element.value = nextValue || "";
}

function nextDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function daysUntil(dateText) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${dateText}T00:00:00`);
  return Math.ceil((date - today) / 86400000);
}

function escapeHtml(text) {
  return String(text || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}
