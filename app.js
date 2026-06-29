const config = window.STEWARD_PORTAL_CONFIG || {};
const SUPABASE_URL = config.supabaseUrl || "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = config.supabaseAnonKey || "YOUR_SUPABASE_ANON_KEY";
const DOCUMENT_BUCKET = config.documentBucket || "steward-documents";
const INTERNAL_BUCKET = config.internalBucket || "internal-files";

const isConfigured = SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 30;
const isLocalhost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const previewMode = !isConfigured && isLocalhost && new URLSearchParams(window.location.search).get("preview") === "1";
const supabaseClient = isConfigured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const sampleCases = [
  {
    id: "preview-1",
    member_name: "Sample Member",
    member_contact: "member@example.ca",
    contract: "Contract 1",
    issue_type: "Grievance",
    status: "Intake",
    next_deadline: nextDate(3),
    next_action: "Confirm facts and collect supporting documents",
    summary: "Example intake for a scheduling dispute. Replace with real data after Supabase is configured.",
    assigned_steward_id: null,
    created_at: new Date().toISOString()
  },
  {
    id: "preview-2",
    member_name: "Training Case",
    member_contact: "member@example.ca",
    contract: "Contract 2",
    issue_type: "Payroll",
    status: "Waiting on company",
    next_deadline: nextDate(6),
    next_action: "Follow up with company representative",
    summary: "Example payroll claim tracking item for steward workflow testing.",
    assigned_steward_id: null,
    created_at: new Date().toISOString()
  }
];

const sampleResources = [
  { id: "r1", title: "Collective Agreements", category: "Agreements", contract: "Shared", description: "Protected links to Contract 1 and Contract 2 reference copies.", url: "#" },
  { id: "r-wages", title: "Lost time / expense form", category: "Forms", contract: "Shared", description: "Steward/admin form for Unifor wages, lost time, and expense claims.", url: "wages-form.html" },
  { id: "r2", title: "Grievance Template", category: "Templates", contract: "Shared", description: "Standard form language and filing checklist for shop stewards.", url: "#" },
  { id: "r3", title: "Claims and Payroll Guide", category: "Guides", contract: "Contract 2", description: "Common claim paths, supporting evidence, and follow-up notes.", url: "#" },
  { id: "r4", title: "Moncton Steward Contacts", category: "Contacts", contract: "Shared", description: "Internal contacts placeholder for authorized users only.", url: "#" },
  { id: "r5", title: "Health and Safety Notes", category: "Committees", contract: "Shared", description: "Committee notes, inspection references, and escalation paths.", url: "#" },
  { id: "r6", title: "Meeting Minutes", category: "Meetings", contract: "Shared", description: "Protected meeting records and action items.", url: "#" }
];

const publicAnnouncements = [
  {
    title: "Local 4005 Moncton board is being rebuilt",
    date: "2026-06-10",
    contract: "Shared",
    category: "Featured",
    priority: "Pinned",
    summary: "This new board will carry public notices, Contract 1 / Contract 2 resources, Q&A, meeting information, and secure steward tools."
  },
  {
    title: "Current agreements are linked from Council 4000",
    date: "2026-06-10",
    contract: "Shared",
    category: "Agreements",
    priority: "Resource",
    summary: "Agreement No. 1, Agreement No. 2, supplementals, and safety agreements are available from the public Council 4000 agreement page."
  },
  {
    title: "Questions can be posted publicly",
    date: "2026-06-10",
    contract: "Shared",
    category: "Q&A",
    priority: "Open",
    summary: "Members can ask public questions here. Stewards can review and answer them before they become official guidance."
  }
];

const defaultMeetings = [
  {
    id: "regular",
    title: "Regular membership meeting",
    date: "Next date to be confirmed",
    location: "Moncton station area",
    room: "Room notice will be posted here",
    contract: "Shared",
    note: "Use this spot for monthly meeting notices, agenda highlights, and location changes."
  },
  {
    id: "steward",
    title: "Steward working session",
    date: "By appointment",
    location: "Moncton shop steward office",
    room: "Private access",
    contract: "Stewards",
    note: "For grievance preparation, private file review, and follow-up planning."
  },
  {
    id: "safety",
    title: "Health and safety committee",
    date: "Posted when scheduled",
    location: "Worksite or Teams",
    room: "Location varies",
    contract: "Shared",
    note: "Use for safety committee notices, inspection topics, and member reminders."
  }
];

let publicStewards = [];

let publicAdmins = [];

let publicExecutiveTeam = [
  { name: "Steve Harding", role: "President, Local 4005 / VP to the President of Council 4000", area: "Local 4005", contact: "Listed on Council 4000 contact page" },
  { name: "Rheanne Gautreau", role: "Regional Representative - Local 4005", area: "NB / PEI / NS / NL", contact: "Listed on Council 4000 regional representatives page" },
  { name: "To be confirmed", role: "Other Local 4005 executive positions", area: "Local 4005", contact: "Not listed on the public Unifor source pages." }
];

const publicDiscounts = [
  {
    title: "Employee discounts",
    category: "Local 4005",
    audience: "All employees",
    description: "Open the local discounts page with guide details copied onto this site.",
    url: "discounts.html"
  }
];

const publicResources = [
  { title: "VIA Rail Agreement No. 1", category: "Agreements", contract: "Contract 1", description: "Council 4000 lists Agreement No. 1 - National as 2025-2027.", url: "https://www.unifor4000.com/agreements" },
  { title: "VIA Rail Agreement No. 2", category: "Agreements", contract: "Contract 2", description: "Council 4000 lists Agreement No. 2 - National as 2025-2027.", url: "https://www.unifor4000.com/agreements" },
  { title: "VIA Rail supplemental and safety agreements", category: "Agreements", contract: "Shared", description: "Council 4000 also links Agreement No. 1 and No. 2 supplementals plus the Safety agreement.", url: "https://www.unifor4000.com/agreements" },
  { title: "Council 4000 bylaws", category: "Bylaws", contract: "Shared", description: "Council 4000 bylaws and constitution resources.", url: "https://www.unifor4000.com/bylaws-constitution" },
  { title: "Employee discounts", category: "Discounts", contract: "Shared", description: "Discount guide details copied onto this site for all employees.", url: "discounts.html" },
  { title: "Meetings", category: "Meetings", contract: "Shared", description: "Meeting notices and general agenda information." },
  { title: "New member guide", category: "Guide", contract: "Shared", description: "Plain-language starting point for Local 4005 members." },
  { title: "Claims and payroll", category: "Guide", contract: "Shared", description: "Public-safe guidance on where to start with common questions." },
  { title: "Health and safety", category: "Committee", contract: "Shared", description: "Committee information and public-safe safety resources." },
  { title: "Contact a steward", category: "Support", contract: "Shared", description: "Use this area for approved contact instructions." }
];

const local4005Companies = [
  "VIA Rail Canada",
  "Atlantic Wholesalers (DC24)",
  "Atlantic Wholesalers (DC06)",
  "Atlantic Wholesalers (DC14)",
  "Bay Ferries",
  "CHEP Canada",
  "Cummins",
  "DHL Express",
  "Discovery Centre",
  "Loomis Express (TransForce)",
  "Nova Scotia Federation of Labour",
  "Securitas AB / Twin Rivers Paper",
  "Wajax Equipment",
  "World Trade and Convention Centre"
];

const defaultDistributionCompanies = local4005Companies.map((company) => ({
  company,
  election_date: null
}));

const publicKnowledge = [
  { title: "VIA Rail Agreement No. 1", category: "Agreement No. 1", text: "Council 4000 lists VIA Rail Agreement No. 1 - National as 2025-2027 on its Collective Agreements page." },
  { title: "VIA Rail Agreement No. 2", category: "Agreement No. 2", text: "Council 4000 lists VIA Rail Agreement No. 2 - National as 2025-2027 on its Collective Agreements page." },
  { title: "Supplemental agreements", category: "Supplementals", text: "Council 4000 links supplemental agreements for Agreement No. 1 and Agreement No. 2 on its Collective Agreements page." },
  { title: "Safety and Health Agreement", category: "Safety", text: "Council 4000 links the VIA Rail Safety and Health Agreement on its Collective Agreements page." }
];

const sampleQuestions = [
  { id: "q1", name: "Member", question: "Where will current agreements be posted?", answer: "Approved public links will be added to the agreements section.", status: "answered", created_at: new Date().toISOString() },
  { id: "q2", name: "Anonymous", question: "Can a steward review this question?", answer: "", status: "pending", created_at: new Date().toISOString() }
];

const sampleInvites = [];

let currentUser = null;
let currentProfile = null;
let cases = [];
let resources = [];
let notes = [];
let documents = [];
let pendingProfiles = [];
let activeProfiles = [];
let internalFiles = [];
let publicQuestions = [...sampleQuestions];
let announcementItems = publicAnnouncements.map((item, index) => ({ id: `announcement-${index + 1}`, ...item }));
let publicResourceItems = [...publicResources];
let meetingNotices = [...defaultMeetings];
let inviteCodes = [...sampleInvites];
let electionContacts = [];
let distributionCompanies = [];
let selectedMeetingId = defaultMeetings[0]?.id || null;
let selectedAnnouncementId = announcementItems[0]?.id || null;
let selectedPublicResourceId = null;
let selectedExecutiveId = null;
let selectedElectionId = null;
let meetingsStorageReady = previewMode || !isConfigured;
let selectedCaseId = null;
let activePortalRole = null;
let activeAdminTab = "dashboard";
let activeSectionTab = "cases";

const roleLabels = {
  admin: "Admin",
  steward: "Shop Steward",
  committee: "Committee"
};

function normalizeRoleName(role) {
  return role === "election_committee" ? "committee" : role;
}

function profileRoles(profile) {
  const assigned = Array.isArray(profile?.assigned_roles)
    ? profile.assigned_roles.map(normalizeRoleName).filter(Boolean)
    : [];
  const expanded = new Set(assigned);
  if (profile?.role) expanded.add(normalizeRoleName(profile.role));
  if (expanded.has("admin")) {
    expanded.add("steward");
    expanded.add("committee");
  } else if (expanded.has("steward")) {
    expanded.add("committee");
  } else if (!expanded.size) {
    expanded.add("committee");
  }
  return ["admin", "steward", "committee"].filter((role) => expanded.has(role));
}

function profileHasRole(profile, role) {
  return profileRoles(profile).includes(role);
}

function availablePortalRoles() {
  return ["admin", "steward", "committee"].filter((role) => profileHasRole(currentProfile, role));
}

function activeRole() {
  const allowed = availablePortalRoles();
  if (!allowed.includes(activePortalRole)) activePortalRole = allowed[0] || currentProfile?.role || "committee";
  return activePortalRole;
}

const app = document.querySelector("#app");

if (previewMode) {
  currentUser = { id: "preview-user", email: "preview@local4005.test" };
  currentProfile = { id: "preview-user", full_name: "Preview Admin", role: "admin", assigned_roles: ["admin", "steward", "committee"] };
  cases = [...sampleCases];
  resources = [...sampleResources];
  internalFiles = [
    { id: "file-1", file_name: "Locked-Grievance-Tracker.xlsx", kind: "grievance_tracker", storage_path: "grievance-tracker/Locked-Grievance-Tracker.xlsx", uploaded_at: new Date().toISOString() }
  ];
  pendingProfiles = [
    { id: "pending-1", full_name: "New Steward", email: "new.steward@example.ca", role: "steward", assigned_roles: ["steward"], request_note: "Moncton steward access request", share_email: false, share_phone: false, created_at: new Date().toISOString() }
  ];
  activeProfiles = [
    { id: "preview-user", full_name: "Preview Admin", email: "preview@local4005.test", role: "admin", assigned_roles: ["admin", "steward", "committee"], share_email: false, share_phone: false, created_at: new Date().toISOString() }
  ];
  publicStewards = [
    { name: "Nicolas Hachey", role: "Shop Steward", area: "Moncton VCC", contract: "Contract 1", contact: "Contact through Local 4005" }
  ];
  renderPortal();
} else if (isPasswordRecoveryLink()) {
  renderPasswordUpdate();
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

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

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
  renderMeetingBoard(selectedMeetingId);
  renderPublicDirectory();
  loadPublicAccountDirectory();
  loadOfficialContacts();
  loadPublicExecutiveTeam();
  loadPublicQuestions();
  loadPublicAnnouncements();
  loadPublicMeetings();
  renderDiscounts();
  document.querySelector("#staff-login")?.addEventListener("click", renderAuth);
  document.querySelector("#assistant-ask")?.addEventListener("click", answerPublicQuestion);
  document.querySelector("#question-form")?.addEventListener("submit", submitPublicQuestion);
  ["public-search", "public-contract"].forEach((id) => {
    document.querySelector(`#${id}`)?.addEventListener("input", renderPublicBoard);
  });
}

async function loadPublicExecutiveTeam() {
  if (!isConfigured) {
    renderPublicDirectory();
    return;
  }
  try {
    const { data, error } = await supabaseClient
      .from("public_executive_team")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error || !Array.isArray(data) || !data.length) return;
    publicExecutiveTeam = data.map((item) => ({
      id: item.id,
      name: item.name,
      role: item.role,
      area: item.area || "",
      contact: item.contact || "",
      note: item.note || ""
    }));
    selectedExecutiveId = publicExecutiveTeam[0]?.id || null;
    renderPublicDirectory();
  } catch {
    // Keep fallback executive contacts when the table is not configured yet.
  }
}

async function loadPublicAnnouncements() {
  if (!isConfigured) {
    renderPublicBoard();
    return;
  }
  try {
    const { data, error } = await supabaseClient
      .from("public_announcements")
      .select("*")
      .order("display_order", { ascending: true })
      .order("date", { ascending: false });
    if (error || !Array.isArray(data) || !data.length) return;
    announcementItems = data.map((item) => ({
      id: item.id,
      title: item.title,
      date: item.date,
      contract: item.contract || "Shared",
      category: item.category || "",
      priority: item.priority || "",
      summary: item.summary || ""
    }));
    selectedAnnouncementId = announcementItems[0]?.id || null;
    renderPublicBoard();
  } catch {
    // Keep fallback announcement content when the table is not configured yet.
  }
}

async function loadPublicMeetings() {
  if (!isConfigured) {
    renderMeetingBoard(selectedMeetingId);
    return;
  }
  try {
    const { data, error } = await supabaseClient
      .from("meetings")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      meetingsStorageReady = false;
      renderMeetingBoard(selectedMeetingId);
      return;
    }
    meetingsStorageReady = true;
    meetingNotices = normalizeMeetings(data);
    selectedMeetingId = meetingNotices[0]?.id || null;
    renderMeetingBoard(selectedMeetingId);
  } catch {
    meetingsStorageReady = false;
    renderMeetingBoard(selectedMeetingId);
  }
}

async function loadPublicAccountDirectory() {
  if (!isConfigured) return;
  try {
    const { data, error } = await supabaseClient
      .from("public_directory_entries")
      .select("*")
      .eq("is_public", true)
      .order("display_order", { ascending: true })
      .order("display_name", { ascending: true });
    if (error) return;
    publicStewards = (data || [])
      .filter((entry) => entry.directory_role === "steward")
      .map(directoryEntryToContact);
    publicAdmins = (data || [])
      .filter((entry) => entry.directory_role === "admin")
      .map(directoryEntryToContact);
    renderPublicDirectory();
  } catch {
    // Account-backed directory is optional until Supabase is configured.
  }
}

async function loadOfficialContacts() {
  try {
    if (isConfigured) {
      const { data } = await supabaseClient
        .from("public_executive_team")
        .select("id")
        .limit(1);
      if (Array.isArray(data) && data.length) return;
    }
    const response = await fetch("/api/local-4005-contacts");
    if (!response.ok) return;
    const data = await response.json();
    if (Array.isArray(data.executiveTeam) && data.executiveTeam.length) publicExecutiveTeam = data.executiveTeam;
    renderPublicDirectory();
  } catch {
    // Keep verified fallback contacts when the official-source sync is unavailable.
  }
}

function directoryEntryToContact(entry) {
  return {
    name: entry.display_name,
    role: entry.public_title,
    area: entry.location || "",
    contract: entry.contract || "",
    contact: entry.public_contact || "Contact through Local 4005"
  };
}

function renderDiscounts() {
  const list = document.querySelector("#discount-list");
  if (!list) return;
  list.innerHTML = publicDiscounts.map((item) => `
    <article class="discount-card">
      <div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
      </div>
      <div class="meta-row">
        <span class="pill strong">${escapeHtml(item.audience)}</span>
        <span class="pill">${escapeHtml(item.category)}</span>
      </div>
      <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Open discount resource</a>
    </article>
  `).join("");
}

function renderPublicDirectory() {
  const stewardList = document.querySelector("#public-steward-list");
  const adminCard = document.querySelector("#admin-contact-card");
  const executiveList = document.querySelector("#executive-list");
  if (stewardList) {
    stewardList.innerHTML = publicStewards.map(renderContactCard).join("") || `<div class="empty">No approved steward accounts are listed publicly yet.</div>`;
  }
  if (adminCard) {
    adminCard.innerHTML = publicAdmins.map((person) => renderContactCard(person, true)).join("") || `<div class="empty">No approved admin accounts are listed publicly yet.</div>`;
  }
  if (executiveList) {
    executiveList.innerHTML = publicExecutiveTeam.map(renderContactCard).join("");
  }
}

function renderContactCard(person, featured = false) {
  return `
    <article class="contact-card ${featured ? "featured" : ""}">
      <div>
        <h4>${escapeHtml(person.name)}</h4>
        <p>${escapeHtml(person.role)}</p>
      </div>
      <div class="meta-row">
        <span class="pill">${escapeHtml(person.area)}</span>
        ${person.contract ? `<span class="pill">${escapeHtml(person.contract)}</span>` : ""}
      </div>
      <p>${escapeHtml(person.contact)}</p>
      ${person.note ? `<p class="contact-note">${escapeHtml(person.note)}</p>` : ""}
    </article>
  `;
}

function renderPublicBoard() {
  const term = document.querySelector("#public-search")?.value.trim().toLowerCase() || "";
  const contract = document.querySelector("#public-contract")?.value || "all";
  const matches = (item) => {
    const text = [item.title, item.category, item.contract, item.summary, item.description].join(" ").toLowerCase();
    return (!term || text.includes(term)) && (contract === "all" || item.contract === contract || item.contract === "Shared");
  };
  const announcements = announcementItems.filter(matches);
  const announcementList = document.querySelector("#announcement-list");
  const announcementTotal = document.querySelector("#announcement-total");
  if (announcementTotal) announcementTotal.textContent = `${announcements.length} shown`;
  if (announcementList) {
    announcementList.innerHTML = announcements.map((item) => `
      <article class="announcement-card">
        <div class="meta-row">
          ${item.priority ? `<span class="pill strong">${escapeHtml(item.priority)}</span>` : ""}
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
  const publicRows = publicResourceItems.filter(matches);
  if (resourceList) {
    resourceList.innerHTML = publicRows.map((item) => `
      ${item.url ? `
        <a class="resource-tool" href="${escapeHtml(item.url)}" ${item.url.startsWith("http") ? `target="_blank" rel="noopener"` : ""}>
          <span>${escapeHtml(item.title)}</span>
          <small>${escapeHtml(item.category)} · ${escapeHtml(item.contract)}</small>
        </a>
      ` : `
        <div class="resource-tool muted">
          <span>${escapeHtml(item.title)}</span>
          <small>${escapeHtml(item.category)} · ${escapeHtml(item.contract)}</small>
        </div>
      `}
    `).join("") || `<div class="empty">No resources match the current filters.</div>`;
  }
  renderQABoard();
}

function renderMeetingBoard(activeId) {
  const tabs = document.querySelector("#meeting-tabs");
  const detail = document.querySelector("#meeting-detail");
  const count = document.querySelector("#meeting-count");
  if (!tabs || !detail) return;
  const rows = meetingNotices.length ? meetingNotices : [...defaultMeetings];
  const active = rows.find((meeting) => meeting.id === activeId) || rows[0];
  if (!active) {
    tabs.innerHTML = "";
    detail.innerHTML = `<div class="empty">No meeting notices posted yet.</div>`;
    if (count) count.textContent = "0 notices";
    return;
  }
  selectedMeetingId = active.id;
  if (count) count.textContent = `${rows.length} notices`;
  tabs.innerHTML = rows.map((meeting) => `
    <button class="meeting-tab ${meeting.id === active.id ? "active" : ""}" type="button" data-meeting-id="${escapeHtml(meeting.id)}">
      <span>${escapeHtml(meeting.title)}</span>
      <small>${escapeHtml(meeting.contract)}</small>
    </button>
  `).join("");
  detail.innerHTML = `
    <div class="meeting-date">${escapeHtml(active.date)}</div>
    <h3>${escapeHtml(active.location)}</h3>
    <p>${escapeHtml(active.room)}</p>
    <p>${escapeHtml(active.note)}</p>
  `;
  tabs.querySelectorAll("[data-meeting-id]").forEach((button) => {
    button.addEventListener("click", () => renderMeetingBoard(button.dataset.meetingId));
  });
}

async function answerPublicQuestion() {
  const question = value("assistant-question").toLowerCase();
  const answerBox = document.querySelector("#assistant-answer");
  if (!question) {
    answerBox.textContent = "Type a question about Agreement No. 1, Agreement No. 2, supplementals, or the Safety and Health Agreement.";
    return;
  }
  answerBox.textContent = "Checking agreement assistant...";
  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    if (response.ok) {
      const data = await response.json();
      answerBox.innerHTML = `<p>${escapeHtml(data.answer)}</p>`;
      if (data.sources?.length) {
        answerBox.innerHTML += `<div class="meta-row">${data.sources.map((source) => `<a class="pill" href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.title)}</a>`).join("")}</div>`;
      }
      return;
    }
  } catch (error) {
    // Fall back to local search when the Cloudflare AI endpoint is not configured yet.
  }
  const matches = publicKnowledge.filter((item) => {
    const text = [item.title, item.category, item.text].join(" ").toLowerCase();
    return question.split(/\s+/).some((word) => word.length > 2 && text.includes(word));
  });
  answerBox.innerHTML = matches.length
    ? matches.map((item) => `<p><strong>${escapeHtml(item.title)}:</strong> ${escapeHtml(item.text)}</p>`).join("")
    : `<p>No matching agreement note yet. Check the linked Council 4000 agreements and contact a steward for interpretation.</p>`;
}

async function loadPublicQuestions() {
  if (!isConfigured) {
    renderQABoard();
    return;
  }
  try {
    const { data, error } = await supabaseClient
      .from("public_questions")
      .select("*")
      .eq("status", "answered")
      .order("answered_at", { ascending: false });
    if (error) return;
    publicQuestions = data || [];
  } catch (error) {
    // Network or Supabase error: leave sample/local questions in place.
  }
  renderQABoard();
}

async function submitPublicQuestion(event) {
  event.preventDefault();
  const message = document.querySelector("#question-message");
  const question = value("question-body");
  const name = value("question-name") || "Anonymous";
  if (!question) return;

  if (isConfigured) {
    const { error } = await supabaseClient.from("public_questions").insert({ name, question });
    if (error) {
      message.textContent = error.message;
      return;
    }
    message.textContent = "Thanks — your question was submitted. Once a steward answers it, it will appear on this board for everyone.";
  } else {
    publicQuestions.unshift({ id: crypto.randomUUID(), name, question, answer: "Pending review.", status: "pending", created_at: new Date().toISOString() });
    message.textContent = "Question added locally for preview.";
    renderQABoard();
  }
  document.querySelector("#question-form").reset();
}

function renderQABoard() {
  const list = document.querySelector("#qa-list");
  if (!list) return;
  list.innerHTML = publicQuestions.length
    ? publicQuestions.map((item) => `
        <article class="qa-card">
          <h3>${escapeHtml(item.question)}</h3>
          <p>${escapeHtml(item.answer || "Pending review.")}</p>
          <div class="meta-row">
            <span class="pill">${escapeHtml(item.name || "Anonymous")}</span>
          </div>
        </article>
      `).join("")
    : `<div class="empty">No answered questions yet. Ask one above — once a steward answers, it will be posted here for everyone.</div>`;
}

function renderAuth() {
  app.innerHTML = document.querySelector("#auth-template").innerHTML;
  document.querySelector("#back-public").addEventListener("click", () => window.location.reload());
  document.querySelector("#request-access").addEventListener("click", renderRegister);
  document.querySelector("#reset-password").addEventListener("click", sendPasswordReset);
  document.querySelector("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const authMessage = document.querySelector("#auth-message");
    if (!isConfigured) {
      authMessage.innerHTML = `Supabase is not configured. Create <strong>config.js</strong> from <strong>config.example.js</strong> with your project URL and anon key.`;
      if (isLocalhost) {
        authMessage.innerHTML += ` For layout review only, open <a href="?preview=1">localhost preview mode</a>.`;
      }
      return;
    }

    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    authMessage.textContent = error ? error.message : "Signed in.";
    if (!error) await startAuthenticatedApp();
  });
}

async function sendPasswordReset() {
  const authMessage = document.querySelector("#auth-message");
  const email = value("email");
  if (!email) {
    authMessage.textContent = "Enter your email address first.";
    return;
  }
  if (!isConfigured) {
    authMessage.textContent = "Supabase is not configured yet, so password reset email cannot be sent.";
    return;
  }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${window.location.pathname}`
  });
  authMessage.textContent = error ? error.message : "Password reset email sent.";
}

function isPasswordRecoveryLink() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  return hash.get("type") === "recovery" || query.get("type") === "recovery";
}

function renderPasswordUpdate() {
  app.innerHTML = document.querySelector("#password-update-template").innerHTML;
  document.querySelector("#password-update-board").addEventListener("click", () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.reload();
  });
  document.querySelector("#password-update-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#password-update-message");
    if (!isConfigured) {
      message.textContent = "Supabase is not configured yet.";
      return;
    }

    const password = value("new-password");
    const confirmPassword = value("confirm-password");
    if (password !== confirmPassword) {
      message.textContent = "Passwords do not match.";
      return;
    }

    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error) {
      message.textContent = error.message;
      return;
    }

    window.history.replaceState({}, document.title, window.location.pathname);
    message.textContent = "Password updated. Signing you in...";
    await startAuthenticatedApp();
  });
}

function renderRegister() {
  app.innerHTML = document.querySelector("#register-template").innerHTML;
  applyInvitePrefill();
  document.querySelector("#back-login").addEventListener("click", renderAuth);
  document.querySelector("#register-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#register-message");
    if (!isConfigured) {
      message.innerHTML = `Supabase is not configured yet. Registration will work after <strong>config.js</strong> is connected.`;
      return;
    }

    const fullName = value("register-name");
    const email = value("register-email");
    const phone = value("register-phone");
    const password = value("register-password");
    const role = value("register-role");
    const inviteCode = value("register-invite-code");
    const requestNote = value("register-note");
    const shareEmail = document.querySelector("#register-share-email")?.checked || false;
    const sharePhone = document.querySelector("#register-share-phone")?.checked || false;
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          requested_role: role,
          invite_code: inviteCode,
          request_note: requestNote ? `${requestNote}${inviteCode ? ` | Invite: ${inviteCode}` : ""}` : (inviteCode ? `Invite: ${inviteCode}` : ""),
          phone,
          share_email: shareEmail,
          share_phone: sharePhone
        }
      }
    });

    if (error) {
      message.textContent = error.message;
      return;
    }
    message.textContent = "Request submitted. An admin must approve the account before private tools are available.";
    document.querySelector("#register-form").reset();
  });
}

function applyInvitePrefill() {
  const params = new URLSearchParams(window.location.search);
  const inviteCode = (params.get("invite") || params.get("code") || "").trim();
  const requestedRole = normalizeRoleName((params.get("role") || "").trim());
  if (!inviteCode && !requestedRole) return;

  if (inviteCode) setValue("register-invite-code", inviteCode);
  if (requestedRole && roleLabels[requestedRole]) {
    setValue("register-role", requestedRole);
    const roleSelect = document.querySelector("#register-role");
    if (roleSelect) roleSelect.disabled = true;
  }

  const helper = document.querySelector("#register-invite-helper");
  if (helper) {
    const roleText = requestedRole && roleLabels[requestedRole] ? `${roleLabels[requestedRole]} access` : "requested access";
    helper.textContent = inviteCode
      ? `Invite detected. This signup will request ${roleText} using code ${inviteCode}.`
      : `Invite detected. This signup will request ${roleText}.`;
    helper.hidden = false;
  }
}

async function loadData() {
  const committeeOnly = profileHasRole(currentProfile, "committee") && !profileHasRole(currentProfile, "admin") && !profileHasRole(currentProfile, "steward");
  const canManageUsers = profileHasRole(currentProfile, "admin");
  const [caseResult, resourceResult, pendingResult, activeProfileResult, internalResult, questionResult, meetingResult, announcementResult, inviteResult, executiveResult, electionResult, companyResult] = await Promise.all([
    committeeOnly ? Promise.resolve({ data: [] }) : supabaseClient.from("cases").select("*").order("updated_at", { ascending: false }),
    committeeOnly ? Promise.resolve({ data: [] }) : supabaseClient.from("resources").select("*").order("category"),
    canManageUsers
      ? supabaseClient.from("profiles").select("*").eq("active", false).eq("access_status", "pending").order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    canManageUsers
      ? supabaseClient.from("profiles").select("*").eq("active", true).order("full_name", { ascending: true })
      : Promise.resolve({ data: [] }),
    committeeOnly ? Promise.resolve({ data: [] }) : supabaseClient.from("internal_files").select("*").order("uploaded_at", { ascending: false }),
    committeeOnly ? Promise.resolve({ data: [] }) : supabaseClient.from("public_questions").select("*").order("created_at", { ascending: false }),
    committeeOnly ? Promise.resolve({ data: [] }) : supabaseClient.from("meetings").select("*").order("display_order", { ascending: true }).order("created_at", { ascending: true }),
    committeeOnly ? Promise.resolve({ data: [] }) : supabaseClient.from("public_announcements").select("*").order("display_order", { ascending: true }).order("date", { ascending: false }),
    canManageUsers || profileHasRole(currentProfile, "steward")
      ? supabaseClient.from("invite_codes").select("*").order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    committeeOnly ? Promise.resolve({ data: [] }) : supabaseClient.from("public_executive_team").select("*").order("display_order", { ascending: true }).order("created_at", { ascending: true }),
    committeeOnly ? Promise.resolve({ data: [] }) : supabaseClient.from("election_contacts").select("*").order("company", { ascending: true }).order("member_name", { ascending: true }),
    committeeOnly ? Promise.resolve({ data: [] }) : supabaseClient.from("distribution_companies").select("*").order("company", { ascending: true })
  ]);

  cases = caseResult.data || [];
  resources = resourceResult.data || [];
  if (!resources.some((item) => item.url === "wages-form.html")) {
    resources.unshift({
      id: "builtin-wages-form",
      title: "Lost time / expense form",
      category: "Forms",
      contract: "Shared",
      description: "Steward/admin form for Unifor wages, lost time, and expense claims.",
      url: "wages-form.html"
    });
  }
  pendingProfiles = pendingResult.data || [];
  activeProfiles = activeProfileResult.data || [];
  internalFiles = internalResult.data || [];
  publicQuestions = questionResult.data || [];
  announcementItems = (announcementResult.data || []).map((item) => ({
    id: item.id,
    title: item.title,
    date: item.date,
    contract: item.contract || "Shared",
    category: item.category || "",
    priority: item.priority || "",
    summary: item.summary || ""
  }));
  if (!announcementItems.length) announcementItems = publicAnnouncements.map((item, index) => ({ id: `announcement-${index + 1}`, ...item }));
  inviteCodes = inviteResult.data || [];
  if (Array.isArray(executiveResult.data) && executiveResult.data.length) {
    publicExecutiveTeam = executiveResult.data.map((item) => ({
      id: item.id,
      name: item.name,
      role: item.role,
      area: item.area || "",
      contact: item.contact || "",
      note: item.note || ""
    }));
  }
  electionContacts = electionResult.data || [];
  distributionCompanies = (companyResult.data && companyResult.data.length)
    ? companyResult.data
    : [...defaultDistributionCompanies];
  if (meetingResult.error) {
    meetingsStorageReady = false;
    meetingNotices = [...defaultMeetings];
  } else {
    meetingsStorageReady = true;
    meetingNotices = normalizeMeetings(meetingResult.data);
  }
  selectedMeetingId = meetingNotices.find((item) => item.id === selectedMeetingId)?.id || meetingNotices[0]?.id || null;
  publicResourceItems = resources.filter((item) => !item.adminOnly);
  selectedAnnouncementId = announcementItems.find((item) => item.id === selectedAnnouncementId)?.id || announcementItems[0]?.id || null;
  selectedPublicResourceId = publicResourceItems.find((item) => item.id === selectedPublicResourceId)?.id || publicResourceItems[0]?.id || null;
  selectedExecutiveId = publicExecutiveTeam.find((item) => item.id === selectedExecutiveId)?.id || publicExecutiveTeam[0]?.id || null;
  selectedElectionId = electionContacts.find((item) => item.id === selectedElectionId)?.id || electionContacts[0]?.id || null;
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
  activePortalRole = activeRole();
  if (activePortalRole === "committee") {
    activeAdminTab = "workspace";
    activeSectionTab = "resources";
  }
  wirePortalEvents();
  renderRoleSwitcher();
  document.querySelector("#user-label").textContent = `${currentProfile.full_name || currentUser.email} (${currentProfile.role})`;
  applyRoleVisibility();
  selectedCaseId = selectedCaseId || cases[0]?.id || null;
  renderAll();
  renderApprovals();
}

function isAdmin() {
  return activeRole() === "admin";
}

function isSteward() {
  return activeRole() === "steward";
}

function isCommittee() {
  return activeRole() === "committee";
}

function isAdminOrSteward() {
  return isAdmin() || isSteward();
}

function canManageUsers() {
  return profileHasRole(currentProfile, "admin");
}

function renderRoleSwitcher() {
  const roles = availablePortalRoles();
  const wrapper = document.querySelector("#role-switcher-wrap");
  const select = document.querySelector("#role-switcher");
  if (!wrapper || !select) return;
  if (roles.length <= 1) {
    wrapper.hidden = true;
    return;
  }
  wrapper.hidden = false;
  select.innerHTML = roles.map((role) => `<option value="${role}">${roleLabels[role] || role}</option>`).join("");
  select.selectedIndex = -1;
  select.value = activeRole();
  if (select.value !== activeRole()) {
    select.selectedIndex = roles.indexOf(activeRole());
  }
  select.addEventListener("change", () => {
    activePortalRole = select.value;
    if (activePortalRole === "committee") {
      activeAdminTab = "workspace";
      activeSectionTab = "resources";
    } else if (activeAdminTab === "workspace" && activeSectionTab === "resources") {
      activeSectionTab = "cases";
    }
    applyRoleVisibility();
    renderAll();
  });
}

function applyRoleVisibility() {
  const role = activeRole();
  if (role === "committee") {
    activeAdminTab = "workspace";
    activeSectionTab = "resources";
  }
  const portal = document.querySelector(".portal");
  if (portal) {
    portal.dataset.role = role;
    portal.dataset.adminTab = activeAdminTab;
    portal.dataset.section = activeSectionTab;
  }
  const isDashboardTab = activeAdminTab === "dashboard";
  const isWorkspaceTab = activeAdminTab === "workspace" || role === "committee";
  const isPublicTab = activeAdminTab === "public";
  const isAdminTab = activeAdminTab === "admin";
  const title = document.querySelector(".topbar h1");
  if (title) {
    if (role === "admin") title.textContent = "Admin Tools";
    else if (role === "steward") title.textContent = "Shop Steward Portal";
    else title.textContent = "Committee Forms";
  }

  const visibility = {
    ".stats-grid": (role === "steward" || role === "admin") && isDashboardTab,
    "#dashboard-grid": (role === "steward" || role === "admin") && isDashboardTab,
    ".approval-panel": role === "admin" && isAdminTab,
    ".qa-moderation": (role === "admin" || role === "steward") && isPublicTab,
    ".internal-files": (role === "steward" || role === "admin") && isWorkspaceTab && activeSectionTab === "files",
    ".workspace": (role === "steward" || role === "admin") && isWorkspaceTab && activeSectionTab === "cases",
    ".resources": role === "committee" || (((role === "steward" || role === "admin") && isWorkspaceTab && activeSectionTab === "resources")),
    "#admin-nav": role === "admin" || role === "steward",
    "#users-tab": role === "admin" && isAdminTab,
    "#content-tab": (role === "admin" || role === "steward") && isPublicTab
  };

  Object.entries(visibility).forEach(([selector, visible]) => {
    const element = document.querySelector(selector);
    if (element) element.hidden = !visible;
  });

  const resourcesTitle = document.querySelector("#resources-title");
  if (resourcesTitle) resourcesTitle.textContent = role === "committee" ? "Committee tools" : "Protected resources";
  const resourcesSubtitle = document.querySelector(".resources .section-heading span");
  if (resourcesSubtitle) resourcesSubtitle.textContent = role === "committee" ? "Lost time form and committee resources" : "Protected references and templates";
  renderSectionTabs();
}

function wirePortalEvents() {
  document.querySelector("#sign-out").addEventListener("click", async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
    window.location.href = window.location.pathname;
  });
  document.querySelectorAll(".admin-nav-tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeAdminTab = button.dataset.tab || "cases";
      renderAdminTabs();
    });
  });
  document.querySelectorAll(".section-nav-tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeSectionTab = button.dataset.section || "cases";
      renderSectionTabs();
    });
  });
  document.querySelectorAll(".dashboard-jump").forEach((button) => {
    button.addEventListener("click", () => {
      activeAdminTab = button.dataset.jumpTab || "dashboard";
      if (button.dataset.jumpSection) activeSectionTab = button.dataset.jumpSection;
      renderAll();
    });
  });
  ["search", "contract-filter", "status-filter"].forEach((id) => {
    document.querySelector(`#${id}`)?.addEventListener("input", renderAll);
  });
  ["user-search", "user-role-filter", "user-status-filter"].forEach((id) => {
    document.querySelector(`#${id}`)?.addEventListener("input", renderUsers);
  });
  document.querySelector("#new-case")?.addEventListener("click", clearCaseForm);
  document.querySelector("#save-case")?.addEventListener("click", saveCase);
  document.querySelector("#delete-case")?.addEventListener("click", deleteSelectedCase);
  document.querySelector("#document-upload")?.addEventListener("change", uploadDocument);
  document.querySelector("#internal-file-upload")?.addEventListener("change", uploadInternalFile);
  document.querySelector("#save-meeting")?.addEventListener("click", saveMeetingNotice);
  document.querySelector("#new-meeting")?.addEventListener("click", clearMeetingForm);
  document.querySelector("#save-announcement")?.addEventListener("click", saveAnnouncement);
  document.querySelector("#new-announcement")?.addEventListener("click", clearAnnouncementForm);
  document.querySelector("#save-resource")?.addEventListener("click", savePublicResource);
  document.querySelector("#new-resource")?.addEventListener("click", clearPublicResourceForm);
  document.querySelector("#save-executive")?.addEventListener("click", saveExecutiveMember);
  document.querySelector("#new-executive")?.addEventListener("click", clearExecutiveForm);
  document.querySelector("#save-election")?.addEventListener("click", saveElectionContact);
  document.querySelector("#new-election")?.addEventListener("click", clearElectionForm);
  document.querySelector("#save-distribution-company")?.addEventListener("click", saveDistributionCompany);
  document.querySelector("#distribution-company-select")?.addEventListener("change", populateDistributionCompanyForm);
  document.querySelector("#import-election-csv")?.addEventListener("click", importElectionCsv);
  document.querySelector("#export-election-csv")?.addEventListener("click", exportElectionCsv);
  document.querySelector("#create-invite")?.addEventListener("click", createInviteCode);
}

function renderAll() {
  if (activeRole() === "committee") {
    activeAdminTab = "workspace";
    activeSectionTab = "resources";
  }
  applyRoleVisibility();
  renderAdminTabs();
  renderSectionTabs();
  renderStats();
  renderCases();
  renderCaseForm();
  renderResources();
  renderApprovals();
  renderQuestionModeration();
  renderInternalFiles();
  renderUsers();
  renderMeetingManager();
  renderAnnouncementManager();
  renderPublicResourceManager();
  renderExecutiveManager();
  renderElectionManager();
  renderInviteManager();
}

function renderAdminTabs() {
  const role = activeRole();
  const isAdminView = role === "admin";
  const isStewardView = role === "steward";
  const isCommitteeView = role === "committee";
  const casesTab = document.querySelector("#cases-tab");
  const usersTab = document.querySelector("#users-tab");
  const contentTab = document.querySelector("#content-tab");
  const moderationTab = document.querySelector("#moderation-tab");
  const statsGrid = document.querySelector(".stats-grid");
  const approvalPanel = document.querySelector("#approval-panel");

  if (isCommitteeView) {
    document.querySelectorAll(".admin-nav-tab").forEach((button) => {
      button.hidden = true;
      button.classList.remove("active");
    });
    if (statsGrid) statsGrid.hidden = true;
    if (casesTab) casesTab.hidden = true;
    if (usersTab) usersTab.hidden = true;
    if (contentTab) contentTab.hidden = true;
    if (moderationTab) moderationTab.hidden = true;
    if (approvalPanel) approvalPanel.hidden = true;
    activeSectionTab = "resources";
    renderSectionTabs();
    return;
  }

  if (!["dashboard", "workspace", "public", "admin"].includes(activeAdminTab)) activeAdminTab = "dashboard";
  if (!isAdminView && activeAdminTab === "admin") activeAdminTab = "dashboard";

  document.querySelectorAll(".admin-nav-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === activeAdminTab);
    const tab = button.dataset.tab;
    const allowed = tab === "dashboard"
      || tab === "workspace"
      || tab === "public"
      || (tab === "admin" && isAdminView);
    button.hidden = !(allowed && (isAdminView || isStewardView));
  });
  if (statsGrid) statsGrid.hidden = activeAdminTab !== "dashboard";
  if (casesTab) casesTab.hidden = !(isAdminView || isStewardView) || activeAdminTab !== "workspace";
  if (usersTab) usersTab.hidden = !isAdminView || activeAdminTab !== "admin";
  if (contentTab) contentTab.hidden = !(isAdminView || isStewardView) || activeAdminTab !== "public";
  if (moderationTab) moderationTab.hidden = !(isAdminView || isStewardView) || activeAdminTab !== "public";
  if (approvalPanel) approvalPanel.hidden = !isAdminView || activeAdminTab !== "admin";
  if (activeAdminTab !== "workspace") {
    const sectionNav = document.querySelector("#section-nav");
    if (sectionNav) sectionNav.hidden = true;
  }
}

function renderSectionTabs() {
  const role = activeRole();
  const sectionNav = document.querySelector("#section-nav");
  const filesSection = document.querySelector("#files-section");
  const casesSection = document.querySelector("#cases-tab");
  const resourcesSection = document.querySelector("#resources-section");
  const isWorkspaceView = activeAdminTab === "workspace" || role === "committee";

  if (!sectionNav || !filesSection || !casesSection || !resourcesSection) return;

  if (role === "committee") {
    sectionNav.hidden = true;
    filesSection.hidden = true;
    casesSection.hidden = true;
    resourcesSection.hidden = false;
    return;
  }

  if (!isWorkspaceView) {
    sectionNav.hidden = true;
    return;
  }

  const allowed = role === "admin" || role === "steward"
    ? ["cases", "files", "resources"]
    : ["resources"];
  if (!allowed.includes(activeSectionTab)) activeSectionTab = allowed[0];

  sectionNav.hidden = false;
  document.querySelectorAll(".section-nav-tab").forEach((button) => {
    const section = button.dataset.section;
    const visible = allowed.includes(section);
    button.hidden = !visible;
    button.classList.toggle("active", visible && activeSectionTab === section);
  });

  filesSection.hidden = activeSectionTab !== "files";
  casesSection.hidden = activeSectionTab !== "cases";
  resourcesSection.hidden = activeSectionTab !== "resources";
}

function renderQuestionModeration() {
  const list = document.querySelector("#moderation-list");
  if (!list) return;

  if (!isAdminOrSteward()) return;

  const total = document.querySelector("#moderation-total");
  if (total) total.textContent = `${publicQuestions.length} messages`;
  list.innerHTML = publicQuestions.map((item) => `
    <article class="moderation-card">
      <div>
        <h3>${escapeHtml(item.question)}</h3>
        <p>${escapeHtml(item.answer || "No public answer yet.")}</p>
        <div class="meta-row">
          <span class="pill">${escapeHtml(item.name || "Anonymous")}</span>
          <span class="pill">${escapeHtml(item.status || "pending")}</span>
          <span class="pill">${new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <button class="secondary" type="button" data-delete-question-id="${escapeHtml(item.id)}">Remove</button>
    </article>
  `).join("") || `<div class="empty">No Q&A messages have been submitted.</div>`;
  list.querySelectorAll("[data-delete-question-id]").forEach((button) => {
    button.addEventListener("click", () => deletePublicQuestion(button.dataset.deleteQuestionId));
  });
}

async function deletePublicQuestion(questionId) {
  if (!confirm("Remove this Q&A message?")) return;
  if (previewMode) {
    publicQuestions = publicQuestions.filter((item) => item.id !== questionId);
    renderQuestionModeration();
    return;
  }
  const { error } = await supabaseClient.from("public_questions").delete().eq("id", questionId);
  if (error) return alert(error.message);
  await loadData();
  renderQuestionModeration();
}

function renderInternalFiles() {
  const list = document.querySelector("#internal-file-list");
  if (!list) return;

  const kindSelect = document.querySelector("#internal-file-kind");
  const canUseGrievanceTracker = isSteward();
  
  if (kindSelect) {
    kindSelect.querySelector('option[value="grievance_tracker"]').disabled = !canUseGrievanceTracker;
    if (!canUseGrievanceTracker && kindSelect.value === "grievance_tracker") kindSelect.value = "general";
  }
  
  const rows = internalFiles.filter((file) => file.kind !== "grievance_tracker" || canUseGrievanceTracker);
  list.innerHTML = rows.map((file) => `
    <article class="file-card">
      <div>
        <h3>${escapeHtml(file.file_name)}</h3>
        <p>${file.kind === "grievance_tracker" ? "Locked grievance tracker Excel" : "General internal file"}</p>
      </div>
      <button type="button" data-internal-path="${escapeHtml(file.storage_path)}">Open</button>
    </article>
  `).join("") || `<div class="empty">No internal files uploaded yet.</div>`;
  list.querySelectorAll("[data-internal-path]").forEach((button) => {
    button.addEventListener("click", () => openInternalFile(button.dataset.internalPath));
  });
}

async function uploadInternalFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const kind = value("internal-file-kind");
  
  if (kind === "grievance_tracker" && !isSteward()) {
    alert("Only stewards can upload the locked grievance tracker.");
    event.target.value = "";
    return;
  }
  
  if (kind === "grievance_tracker" && !/\.(xlsx|xls|xlsm)$/i.test(file.name)) {
    alert("Use an Excel workbook for the grievance tracker.");
    event.target.value = "";
    return;
  }
  
  if (previewMode) {
    internalFiles.unshift({ id: crypto.randomUUID(), file_name: file.name, kind, storage_path: `${kind}/${file.name}`, uploaded_at: new Date().toISOString() });
    renderInternalFiles();
    event.target.value = "";
    return;
  }
  
  const folder = kind === "grievance_tracker" ? "grievance-tracker" : "general";
  const storagePath = `${folder}/${Date.now()}-${file.name}`;
  const upload = await supabaseClient.storage.from(INTERNAL_BUCKET).upload(storagePath, file);
  if (upload.error) return alert(upload.error.message);
  const record = await supabaseClient.from("internal_files").insert({
    file_name: file.name,
    kind,
    storage_path: storagePath,
    mime_type: file.type,
    file_size: file.size,
    uploaded_by: currentUser.id
  });
  if (record.error) return alert(record.error.message);
  await loadData();
  renderInternalFiles();
  event.target.value = "";
}

async function openInternalFile(path) {
  if (previewMode) return alert("File download is available after Supabase storage is configured.");
  const { data, error } = await supabaseClient.storage.from(INTERNAL_BUCKET).createSignedUrl(path, 300);
  if (error) return alert(error.message);
  window.open(data.signedUrl, "_blank", "noopener");
}

function renderApprovals() {
  const panel = document.querySelector("#approval-panel");
  if (!panel) return;

  if (!isAdmin() || activeAdminTab !== "users") {
    panel.hidden = true;
    return;
  }

  panel.hidden = false;
  document.querySelector("#approval-total").textContent = `${pendingProfiles.length} pending`;
  const list = document.querySelector("#approval-list");
  const pendingHtml = pendingProfiles.map((profile) => renderRoleCard(profile, { pending: true })).join("")
    || `<div class="empty">No access requests are waiting for approval.</div>`;
  const activeHtml = activeProfiles.map((profile) => renderRoleCard(profile, { pending: false })).join("")
    || `<div class="empty">No active private users yet.</div>`;
  list.innerHTML = `
    <div class="role-management-group">
      <h3>Pending access requests</h3>
      ${pendingHtml}
    </div>
    <div class="role-management-group">
      <h3>Approved private users</h3>
      ${activeHtml}
    </div>
  `;
  list.querySelectorAll("[data-approve-id]").forEach((button) => {
    button.addEventListener("click", () => updateAccessRequest(button.dataset.approveId, true, selectedRolesForProfile(button.dataset.approveId)));
  });
  list.querySelectorAll("[data-reject-id]").forEach((button) => {
    button.addEventListener("click", () => updateAccessRequest(button.dataset.rejectId, false));
  });
  list.querySelectorAll("[data-save-roles-id]").forEach((button) => {
    button.addEventListener("click", () => updateProfileRoles(button.dataset.saveRolesId, selectedRolesForProfile(button.dataset.saveRolesId)));
  });
}

function renderRoleCard(profile, { pending }) {
  const roles = assignedRoles(profile);
  return `
    <article class="approval-card">
      <div>
        <h3>${escapeHtml(profile.full_name)}</h3>
        <p>${escapeHtml(profile.email || "")}</p>
        ${pending ? `<p>${escapeHtml(profile.request_note || "No reason provided.")}</p>` : ""}
        <div class="meta-row">
          <span class="pill">${escapeHtml(profile.role)}</span>
          <span class="pill">${profile.share_email ? "Email public" : "Email private"}</span>
          <span class="pill">${profile.share_phone ? "Phone public" : "Phone private"}</span>
          <span class="pill">${new Date(profile.created_at).toLocaleDateString()}</span>
        </div>
        <div class="role-checks" data-role-checks="${escapeHtml(profile.id)}">
          ${["admin", "steward", "committee"].map((role) => `
            <label>
              <input type="checkbox" value="${role}" ${roles.includes(role) ? "checked" : ""}>
              ${roleLabels[role] || role}
            </label>
          `).join("")}
        </div>
      </div>
      <div class="button-row">
        ${pending
          ? `<button type="button" data-approve-id="${escapeHtml(profile.id)}">Approve</button>
             <button class="secondary" type="button" data-reject-id="${escapeHtml(profile.id)}">Reject</button>`
          : `<button type="button" data-save-roles-id="${escapeHtml(profile.id)}">Save roles</button>`}
      </div>
    </article>
  `;
}

function filteredUsers() {
  const term = document.querySelector("#user-search")?.value.trim().toLowerCase() || "";
  const role = document.querySelector("#user-role-filter")?.value || "all";
  const status = document.querySelector("#user-status-filter")?.value || "all";
  return [...activeProfiles, ...pendingProfiles].filter((profile) => {
    const matchesTerm = !term || [profile.full_name, profile.email].join(" ").toLowerCase().includes(term);
    const roles = assignedRoles(profile);
    const matchesRole = role === "all" || roles.includes(role) || profile.role === role;
    const derivedStatus = profile.active ? "active" : profile.access_status === "pending" ? "pending" : "inactive";
    const matchesStatus = status === "all" || derivedStatus === status;
    return matchesTerm && matchesRole && matchesStatus;
  });
}

function renderUsers() {
  const list = document.querySelector("#users-list");
  if (!list || !isAdmin()) return;
  const rows = filteredUsers();
  const total = document.querySelector("#users-total");
  if (total) total.textContent = `${rows.length} users`;
  list.innerHTML = rows.map((profile) => `
    <article class="approval-card">
      <div>
        <h3>${escapeHtml(profile.full_name || profile.email || "User")}</h3>
        <div class="user-profile-grid">
          <label>
            Name
            <input type="text" value="${escapeHtml(profile.full_name || "")}" data-profile-name="${escapeHtml(profile.id)}">
          </label>
          <label>
            Email
            <input type="email" value="${escapeHtml(profile.email || "")}" data-profile-email="${escapeHtml(profile.id)}">
          </label>
          <label>
            Phone
            <input type="text" value="${escapeHtml(profile.phone || "")}" data-profile-phone="${escapeHtml(profile.id)}">
          </label>
        </div>
        <div class="meta-row">
          <span class="pill">${profile.active ? "active" : escapeHtml(profile.access_status || "inactive")}</span>
          <span class="pill">${assignedRoles(profile).join(", ")}</span>
          <span class="pill">${profile.share_email ? "email public" : "email private"}</span>
          <span class="pill">${profile.share_phone ? "phone public" : "phone private"}</span>
        </div>
        <div class="role-checks" data-role-checks="${escapeHtml(profile.id)}">
          ${["admin", "steward", "committee"].map((role) => `
            <label>
              <input type="checkbox" value="${role}" ${assignedRoles(profile).includes(role) ? "checked" : ""}>
              ${roleLabels[role] || role}
            </label>
          `).join("")}
        </div>
      </div>
      <div class="button-row">
        ${profile.access_status === "pending"
          ? `<button type="button" data-approve-id="${escapeHtml(profile.id)}">Approve</button>
             <button class="secondary" type="button" data-reject-id="${escapeHtml(profile.id)}">Reject</button>`
          : `<button type="button" data-save-profile-id="${escapeHtml(profile.id)}">Save profile</button>
             <button class="secondary" type="button" data-save-roles-id="${escapeHtml(profile.id)}">Save roles</button>
             <button class="secondary" type="button" data-reset-password-id="${escapeHtml(profile.id)}">Send reset</button>`}
      </div>
    </article>
  `).join("") || `<div class="empty">No users match the current filters.</div>`;
  list.querySelectorAll("[data-approve-id]").forEach((button) => {
    button.addEventListener("click", () => updateAccessRequest(button.dataset.approveId, true, selectedRolesForProfile(button.dataset.approveId)));
  });
  list.querySelectorAll("[data-reject-id]").forEach((button) => {
    button.addEventListener("click", () => updateAccessRequest(button.dataset.rejectId, false));
  });
  list.querySelectorAll("[data-save-roles-id]").forEach((button) => {
    button.addEventListener("click", () => updateProfileRoles(button.dataset.saveRolesId, selectedRolesForProfile(button.dataset.saveRolesId)));
  });
  list.querySelectorAll("[data-save-profile-id]").forEach((button) => {
    button.addEventListener("click", () => updateProfileDetails(button.dataset.saveProfileId));
  });
  list.querySelectorAll("[data-reset-password-id]").forEach((button) => {
    button.addEventListener("click", () => sendUserResetPassword(button.dataset.resetPasswordId));
  });
}

function assignedRoles(profile) {
  return profileRoles(profile);
}

function selectedRolesForProfile(profileId) {
  const container = Array.from(document.querySelectorAll("[data-role-checks]"))
    .find((element) => element.dataset.roleChecks === profileId);
  const checks = Array.from(container?.querySelectorAll("input:checked") || []).map((input) => normalizeRoleName(input.value));
  return checks.length ? checks : ["committee"];
}

async function updateAccessRequest(profileId, approved, assignedRoles = []) {
  if (previewMode) {
    pendingProfiles = pendingProfiles.filter((profile) => profile.id !== profileId);
    if (approved) {
      activeProfiles.push({ id: profileId, full_name: "Approved preview user", email: "preview@example.ca", role: assignedRoles[0] || "committee", assigned_roles: assignedRoles, share_email: false, share_phone: false, created_at: new Date().toISOString() });
    }
    renderApprovals();
    return;
  }

  const payload = approved
    ? { active: true, access_status: "approved", role: assignedRoles[0] || "committee", assigned_roles: assignedRoles, approved_by: currentUser.id, approved_at: new Date().toISOString() }
    : { active: false, access_status: "rejected", approved_by: currentUser.id, approved_at: new Date().toISOString() };
  const { error } = await supabaseClient.from("profiles").update(payload).eq("id", profileId);
  if (error) return alert(error.message);
  if (approved) await upsertApprovedDirectoryEntry(profileId);
  await loadData();
  renderApprovals();
}

async function updateProfileRoles(profileId, assignedRoles) {
  if (!assignedRoles.length) return alert("Select at least one role.");
  if (previewMode) {
    const profile = activeProfiles.find((item) => item.id === profileId);
    if (profile) {
      profile.role = assignedRoles[0];
      profile.assigned_roles = assignedRoles;
      if (profile.id === currentProfile.id) currentProfile = { ...currentProfile, role: profile.role, assigned_roles: assignedRoles };
    }
    renderRoleSwitcher();
    renderApprovals();
    return;
  }
  const { error } = await supabaseClient
    .from("profiles")
    .update({ role: assignedRoles[0], assigned_roles: assignedRoles })
    .eq("id", profileId);
  if (error) return alert(error.message);
  await upsertApprovedDirectoryEntry(profileId);
  if (profileId === currentProfile.id) {
    const { data } = await supabaseClient.from("profiles").select("*").eq("id", profileId).single();
    if (data) currentProfile = data;
  }
  await loadData();
  renderPortal();
}

function userFieldValue(profileId, field) {
  const selector = `[data-profile-${field}="${profileId}"]`;
  return document.querySelector(selector)?.value.trim() || "";
}

async function updateProfileDetails(profileId) {
  const fullName = userFieldValue(profileId, "name");
  const email = userFieldValue(profileId, "email");
  const phone = userFieldValue(profileId, "phone");
  if (!fullName) return alert("Name is required.");
  if (!email) return alert("Email is required.");
  if (previewMode) {
    const profile = activeProfiles.find((item) => item.id === profileId) || pendingProfiles.find((item) => item.id === profileId);
    if (profile) {
      profile.full_name = fullName;
      profile.email = email;
      profile.phone = phone || null;
    }
    renderUsers();
    return;
  }
  const { error } = await supabaseClient
    .from("profiles")
    .update({ full_name: fullName, email, phone: phone || null })
    .eq("id", profileId);
  if (error) return alert(error.message);
  if (profileId === currentProfile.id) {
    currentProfile = { ...currentProfile, full_name: fullName, email, phone: phone || null };
  }
  await loadData();
  renderPortal();
}

async function sendUserResetPassword(profileId) {
  const profile = activeProfiles.find((item) => item.id === profileId) || pendingProfiles.find((item) => item.id === profileId);
  const email = userFieldValue(profileId, "email") || profile?.email;
  if (!email) return alert("User email is required before sending a reset.");
  if (!isConfigured) return alert("Supabase is not configured.");
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${window.location.pathname}?type=recovery`
  });
  if (error) return alert(error.message);
  alert(`Password reset sent to ${email}.`);
}

async function upsertApprovedDirectoryEntry(profileId) {
  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("id,email,full_name,role,assigned_roles,phone,share_email,share_phone")
    .eq("id", profileId)
    .single();
  if (error || !profile) return;
  const directoryRoles = profileRoles(profile).filter((role) => role === "admin" || role === "steward");
  await supabaseClient.from("public_directory_entries").delete().eq("profile_id", profile.id);
  if (!directoryRoles.length) return;

  const contactParts = [];
  if (profile.share_email && profile.email) contactParts.push(profile.email);
  if (profile.share_phone && profile.phone) contactParts.push(profile.phone);

  await supabaseClient.from("public_directory_entries").upsert(directoryRoles.map((role) => ({
    profile_id: profile.id,
    directory_role: role,
    display_name: profile.full_name,
    public_title: role === "admin" ? "Admin contact" : "Shop Steward",
    location: "Local 4005",
    contract: "Shared",
    public_contact: contactParts.join(" / ") || null,
    is_public: true
  })), { onConflict: "profile_id,directory_role" });
}

function filteredCases() {
  const term = document.querySelector("#search")?.value.trim().toLowerCase() || "";
  const contract = document.querySelector("#contract-filter")?.value || "all";
  const status = document.querySelector("#status-filter")?.value || "all";
  return cases.filter((item) => {
    const text = [item.member_name, item.member_contact, item.issue_type, item.status, item.summary, item.next_action].join(" ").toLowerCase();
    return (!term || text.includes(term)) &&
      (contract === "all" || item.contract === contract) &&
      (status === "all" || item.status === status);
  });
}

function renderStats() {
  const grid = document.querySelector(".stats-grid");
  if (!isAdminOrSteward() || activeAdminTab !== "workspace" || activeSectionTab !== "cases") {
    if (grid) grid.hidden = true;
    return;
  }
  if (grid) grid.hidden = false;
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
      <div class="meta-row">
        <span class="pill">${escapeHtml(item.contract)}</span>
        <span class="pill ${item.status === "Resolved" ? "ok" : ""}">${escapeHtml(item.status)}</span>
        ${item.next_deadline ? `<span class="pill ${daysUntil(item.next_deadline) <= 7 ? "warn" : ""}">${escapeHtml(item.next_deadline)}</span>` : ""}
      </div>
    </button>
  `).join("");
  list.querySelectorAll("[data-case-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      selectedCaseId = button.dataset.caseId;
      await loadCaseChildren(selectedCaseId);
      renderAll();
    });
  });
}

function renderCaseForm() {
  const item = cases.find((row) => row.id === selectedCaseId);
  const deleteButton = document.querySelector("#delete-case");
  if (deleteButton) deleteButton.hidden = !isAdmin() || !item;
  if (!item) {
    resetCaseFormFields();
    return;
  }
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
  
  let sourceRows = resources;
  
  // Committee only sees wages form
  if (isCommittee()) {
    sourceRows = resources.filter((item) => item.url === "wages-form.html");
  }
  // Stewards see most resources but not admin-only
  else if (isSteward()) {
    sourceRows = resources.filter((item) => !item.adminOnly);
  }
  // Admins see everything
  
  const rows = sourceRows.filter((item) => {
    const text = [item.title, item.category, item.description].join(" ").toLowerCase();
    return (!term || text.includes(term)) && (contract === "all" || item.contract === contract || item.contract === "Shared");
  });
  
  document.querySelector("#resource-list").innerHTML = rows.map((item) => `
    <article class="resource-item">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description || "")}</p>
      <div class="meta-row">
        <span class="pill">${escapeHtml(item.category)}</span>
        <span class="pill">${escapeHtml(item.contract)}</span>
      </div>
      ${item.url ? `<a href="${escapeHtml(item.url)}" ${item.url.startsWith("http") ? `target="_blank" rel="noopener"` : ""}>Open</a>` : ""}
    </article>
  `).join("") || `<div class="empty">No resources match the current filters.</div>`;

  const electionSection = document.querySelector("#elections-section");
  if (electionSection) electionSection.hidden = !(isAdmin() || isSteward() || isCommittee());
}

function normalizeMeetings(rows) {
  if (!Array.isArray(rows) || !rows.length) return [...defaultMeetings];
  return rows.map((meeting) => ({
    id: meeting.id,
    title: meeting.title,
    date: meeting.meeting_date,
    location: meeting.location,
    room: meeting.room || "",
    contract: meeting.contract || "Shared",
    note: meeting.note || ""
  }));
}

function renderMeetingManager() {
  const list = document.querySelector("#meetings-list");
  if (!list) return;
  if (!isAdminOrSteward()) {
    list.innerHTML = "";
    return;
  }
  const rows = meetingNotices.length ? meetingNotices : [...defaultMeetings];
  list.innerHTML = rows.map((meeting) => `
    <article class="resource-item ${meeting.id === selectedMeetingId ? "meeting-item-active" : ""}">
      <div class="meeting-item-header">
        <div>
          <h3>${escapeHtml(meeting.title)}</h3>
          <p>${escapeHtml(meeting.date)} · ${escapeHtml(meeting.location)}</p>
        </div>
        <div class="button-row">
          <button type="button" data-edit-meeting-id="${escapeHtml(meeting.id)}">Edit</button>
          <button class="secondary" type="button" data-delete-meeting-id="${escapeHtml(meeting.id)}">Delete</button>
        </div>
      </div>
      <div class="meta-row">
        <span class="pill">${escapeHtml(meeting.contract || "Shared")}</span>
        ${meeting.room ? `<span class="pill">${escapeHtml(meeting.room)}</span>` : ""}
      </div>
      ${meeting.note ? `<p>${escapeHtml(meeting.note)}</p>` : ""}
    </article>
  `).join("") || `<div class="empty">No meeting notices posted yet.</div>`;
  list.querySelectorAll("[data-edit-meeting-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedMeetingId = button.dataset.editMeetingId;
      populateMeetingForm(selectedMeetingId);
      renderMeetingManager();
    });
  });
  list.querySelectorAll("[data-delete-meeting-id]").forEach((button) => {
    button.addEventListener("click", () => deleteMeetingNotice(button.dataset.deleteMeetingId));
  });
  populateMeetingForm(selectedMeetingId);
}

function populateMeetingForm(meetingId) {
  const meeting = meetingNotices.find((item) => item.id === meetingId);
  if (!meeting) {
    clearMeetingFormFields();
    return;
  }
  setValue("meeting-id", meeting.id);
  setValue("meeting-title-input", meeting.title);
  setValue("meeting-date-input", meeting.date);
  setValue("meeting-location-input", meeting.location);
  setValue("meeting-room-input", meeting.room);
  setValue("meeting-contract-input", meeting.contract || "Shared");
  setValue("meeting-note-input", meeting.note);
}

function clearMeetingForm() {
  selectedMeetingId = null;
  clearMeetingFormFields();
  renderMeetingManager();
}

function clearMeetingFormFields() {
  ["meeting-id", "meeting-title-input", "meeting-date-input", "meeting-location-input", "meeting-room-input", "meeting-note-input"].forEach((id) => setValue(id, ""));
  setValue("meeting-contract-input", "Shared");
}

async function saveMeetingNotice() {
  if (!isAdminOrSteward()) return;
  const payload = {
    title: value("meeting-title-input"),
    meeting_date: value("meeting-date-input"),
    location: value("meeting-location-input"),
    room: value("meeting-room-input") || null,
    contract: value("meeting-contract-input") || "Shared",
    note: value("meeting-note-input") || null
  };
  if (!payload.title || !payload.meeting_date || !payload.location) {
    alert("Title, date, and location are required.");
    return;
  }

  if (previewMode || !isConfigured || !meetingsStorageReady) {
    const id = value("meeting-id") || crypto.randomUUID();
    const nextMeeting = {
      id,
      title: payload.title,
      date: payload.meeting_date,
      location: payload.location,
      room: payload.room || "",
      contract: payload.contract,
      note: payload.note || ""
    };
    const index = meetingNotices.findIndex((item) => item.id === id);
    if (index >= 0) meetingNotices[index] = nextMeeting;
    else meetingNotices.push(nextMeeting);
    selectedMeetingId = id;
    renderMeetingBoard(selectedMeetingId);
    renderMeetingManager();
    return;
  }

  const meetingId = value("meeting-id");
  const result = meetingId
    ? await supabaseClient.from("meetings").update({ ...payload, updated_by: currentUser.id }).eq("id", meetingId).select().single()
    : await supabaseClient.from("meetings").insert({ ...payload, created_by: currentUser.id, updated_by: currentUser.id }).select().single();
  if (result.error) return alert(result.error.message);
  await refreshMeetings(result.data.id);
}

async function deleteMeetingNotice(meetingId) {
  if (!isAdminOrSteward()) return;
  if (!confirm("Delete this meeting notice?")) return;
  if (previewMode || !isConfigured || !meetingsStorageReady) {
    meetingNotices = meetingNotices.filter((item) => item.id !== meetingId);
    selectedMeetingId = meetingNotices[0]?.id || null;
    renderMeetingBoard(selectedMeetingId);
    renderMeetingManager();
    return;
  }
  const { error } = await supabaseClient.from("meetings").delete().eq("id", meetingId);
  if (error) return alert(error.message);
  await refreshMeetings(selectedMeetingId === meetingId ? null : selectedMeetingId);
}

async function refreshMeetings(nextSelectedId = null) {
  const { data, error } = await supabaseClient
    .from("meetings")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return alert(error.message);
  meetingsStorageReady = true;
  meetingNotices = normalizeMeetings(data);
  selectedMeetingId = meetingNotices.find((item) => item.id === nextSelectedId)?.id || meetingNotices[0]?.id || null;
  renderMeetingBoard(selectedMeetingId);
  renderMeetingManager();
}

function renderAnnouncementManager() {
  const list = document.querySelector("#announcements-list");
  if (!list || !isAdminOrSteward()) return;
  list.innerHTML = announcementItems.map((item) => `
    <article class="resource-item ${item.id === selectedAnnouncementId ? "meeting-item-active" : ""}">
      <div class="meeting-item-header">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.date)} · ${escapeHtml(item.contract)}</p>
        </div>
        <div class="button-row">
          <button type="button" data-edit-announcement-id="${escapeHtml(item.id)}">Edit</button>
          <button class="secondary" type="button" data-delete-announcement-id="${escapeHtml(item.id)}">Delete</button>
        </div>
      </div>
      <div class="meta-row">
        ${item.priority ? `<span class="pill strong">${escapeHtml(item.priority)}</span>` : ""}
        ${item.category ? `<span class="pill">${escapeHtml(item.category)}</span>` : ""}
      </div>
      <p>${escapeHtml(item.summary)}</p>
    </article>
  `).join("") || `<div class="empty">No public announcements yet.</div>`;
  list.querySelectorAll("[data-edit-announcement-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedAnnouncementId = button.dataset.editAnnouncementId;
      populateAnnouncementForm(selectedAnnouncementId);
      renderAnnouncementManager();
    });
  });
  list.querySelectorAll("[data-delete-announcement-id]").forEach((button) => {
    button.addEventListener("click", () => deleteAnnouncement(button.dataset.deleteAnnouncementId));
  });
  populateAnnouncementForm(selectedAnnouncementId);
}

function populateAnnouncementForm(id) {
  const item = announcementItems.find((row) => row.id === id);
  if (!item) return clearAnnouncementFormFields();
  setValue("announcement-id", item.id);
  setValue("announcement-title-input", item.title);
  setValue("announcement-date-input", item.date);
  setValue("announcement-contract-input", item.contract || "Shared");
  setValue("announcement-category-input", item.category || "");
  setValue("announcement-priority-input", item.priority || "");
  setValue("announcement-summary-input", item.summary || "");
}

function clearAnnouncementForm() {
  selectedAnnouncementId = null;
  clearAnnouncementFormFields();
  renderAnnouncementManager();
}

function clearAnnouncementFormFields() {
  ["announcement-id", "announcement-title-input", "announcement-date-input", "announcement-category-input", "announcement-priority-input", "announcement-summary-input"].forEach((id) => setValue(id, ""));
  setValue("announcement-contract-input", "Shared");
}

async function saveAnnouncement() {
  if (!isAdminOrSteward()) return;
  const payload = {
    title: value("announcement-title-input"),
    date: value("announcement-date-input"),
    contract: value("announcement-contract-input") || "Shared",
    category: value("announcement-category-input") || null,
    priority: value("announcement-priority-input") || null,
    summary: value("announcement-summary-input"),
    updated_by: currentUser?.id || null
  };
  if (!payload.title || !payload.date || !payload.summary) return alert("Title, date, and summary are required.");
  if (previewMode || !isConfigured) {
    const id = value("announcement-id") || crypto.randomUUID();
    const row = { id, ...payload };
    const index = announcementItems.findIndex((item) => item.id === id);
    if (index >= 0) announcementItems[index] = row; else announcementItems.unshift(row);
    selectedAnnouncementId = id;
    renderPublicBoard();
    renderAnnouncementManager();
    return;
  }
  const id = value("announcement-id");
  const result = id
    ? await supabaseClient.from("public_announcements").update(payload).eq("id", id).select().single()
    : await supabaseClient.from("public_announcements").insert({ ...payload, created_by: currentUser.id }).select().single();
  if (result.error) return alert(result.error.message);
  await loadData();
  renderAll();
  renderPublicBoard();
}

async function deleteAnnouncement(id) {
  if (!isAdminOrSteward() || !confirm("Delete this announcement?")) return;
  if (previewMode || !isConfigured) {
    announcementItems = announcementItems.filter((item) => item.id !== id);
    selectedAnnouncementId = announcementItems[0]?.id || null;
    renderPublicBoard();
    renderAnnouncementManager();
    return;
  }
  const { error } = await supabaseClient.from("public_announcements").delete().eq("id", id);
  if (error) return alert(error.message);
  await loadData();
  renderAll();
  renderPublicBoard();
}

function renderPublicResourceManager() {
  const list = document.querySelector("#resources-list");
  if (!list || !isAdminOrSteward()) return;
  list.innerHTML = publicResourceItems.map((item) => `
    <article class="resource-item ${item.id === selectedPublicResourceId ? "meeting-item-active" : ""}">
      <div class="meeting-item-header">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.category)} · ${escapeHtml(item.contract)}</p>
        </div>
        <div class="button-row">
          <button type="button" data-edit-resource-id="${escapeHtml(item.id)}">Edit</button>
          <button class="secondary" type="button" data-delete-resource-id="${escapeHtml(item.id)}">Delete</button>
        </div>
      </div>
      <p>${escapeHtml(item.description || "")}</p>
    </article>
  `).join("") || `<div class="empty">No editable public resources yet.</div>`;
  list.querySelectorAll("[data-edit-resource-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedPublicResourceId = button.dataset.editResourceId;
      populatePublicResourceForm(selectedPublicResourceId);
      renderPublicResourceManager();
    });
  });
  list.querySelectorAll("[data-delete-resource-id]").forEach((button) => {
    button.addEventListener("click", () => deletePublicResource(button.dataset.deleteResourceId));
  });
  populatePublicResourceForm(selectedPublicResourceId);
}

function populatePublicResourceForm(id) {
  const item = publicResourceItems.find((row) => row.id === id) || resources.find((row) => row.id === id);
  if (!item) return clearPublicResourceFormFields();
  setValue("resource-id", item.id);
  setValue("resource-title-input", item.title);
  setValue("resource-category-input", item.category);
  setValue("resource-contract-input", item.contract || "Shared");
  setValue("resource-description-input", item.description || "");
  setValue("resource-url-input", item.url || "");
}

function clearPublicResourceForm() {
  selectedPublicResourceId = null;
  clearPublicResourceFormFields();
  renderPublicResourceManager();
}

function clearPublicResourceFormFields() {
  ["resource-id", "resource-title-input", "resource-category-input", "resource-description-input", "resource-url-input"].forEach((id) => setValue(id, ""));
  setValue("resource-contract-input", "Shared");
}

async function savePublicResource() {
  if (!isAdminOrSteward()) return;
  const payload = {
    title: value("resource-title-input"),
    category: value("resource-category-input"),
    contract: value("resource-contract-input") || "Shared",
    description: value("resource-description-input") || null,
    url: value("resource-url-input") || null,
    updated_by: currentUser?.id || null
  };
  if (!payload.title || !payload.category) return alert("Title and category are required.");
  if (previewMode || !isConfigured) {
    const id = value("resource-id") || crypto.randomUUID();
    const row = { id, ...payload };
    const index = publicResourceItems.findIndex((item) => item.id === id);
    if (index >= 0) publicResourceItems[index] = row; else publicResourceItems.unshift(row);
    selectedPublicResourceId = id;
    renderPublicBoard();
    renderPublicResourceManager();
    return;
  }
  const id = value("resource-id");
  const result = id
    ? await supabaseClient.from("resources").update(payload).eq("id", id).select().single()
    : await supabaseClient.from("resources").insert({ ...payload, created_by: currentUser.id }).select().single();
  if (result.error) return alert(result.error.message);
  await loadData();
  renderAll();
  renderPublicBoard();
}

async function deletePublicResource(id) {
  if (!isAdminOrSteward() || !confirm("Delete this resource?")) return;
  if (previewMode || !isConfigured) {
    publicResourceItems = publicResourceItems.filter((item) => item.id !== id);
    selectedPublicResourceId = publicResourceItems[0]?.id || null;
    renderPublicBoard();
    renderPublicResourceManager();
    return;
  }
  const { error } = await supabaseClient.from("resources").delete().eq("id", id);
  if (error) return alert(error.message);
  await loadData();
  renderAll();
  renderPublicBoard();
}

function renderExecutiveManager() {
  const list = document.querySelector("#executives-list");
  if (!list || !isAdminOrSteward()) return;
  list.innerHTML = publicExecutiveTeam.map((item) => `
    <article class="resource-item ${item.id === selectedExecutiveId ? "meeting-item-active" : ""}">
      <div class="meeting-item-header">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.role)} · ${escapeHtml(item.area || "Local 4005")}</p>
        </div>
        <div class="button-row">
          <button type="button" data-edit-executive-id="${escapeHtml(item.id || "")}">Edit</button>
          <button class="secondary" type="button" data-delete-executive-id="${escapeHtml(item.id || "")}">Delete</button>
        </div>
      </div>
      ${item.contact ? `<p>${escapeHtml(item.contact)}</p>` : ""}
      ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
    </article>
  `).join("") || `<div class="empty">No executive entries yet.</div>`;
  list.querySelectorAll("[data-edit-executive-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedExecutiveId = button.dataset.editExecutiveId;
      populateExecutiveForm(selectedExecutiveId);
      renderExecutiveManager();
    });
  });
  list.querySelectorAll("[data-delete-executive-id]").forEach((button) => {
    button.addEventListener("click", () => deleteExecutiveMember(button.dataset.deleteExecutiveId));
  });
  populateExecutiveForm(selectedExecutiveId);
}

function populateExecutiveForm(id) {
  const item = publicExecutiveTeam.find((row) => row.id === id);
  if (!item) return clearExecutiveFormFields();
  setValue("executive-id", item.id || "");
  setValue("executive-name-input", item.name || "");
  setValue("executive-role-input", item.role || "");
  setValue("executive-area-input", item.area || "");
  setValue("executive-contact-input", item.contact || "");
  setValue("executive-note-input", item.note || "");
}

function clearExecutiveForm() {
  selectedExecutiveId = null;
  clearExecutiveFormFields();
  renderExecutiveManager();
}

function clearExecutiveFormFields() {
  ["executive-id", "executive-name-input", "executive-role-input", "executive-area-input", "executive-contact-input", "executive-note-input"].forEach((id) => setValue(id, ""));
}

async function saveExecutiveMember() {
  if (!isAdminOrSteward()) return;
  const payload = {
    name: value("executive-name-input"),
    role: value("executive-role-input"),
    area: value("executive-area-input") || null,
    contact: value("executive-contact-input") || null,
    note: value("executive-note-input") || null
  };
  if (!payload.name || !payload.role) return alert("Name and role are required.");
  if (previewMode || !isConfigured) {
    const id = value("executive-id") || crypto.randomUUID();
    const row = { id, ...payload };
    const index = publicExecutiveTeam.findIndex((item) => item.id === id);
    if (index >= 0) publicExecutiveTeam[index] = row; else publicExecutiveTeam.push(row);
    selectedExecutiveId = id;
    renderPublicDirectory();
    renderExecutiveManager();
    return;
  }
  const id = value("executive-id");
  const result = id
    ? await supabaseClient.from("public_executive_team").update({ ...payload, updated_by: currentUser.id }).eq("id", id).select().single()
    : await supabaseClient.from("public_executive_team").insert({ ...payload, created_by: currentUser.id, updated_by: currentUser.id }).select().single();
  if (result.error) return alert(result.error.message);
  await loadData();
  renderAll();
  renderPublicDirectory();
}

async function deleteExecutiveMember(id) {
  if (!isAdminOrSteward() || !confirm("Delete this executive entry?")) return;
  if (previewMode || !isConfigured) {
    publicExecutiveTeam = publicExecutiveTeam.filter((item) => item.id !== id);
    selectedExecutiveId = publicExecutiveTeam[0]?.id || null;
    renderPublicDirectory();
    renderExecutiveManager();
    return;
  }
  const { error } = await supabaseClient.from("public_executive_team").delete().eq("id", id);
  if (error) return alert(error.message);
  await loadData();
  renderAll();
  renderPublicDirectory();
}

function renderElectionManager() {
  const list = document.querySelector("#elections-list");
  if (!list) return;
  if (!(isAdmin() || isSteward() || isCommittee())) {
    list.innerHTML = "";
    return;
  }
  renderElectionCompanyOptions();
  populateDistributionCompanyForm();
  const grouped = electionContacts.reduce((map, item) => {
    const company = item.company || "Unassigned";
    if (!map[company]) map[company] = [];
    map[company].push(item);
    return map;
  }, {});
  const companies = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
  list.innerHTML = companies.map((company) => `
    <section class="resource-item">
      <h3>${escapeHtml(company)}</h3>
      <p>${escapeHtml(companyElectionDateLabel(company))}</p>
      <div class="content-list">
        ${grouped[company].map((item) => `
          <article class="resource-item ${item.id === selectedElectionId ? "meeting-item-active" : ""}">
            <div class="meeting-item-header">
              <div>
                <h3>${escapeHtml(item.member_name)}</h3>
                <p>${escapeHtml(item.group_name || "")}</p>
              </div>
              <div class="button-row">
                <button type="button" data-edit-election-id="${escapeHtml(item.id)}">Edit</button>
                <button class="secondary" type="button" data-delete-election-id="${escapeHtml(item.id)}">Delete</button>
              </div>
            </div>
            <div class="meta-row">
              ${item.is_chief_shop_steward ? `<span class="pill strong">Chief shop steward</span>` : ""}
              ${item.is_shop_steward ? `<span class="pill">Shop steward</span>` : ""}
            </div>
            <p>${escapeHtml(item.email || "")}</p>
            ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
          </article>
        `).join("")}
      </div>
    </section>
  `).join("") || `<div class="empty">No distribution list contacts yet.</div>`;
  list.querySelectorAll("[data-edit-election-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedElectionId = button.dataset.editElectionId;
      populateElectionForm(selectedElectionId);
      renderElectionManager();
    });
  });
  list.querySelectorAll("[data-delete-election-id]").forEach((button) => {
    button.addEventListener("click", () => deleteElectionContact(button.dataset.deleteElectionId));
  });
  populateElectionForm(selectedElectionId);
}

function renderElectionCompanyOptions() {
  const companies = Array.from(new Set([
    ...local4005Companies,
    ...distributionCompanies.map((item) => item.company).filter(Boolean),
    ...electionContacts.map((item) => item.company).filter(Boolean)
  ])).sort((a, b) => a.localeCompare(b));
  ["#election-company-input", "#distribution-company-select"].forEach((selector) => {
    const select = document.querySelector(selector);
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = `
      <option value="">Select company</option>
      ${companies.map((company) => `<option value="${escapeHtml(company)}">${escapeHtml(company)}</option>`).join("")}
    `;
    if (companies.includes(currentValue)) select.value = currentValue;
  });
}

function companyElectionDateLabel(company) {
  const match = distributionCompanies.find((item) => item.company === company);
  return match?.election_date ? `Election date: ${match.election_date}` : "Election date not set";
}

function populateDistributionCompanyForm() {
  const select = document.querySelector("#distribution-company-select");
  if (!select) return;
  const company = select.value || distributionCompanies[0]?.company || local4005Companies[0] || "";
  if (company) select.value = company;
  const match = distributionCompanies.find((item) => item.company === company);
  setValue("distribution-election-date-input", match?.election_date || "");
}

async function saveDistributionCompany() {
  if (!(isAdmin() || isSteward() || isCommittee())) return;
  const company = value("distribution-company-select");
  if (!company) return alert("Select a company.");
  const payload = {
    company,
    election_date: value("distribution-election-date-input") || null
  };
  if (previewMode || !isConfigured) {
    const index = distributionCompanies.findIndex((item) => item.company === company);
    if (index >= 0) distributionCompanies[index] = { ...distributionCompanies[index], ...payload };
    else distributionCompanies.push(payload);
    renderElectionManager();
    return;
  }
  const existing = distributionCompanies.find((item) => item.company === company);
  const result = existing?.id
    ? await supabaseClient.from("distribution_companies").update({ ...payload, updated_by: currentUser.id }).eq("id", existing.id).select().single()
    : await supabaseClient.from("distribution_companies").insert({ ...payload, created_by: currentUser.id, updated_by: currentUser.id }).select().single();
  if (result.error) return alert(result.error.message);
  await loadData();
  renderAll();
}

function populateElectionForm(id) {
  const item = electionContacts.find((row) => row.id === id);
  if (!item) return clearElectionFormFields();
  setValue("election-id", item.id);
  setValue("election-company-input", item.company || "");
  setValue("election-group-input", item.group_name || "");
  setValue("election-member-input", item.member_name || "");
  setValue("election-email-input", item.email || "");
  setValue("election-note-input", item.note || "");
  const stewardCheck = document.querySelector("#election-is-shop-steward-input");
  const chiefCheck = document.querySelector("#election-is-chief-shop-steward-input");
  if (stewardCheck) stewardCheck.checked = !!item.is_shop_steward;
  if (chiefCheck) chiefCheck.checked = !!item.is_chief_shop_steward;
}

function clearElectionForm() {
  selectedElectionId = null;
  clearElectionFormFields();
  renderElectionManager();
}

function clearElectionFormFields() {
  ["election-id", "election-company-input", "election-group-input", "election-member-input", "election-email-input", "election-note-input"].forEach((id) => setValue(id, ""));
  const stewardCheck = document.querySelector("#election-is-shop-steward-input");
  const chiefCheck = document.querySelector("#election-is-chief-shop-steward-input");
  if (stewardCheck) stewardCheck.checked = false;
  if (chiefCheck) chiefCheck.checked = false;
}

function parseCsvRow(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"(.*)"$/, "$1").trim());
}

function normalizeElectionImportHeaders(headers) {
  return headers.map((header) => header.trim().toLowerCase().replace(/\s+/g, "_"));
}

function normalizeElectionImportRecord(headers, values) {
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  const company = row.company || row.employer || row.organization || "";
  const groupName = row.group_name || row.group || row.department || row.location || "";
  const memberName = row.member_name || row.name || row.employee_name || "";
  const email = row.email || row.member_email || "";
  const note = row.note || row.notes || row.comment || "";
  const electionDate = row.election_date || row.date || "";
  return {
    company: company.trim(),
    group_name: groupName.trim() || null,
    member_name: memberName.trim(),
    email: email.trim() || null,
    note: note.trim() || null,
    election_date: electionDate.trim() || null,
    is_shop_steward: ["true", "yes", "1", "shop steward"].includes((row.is_shop_steward || row.shop_steward || "").trim().toLowerCase()),
    is_chief_shop_steward: ["true", "yes", "1", "chief shop steward"].includes((row.is_chief_shop_steward || row.chief_shop_steward || "").trim().toLowerCase())
  };
}

async function importElectionCsv() {
  if (!(isAdmin() || isSteward() || isCommittee())) return;
  const input = document.querySelector("#election-csv-input");
  const file = input?.files?.[0];
  if (!file) return alert("Choose a CSV file first.");
  const text = await file.text();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return alert("CSV must include a header row and at least one data row.");
  const headers = normalizeElectionImportHeaders(parseCsvRow(lines[0]));
  const rows = lines.slice(1)
    .map((line) => normalizeElectionImportRecord(headers, parseCsvRow(line)))
    .filter((row) => row.company && row.member_name);
  if (!rows.length) return alert("No valid rows found. CSV needs at least company and member_name.");

  const companyUpserts = Array.from(new Map(
    rows
      .filter((row) => row.election_date)
      .map((row) => [row.company, { company: row.company, election_date: row.election_date }])
  ).values());

  if (previewMode || !isConfigured) {
    companyUpserts.forEach((row) => {
      const index = distributionCompanies.findIndex((item) => item.company === row.company);
      if (index >= 0) distributionCompanies[index] = { ...distributionCompanies[index], ...row };
      else distributionCompanies.push(row);
    });
    rows.forEach((row) => {
      electionContacts.push({ id: crypto.randomUUID(), ...row });
    });
    selectedElectionId = electionContacts[0]?.id || null;
    renderElectionManager();
    input.value = "";
    alert(`${rows.length} contact${rows.length === 1 ? "" : "s"} imported.`);
    return;
  }

  const payload = rows.map((row) => ({
    ...row,
    election_date: null,
    created_by: currentUser.id,
    updated_by: currentUser.id
  }));
  if (companyUpserts.length) {
    for (const companyRow of companyUpserts) {
      const existing = distributionCompanies.find((item) => item.company === companyRow.company);
      const result = existing?.id
        ? await supabaseClient.from("distribution_companies").update({ ...companyRow, updated_by: currentUser.id }).eq("id", existing.id)
        : await supabaseClient.from("distribution_companies").insert({ ...companyRow, created_by: currentUser.id, updated_by: currentUser.id });
      if (result.error) return alert(result.error.message);
    }
  }
  const { error } = await supabaseClient.from("election_contacts").insert(payload);
  if (error) return alert(error.message);
  await loadData();
  renderAll();
  input.value = "";
  alert(`${rows.length} contact${rows.length === 1 ? "" : "s"} imported.`);
}

function exportElectionCsv() {
  if (!(isAdmin() || isSteward() || isCommittee())) return;
  if (!electionContacts.length) return alert("No contacts to export.");
  const lines = [
    ["company", "group_name", "election_date", "member_name", "email", "is_shop_steward", "is_chief_shop_steward", "note"].join(","),
    ...electionContacts.map((item) => [
      item.company || "",
      item.group_name || "",
      distributionCompanies.find((row) => row.company === item.company)?.election_date || "",
      item.member_name || "",
      item.email || "",
      item.is_shop_steward ? "true" : "false",
      item.is_chief_shop_steward ? "true" : "false",
      item.note || ""
    ].map((value) => `"${String(value).replace(/"/g, "\"\"")}"`).join(","))
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "local-4005-distribution-lists.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function saveElectionContact() {
  if (!(isAdmin() || isSteward() || isCommittee())) return;
  const payload = {
    company: value("election-company-input"),
    group_name: value("election-group-input") || null,
    member_name: value("election-member-input"),
    email: value("election-email-input") || null,
    note: value("election-note-input") || null,
    is_shop_steward: document.querySelector("#election-is-shop-steward-input")?.checked || false,
    is_chief_shop_steward: document.querySelector("#election-is-chief-shop-steward-input")?.checked || false
  };
  if (!payload.company || !payload.member_name) return alert("Company and member name are required.");
  if (previewMode || !isConfigured) {
    const id = value("election-id") || crypto.randomUUID();
    const row = { id, ...payload };
    const index = electionContacts.findIndex((item) => item.id === id);
    if (index >= 0) electionContacts[index] = row; else electionContacts.push(row);
    selectedElectionId = id;
    renderElectionManager();
    return;
  }
  const id = value("election-id");
  const result = id
    ? await supabaseClient.from("election_contacts").update({ ...payload, updated_by: currentUser.id }).eq("id", id).select().single()
    : await supabaseClient.from("election_contacts").insert({ ...payload, created_by: currentUser.id, updated_by: currentUser.id }).select().single();
  if (result.error) return alert(result.error.message);
  await loadData();
  renderAll();
}

async function deleteElectionContact(id) {
  if (!(isAdmin() || isSteward() || isCommittee()) || !confirm("Delete this election contact?")) return;
  if (previewMode || !isConfigured) {
    electionContacts = electionContacts.filter((item) => item.id !== id);
    selectedElectionId = electionContacts[0]?.id || null;
    renderElectionManager();
    return;
  }
  const { error } = await supabaseClient.from("election_contacts").delete().eq("id", id);
  if (error) return alert(error.message);
  await loadData();
  renderAll();
}

function renderInviteManager() {
  const list = document.querySelector("#invites-list");
  if (!list || !isAdminOrSteward()) return;
  list.innerHTML = inviteCodes.map((item) => `
    <article class="resource-item">
      <div class="meeting-item-header">
        <div>
          <h3>${escapeHtml(item.code)}</h3>
          <p>${escapeHtml(item.requested_role)}${item.note ? ` · ${escapeHtml(item.note)}` : ""}</p>
          <p class="helper-text">${escapeHtml(buildInviteUrl(item))}</p>
        </div>
        <div class="button-row">
          <button type="button" data-copy-invite-id="${escapeHtml(item.id)}">Copy link</button>
          <button class="secondary" type="button" data-delete-invite-id="${escapeHtml(item.id)}">Delete</button>
        </div>
      </div>
    </article>
  `).join("") || `<div class="empty">No invite codes created yet.</div>`;
  list.querySelectorAll("[data-copy-invite-id]").forEach((button) => {
    button.addEventListener("click", () => copyInviteLink(button.dataset.copyInviteId));
  });
  list.querySelectorAll("[data-delete-invite-id]").forEach((button) => {
    button.addEventListener("click", () => deleteInviteCode(button.dataset.deleteInviteId));
  });
}

function buildInviteUrl(invite) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("register", "1");
  url.searchParams.set("invite", invite.code);
  url.searchParams.set("role", normalizeRoleName(invite.requested_role || "steward"));
  return url.toString();
}

async function copyInviteLink(id) {
  const invite = inviteCodes.find((item) => item.id === id);
  if (!invite) return;
  const url = buildInviteUrl(invite);
  try {
    await navigator.clipboard.writeText(url);
    alert("Invite link copied.");
  } catch {
    window.prompt("Copy this invite link:", url);
  }
}

async function createInviteCode() {
  if (!isAdminOrSteward()) return;
  const payload = {
    code: `L4005-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    requested_role: value("invite-role-input") || "steward",
    note: value("invite-note-input") || null,
    created_by: currentUser?.id || null
  };
  if (previewMode || !isConfigured) {
    inviteCodes.unshift({ id: crypto.randomUUID(), ...payload });
    renderInviteManager();
    setValue("invite-note-input", "");
    return;
  }
  const { error } = await supabaseClient.from("invite_codes").insert(payload);
  if (error) return alert(error.message);
  await loadData();
  renderInviteManager();
  setValue("invite-note-input", "");
}

async function deleteInviteCode(id) {
  if (!isAdminOrSteward() || !confirm("Delete this invite code?")) return;
  if (previewMode || !isConfigured) {
    inviteCodes = inviteCodes.filter((item) => item.id !== id);
    renderInviteManager();
    return;
  }
  const { error } = await supabaseClient.from("invite_codes").delete().eq("id", id);
  if (error) return alert(error.message);
  await loadData();
  renderInviteManager();
}

function renderDocuments() {
  const list = document.querySelector("#document-list");
  list.innerHTML = documents.map((item) => `
    <li>
      <strong>${escapeHtml(item.file_name)}</strong>
      <button class="secondary" type="button" data-doc-path="${escapeHtml(item.storage_path)}">Open</button>
    </li>
  `).join("") || `<li class="empty">No documents uploaded for this case.</li>`;
  list.querySelectorAll("[data-doc-path]").forEach((button) => {
    button.addEventListener("click", () => openDocument(button.dataset.docPath));
  });
}

function renderActivity() {
  document.querySelector("#activity-list").innerHTML = notes.map((item) => `
    <li>
      <strong>${new Date(item.created_at).toLocaleString()}</strong>
      <p>${escapeHtml(item.body)}</p>
    </li>
  `).join("") || `<li class="empty">No activity yet.</li>`;
}

function clearCaseForm() {
  selectedCaseId = null;
  resetCaseFormFields();
}

function resetCaseFormFields() {
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
  const payload = {
    member_name: value("member-name"),
    member_contact: value("member-contact"),
    contract: value("case-contract"),
    issue_type: value("issue-type"),
    status: value("case-status"),
    next_deadline: value("next-deadline") || null,
    next_action: value("next-action"),
    summary: value("summary"),
    updated_by: currentUser.id
  };
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
  let result;
  if (caseId) {
    result = await supabaseClient.from("cases").update(payload).eq("id", caseId).select().single();
  } else {
    result = await supabaseClient.from("cases").insert({ ...payload, created_by: currentUser.id }).select().single();
  }
  if (result.error) return alert(result.error.message);
  selectedCaseId = result.data.id;

  if (noteText) {
    await supabaseClient.from("case_notes").insert({ case_id: selectedCaseId, body: noteText, created_by: currentUser.id });
  }
  await loadData();
  await loadCaseChildren(selectedCaseId);
  renderAll();
}

async function deleteSelectedCase() {
  if (!isAdmin() || !selectedCaseId) return;
  if (!confirm("Delete this case and its notes/documents?")) return;
  if (previewMode) {
    cases = cases.filter((item) => item.id !== selectedCaseId);
    selectedCaseId = cases[0]?.id || null;
    if (selectedCaseId) {
      await loadCaseChildren(selectedCaseId);
    } else {
      documents = [];
      notes = [];
    }
    renderAll();
    return;
  }
  const { data, error } = await supabaseClient.from("cases").delete().eq("id", selectedCaseId).select("id");
  if (error) return alert(error.message);
  if (!data?.length) return alert("Case was not deleted. Refresh and confirm your account still has admin access.");
  selectedCaseId = null;
  await loadData();
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

  const record = await supabaseClient.from("case_documents").insert({
    case_id: selectedCaseId,
    file_name: file.name,
    storage_path: storagePath,
    mime_type: file.type,
    file_size: file.size,
    uploaded_by: currentUser.id
  });
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
  return String(text || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
