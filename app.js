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
    member_contact: "555-0100",
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

const publicStewards = [
  {
    name: "Add steward name",
    role: "Shop Steward",
    area: "Moncton",
    contract: "Contract 1",
    contact: "Contact details to be added"
  },
  {
    name: "Add steward name",
    role: "Shop Steward",
    area: "Moncton",
    contract: "Contract 2",
    contact: "Contact details to be added"
  }
];

const publicAdminContact = {
  name: "Local 4005 Admin",
  role: "Website / member contact",
  area: "Moncton",
  contact: "Admin contact details to be added",
  note: "Use this contact for website updates, public board corrections, and general Local 4005 inquiries."
};

const publicExecutiveTeam = [
  { name: "Add president name", role: "President", area: "Local 4005", contact: "Contact details to be added" },
  { name: "Add vice-president name", role: "Vice-President", area: "Local 4005", contact: "Contact details to be added" },
  { name: "Add secretary name", role: "Secretary", area: "Local 4005", contact: "Contact details to be added" },
  { name: "Add treasurer name", role: "Treasurer", area: "Local 4005", contact: "Contact details to be added" },
  { name: "Add recording secretary name", role: "Recording Secretary", area: "Local 4005", contact: "Contact details to be added" }
];

const publicResources = [
  { title: "VIA Rail Agreement No. 1", category: "Agreements", contract: "Contract 1", description: "Council 4000 lists Agreement No. 1 - National as 2025-2027.", url: "https://www.unifor4000.com/collective-agreements" },
  { title: "VIA Rail Agreement No. 2", category: "Agreements", contract: "Contract 2", description: "Council 4000 lists Agreement No. 2 - National as 2025-2027.", url: "https://www.unifor4000.com/collective-agreements" },
  { title: "VIA Rail supplemental and safety agreements", category: "Agreements", contract: "Shared", description: "Council 4000 also links Agreement No. 1 and No. 2 supplementals plus the Safety and Health Agreement.", url: "https://www.unifor4000.com/collective-agreements" },
  { title: "Council 4000 bylaws", category: "Bylaws", contract: "Shared", description: "Council 4000 bylaws and constitution resources.", url: "https://www.unifor4000.com/bylaws-constitution" },
  { title: "Grievance forms", category: "Grievance", contract: "Shared", description: "Council 4000 grievance forms, including Local 4005.", url: "https://www.unifor4000.com/grievance-forms" },
  { title: "Union Savings discounts", category: "Discounts", contract: "Shared", description: "Member discount platform linked from Council 4000 resources.", url: "https://unionsavings.ca/en" },
  { title: "Meetings", category: "Meetings", contract: "Shared", description: "Meeting notices and general agenda information." },
  { title: "New member guide", category: "Guide", contract: "Shared", description: "Plain-language starting point for Local 4005 members." },
  { title: "Claims and payroll", category: "Guide", contract: "Shared", description: "Public-safe guidance on where to start with common questions." },
  { title: "Health and safety", category: "Committee", contract: "Shared", description: "Committee information and public-safe safety resources." },
  { title: "Contact a steward", category: "Support", contract: "Shared", description: "Use this area for approved contact instructions." }
];

const publicKnowledge = [
  { title: "VIA Rail Agreement No. 1", category: "Agreements", text: "Council 4000 lists VIA Rail Agreement No. 1 - National as 2025-2027 on its Collective Agreements page." },
  { title: "VIA Rail Agreement No. 2", category: "Agreements", text: "Council 4000 lists VIA Rail Agreement No. 2 - National as 2025-2027 on its Collective Agreements page." },
  { title: "Bylaws", category: "Bylaws", text: "Council 4000 bylaws and the Unifor Constitution are public resources linked from the Council 4000 bylaws page." },
  { title: "Discounts", category: "Discounts", text: "Union Savings is linked from Council 4000 resources as the member discount platform." },
  { title: "Q&A board", category: "Questions", text: "Members can submit public questions. Answers should be reviewed before being treated as official guidance." }
];

const sampleQuestions = [
  { id: "q1", name: "Member", question: "Where will current agreements be posted?", answer: "Approved public links will be added to the agreements section.", created_at: new Date().toISOString() }
];

let currentUser = null;
let currentProfile = null;
let cases = [];
let resources = [];
let notes = [];
let documents = [];
let pendingProfiles = [];
let internalFiles = [];
let publicQuestions = [...sampleQuestions];
let selectedCaseId = null;

const app = document.querySelector("#app");

if (previewMode) {
  currentUser = { id: "preview-user", email: "preview@local4005.test" };
  currentProfile = { id: "preview-user", full_name: "Preview Admin", role: "admin" };
  cases = [...sampleCases];
  resources = [...sampleResources];
  internalFiles = [
    { id: "file-1", file_name: "Locked-Grievance-Tracker.xlsx", kind: "grievance_tracker", storage_path: "grievance-tracker/Locked-Grievance-Tracker.xlsx", uploaded_at: new Date().toISOString() }
  ];
  pendingProfiles = [
    { id: "pending-1", full_name: "New Steward", email: "new.steward@example.ca", role: "steward", request_note: "Moncton steward access request", created_at: new Date().toISOString() }
  ];
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
  document.querySelector("#staff-login")?.addEventListener("click", renderAuth);
  document.querySelector("#assistant-ask")?.addEventListener("click", answerPublicQuestion);
  document.querySelector("#question-form")?.addEventListener("submit", submitPublicQuestion);
  ["public-search", "public-contract"].forEach((id) => {
    document.querySelector(`#${id}`)?.addEventListener("input", renderPublicBoard);
  });
}

function renderPublicDirectory() {
  const stewardList = document.querySelector("#public-steward-list");
  const adminCard = document.querySelector("#admin-contact-card");
  const executiveList = document.querySelector("#executive-list");
  if (stewardList) {
    stewardList.innerHTML = publicStewards.map(renderContactCard).join("");
  }
  if (adminCard) {
    adminCard.innerHTML = renderContactCard(publicAdminContact, true);
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
      <article class="resource-item">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <div class="meta-row">
          <span class="pill">${escapeHtml(item.category)}</span>
          <span class="pill">${escapeHtml(item.contract)}</span>
          ${item.url ? `<a class="pill" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Open</a>` : ""}
        </div>
      </article>
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
    answerBox.textContent = "Type a question to search public agreement notes and resources.";
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
    : `<p>No matching public note yet. Submit it to the Q&A board for review.</p>`;
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
    message.textContent = "Question submitted for review.";
  } else {
    publicQuestions.unshift({ id: crypto.randomUUID(), name, question, answer: "Pending review.", created_at: new Date().toISOString() });
    message.textContent = "Question added locally for preview.";
    renderQABoard();
  }
  document.querySelector("#question-form").reset();
}

function renderQABoard() {
  const list = document.querySelector("#qa-list");
  if (!list) return;
  list.innerHTML = publicQuestions.map((item) => `
    <article class="qa-card">
      <h3>${escapeHtml(item.question)}</h3>
      <p>${escapeHtml(item.answer || "Pending review.")}</p>
      <div class="meta-row">
        <span class="pill">${escapeHtml(item.name || "Anonymous")}</span>
      </div>
    </article>
  `).join("");
}

function renderAuth() {
  app.innerHTML = document.querySelector("#auth-template").innerHTML;
  document.querySelector("#back-public").addEventListener("click", () => window.location.reload());
  document.querySelector("#request-access").addEventListener("click", renderRegister);
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
    const password = value("register-password");
    const role = value("register-role");
    const requestNote = value("register-note");
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          requested_role: role,
          request_note: requestNote
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
  const [{ data: caseRows }, { data: resourceRows }, { data: pendingRows }, { data: internalRows }] = await Promise.all([
    supabaseClient.from("cases").select("*").order("updated_at", { ascending: false }),
    supabaseClient.from("resources").select("*").order("category"),
    currentProfile.role === "admin"
      ? supabaseClient.from("profiles").select("*").eq("active", false).eq("access_status", "pending").order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabaseClient.from("internal_files").select("*").order("uploaded_at", { ascending: false })
  ]);

  cases = caseRows || [];
  resources = resourceRows || [];
  pendingProfiles = pendingRows || [];
  internalFiles = internalRows || [];
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
  renderApprovals();
}

function wirePortalEvents() {
  document.querySelector("#sign-out").addEventListener("click", async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
    window.location.href = window.location.pathname;
  });
  ["search", "contract-filter", "status-filter"].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener("input", renderAll);
  });
  document.querySelector("#new-case").addEventListener("click", clearCaseForm);
  document.querySelector("#save-case").addEventListener("click", saveCase);
  document.querySelector("#document-upload").addEventListener("change", uploadDocument);
  document.querySelector("#internal-file-upload").addEventListener("change", uploadInternalFile);
}

function renderAll() {
  renderStats();
  renderCases();
  renderCaseForm();
  renderResources();
  renderApprovals();
  renderInternalFiles();
}

function renderInternalFiles() {
  const list = document.querySelector("#internal-file-list");
  if (!list) return;
  const kindSelect = document.querySelector("#internal-file-kind");
  const canUseGrievanceTracker = currentProfile.role === "steward";
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
  if (kind === "grievance_tracker" && currentProfile.role !== "steward") {
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
  if (currentProfile.role !== "admin") {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  document.querySelector("#approval-total").textContent = `${pendingProfiles.length} pending`;
  const list = document.querySelector("#approval-list");
  list.innerHTML = pendingProfiles.map((profile) => `
    <article class="approval-card">
      <div>
        <h3>${escapeHtml(profile.full_name)}</h3>
        <p>${escapeHtml(profile.email || "")}</p>
        <p>${escapeHtml(profile.request_note || "No reason provided.")}</p>
        <div class="meta-row">
          <span class="pill">${escapeHtml(profile.role)}</span>
          <span class="pill">${new Date(profile.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="button-row">
        <button type="button" data-approve-id="${escapeHtml(profile.id)}">Approve</button>
        <button class="secondary" type="button" data-reject-id="${escapeHtml(profile.id)}">Reject</button>
      </div>
    </article>
  `).join("") || `<div class="empty">No access requests are waiting for approval.</div>`;
  list.querySelectorAll("[data-approve-id]").forEach((button) => {
    button.addEventListener("click", () => updateAccessRequest(button.dataset.approveId, true));
  });
  list.querySelectorAll("[data-reject-id]").forEach((button) => {
    button.addEventListener("click", () => updateAccessRequest(button.dataset.rejectId, false));
  });
}

async function updateAccessRequest(profileId, approved) {
  if (previewMode) {
    pendingProfiles = pendingProfiles.filter((profile) => profile.id !== profileId);
    renderApprovals();
    return;
  }

  const payload = approved
    ? { active: true, access_status: "approved", approved_by: currentUser.id, approved_at: new Date().toISOString() }
    : { active: false, access_status: "rejected", approved_by: currentUser.id, approved_at: new Date().toISOString() };
  const { error } = await supabaseClient.from("profiles").update(payload).eq("id", profileId);
  if (error) return alert(error.message);
  await loadData();
  renderApprovals();
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
  if (!item) {
    clearCaseForm();
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
  const rows = resources.filter((item) => {
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
