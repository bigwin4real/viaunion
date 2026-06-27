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

const publicMeetings = [
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
let selectedCaseId = null;
let activePortalRole = null;
let activeAdminTab = "cases";

const roleLabels = {
  admin: "Admin tools",
  steward: "Shop steward tools",
  committee: "Committee form"
};

function profileRoles(profile) {
  const assigned = Array.isArray(profile?.assigned_roles)
    ? profile.assigned_roles.filter(Boolean)
    : [];
  if (profile?.role === "admin") {
    const adminRoles = ["admin", "steward", "committee"];
    return assigned.length ? Array.from(new Set([...adminRoles, ...assigned])) : adminRoles;
  }
  if (profile?.role === "steward") {
    const stewardRoles = ["steward", "committee"];
    return assigned.length ? Array.from(new Set([...stewardRoles, ...assigned])) : stewardRoles;
  }
  if (assigned.length) return assigned;
  return [profile?.role || "committee"];
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
  renderMeetingBoard("regular");
  renderPublicDirectory();
  loadPublicAccountDirectory();
  loadOfficialContacts();
  loadPublicQuestions();
  renderDiscounts();
  document.querySelector("#staff-login")?.addEventListener("click", renderAuth);
  document.querySelector("#assistant-ask")?.addEventListener("click", answerPublicQuestion);
  document.querySelector("#question-form")?.addEventListener("submit", submitPublicQuestion);
  ["public-search", "public-contract"].forEach((id) => {
    document.querySelector(`#${id}`)?.addEventListener("input", renderPublicBoard);
  });
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
  const announcements = publicAnnouncements.filter(matches);
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
  const publicRows = publicResources.filter(matches);
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
  const active = publicMeetings.find((meeting) => meeting.id === activeId) || publicMeetings[0];
  if (count) count.textContent = `${publicMeetings.length} notices`;
  tabs.innerHTML = publicMeetings.map((meeting) => `
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
          request_note: requestNote,
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

async function loadData() {
  const committeeOnly = profileHasRole(currentProfile, "committee") && !profileHasRole(currentProfile, "admin") && !profileHasRole(currentProfile, "steward");
  const canManageUsers = profileHasRole(currentProfile, "admin");
  const [{ data: caseRows }, { data: resourceRows }, { data: pendingRows }, { data: activeProfileRows }, { data: internalRows }, { data: questionRows }] = await Promise.all([
    committeeOnly ? Promise.resolve({ data: [] }) : supabaseClient.from("cases").select("*").order("updated_at", { ascending: false }),
    committeeOnly ? Promise.resolve({ data: [] }) : supabaseClient.from("resources").select("*").order("category"),
    canManageUsers
      ? supabaseClient.from("profiles").select("*").eq("active", false).eq("access_status", "pending").order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    canManageUsers
      ? supabaseClient.from("profiles").select("*").eq("active", true).order("full_name", { ascending: true })
      : Promise.resolve({ data: [] }),
    committeeOnly ? Promise.resolve({ data: [] }) : supabaseClient.from("internal_files").select("*").order("uploaded_at", { ascending: false }),
    committeeOnly ? Promise.resolve({ data: [] }) : supabaseClient.from("public_questions").select("*").order("created_at", { ascending: false })
  ]);

  cases = caseRows || [];
  resources = resourceRows || [];
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
  pendingProfiles = pendingRows || [];
  activeProfiles = activeProfileRows || [];
  internalFiles = internalRows || [];
  publicQuestions = questionRows || [];
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
    applyRoleVisibility();
    renderAll();
  });
}

function applyRoleVisibility() {
  const role = activeRole();
  const title = document.querySelector(".topbar h1");
  if (title) {
    if (role === "admin") title.textContent = "Admin Tools";
    else if (role === "steward") title.textContent = "Shop Steward Portal";
    else title.textContent = "Committee Forms";
  }

  const visibility = {
    ".stats-grid": role === "steward",
    ".approval-panel": role === "admin",
    ".qa-moderation": role === "admin" || role === "steward",
    ".internal-files": role === "steward",
    ".workspace": role === "steward",
    ".resources": role === "steward" || role === "committee",
    "#admin-nav": role === "admin",
    "#users-tab": role === "admin"
  };

  Object.entries(visibility).forEach(([selector, visible]) => {
    const element = document.querySelector(selector);
    if (element) element.hidden = !visible;
  });

  const resourcesTitle = document.querySelector("#resources-title");
  if (resourcesTitle) resourcesTitle.textContent = role === "committee" ? "Committee form access" : "Protected resources";
  const resourcesSubtitle = document.querySelector(".resources .section-heading span");
  if (resourcesSubtitle) resourcesSubtitle.textContent = role === "committee" ? "Lost time and expense claim form" : "Protected references and templates";
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
}

function renderAll() {
  applyRoleVisibility();
  renderAdminTabs();
  renderStats();
  renderCases();
  renderCaseForm();
  renderResources();
  renderApprovals();
  renderQuestionModeration();
  renderInternalFiles();
  renderUsers();
}

function renderAdminTabs() {
  document.querySelectorAll(".admin-nav-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === activeAdminTab);
  });
  const isAdminView = isAdmin();
  const casesTab = document.querySelector("#cases-tab");
  const usersTab = document.querySelector("#users-tab");
  const contentTab = document.querySelector("#content-tab");
  const moderationTab = document.querySelector("#moderation-tab");
  if (casesTab) casesTab.hidden = !isAdminView ? !isSteward() : activeAdminTab !== "cases";
  if (usersTab) usersTab.hidden = !isAdminView || activeAdminTab !== "users";
  if (contentTab) contentTab.hidden = !isAdminView || activeAdminTab !== "content";
  if (moderationTab) moderationTab.hidden = !isAdminView || activeAdminTab !== "moderation";
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

  if (!canManageUsers()) {
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
  if (!list || !canManageUsers()) return;
  const rows = filteredUsers();
  const total = document.querySelector("#users-total");
  if (total) total.textContent = `${rows.length} users`;
  list.innerHTML = rows.map((profile) => `
    <article class="approval-card">
      <div>
        <h3>${escapeHtml(profile.full_name || profile.email || "User")}</h3>
        <p>${escapeHtml(profile.email || "")}</p>
        <div class="meta-row">
          <span class="pill">${profile.active ? "active" : escapeHtml(profile.access_status || "inactive")}</span>
          <span class="pill">${assignedRoles(profile).join(", ")}</span>
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
          : `<button type="button" data-save-roles-id="${escapeHtml(profile.id)}">Save roles</button>`}
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
}

function assignedRoles(profile) {
  return profileRoles(profile);
}

function selectedRolesForProfile(profileId) {
  const container = Array.from(document.querySelectorAll("[data-role-checks]"))
    .find((element) => element.dataset.roleChecks === profileId);
  const checks = Array.from(container?.querySelectorAll("input:checked") || []).map((input) => input.value);
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
