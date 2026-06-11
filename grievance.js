const RECIPIENTS = {
  steward: {
    label: "Nicolas Hachey, Shop Steward, Contract 1, Moncton VCC",
    email: "hacheyn@me.com"
  },
  regional: {
    label: "Regional representative",
    email: ""
  },
  custom: {
    label: "Custom email",
    email: ""
  }
};

const form = document.querySelector("#grievance-form");
const message = document.querySelector("#grievance-message");

form.addEventListener("submit", submitGrievance);
document.querySelector("#download-copy").addEventListener("click", () => downloadCopy(buildSubmission()));
document.querySelector("#print-blank").addEventListener("click", () => window.print());

async function submitGrievance(event) {
  event.preventDefault();
  const submission = buildSubmission();
  if (!submission.to) {
    message.textContent = "Enter the regional/custom email address before submitting.";
    return;
  }

  message.textContent = "Preparing grievance copy...";
  try {
    const response = await fetch("/api/grievance-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission)
    });
    if (response.ok) {
      message.textContent = "Grievance copy submitted.";
      downloadCopy(submission);
      return;
    }
  } catch {
    // Fall back to the member's email client below.
  }

  downloadCopy(submission);
  window.location.href = mailtoUrl(submission);
  message.textContent = "Automatic sending is not configured yet. A completed copy was downloaded and your email client was opened.";
}

function buildSubmission() {
  const recipientType = document.querySelector('input[name="recipient"]:checked')?.value || "steward";
  const customEmail = value("custom-email");
  const recipient = RECIPIENTS[recipientType];
  const to = recipient.email || customEmail;
  const copyMember = value("copy-member") === "yes";
  const memberEmail = value("member-email");
  const fields = {
    memberName: value("member-name"),
    employeeNumber: value("employee-number"),
    memberPhone: value("member-phone"),
    memberEmail,
    workLocation: value("work-location"),
    agreement: value("agreement"),
    issueType: value("issue-type"),
    incidentDate: value("incident-date"),
    summary: value("summary"),
    remedy: value("remedy"),
    evidence: value("evidence"),
    recipient: recipient.label,
    to,
    cc: copyMember ? memberEmail : ""
  };
  return {
    ...fields,
    subject: `Local 4005 grievance intake - ${fields.memberName || "member"} - ${fields.issueType}`,
    body: formatSubmission(fields)
  };
}

function formatSubmission(fields) {
  return [
    "VIA Rail Local 4005 Moncton - Grievance Intake",
    "",
    `Member name: ${fields.memberName}`,
    `Employee number: ${fields.employeeNumber || "Not provided"}`,
    `Phone: ${fields.memberPhone || "Not provided"}`,
    `Email: ${fields.memberEmail}`,
    `Work location: ${fields.workLocation}`,
    `Agreement: ${fields.agreement}`,
    "",
    `Issue type: ${fields.issueType}`,
    `Incident date: ${fields.incidentDate || "Not provided"}`,
    "",
    "What happened:",
    fields.summary,
    "",
    "Remedy requested:",
    fields.remedy || "Not provided",
    "",
    "Documents or witnesses:",
    fields.evidence || "Not provided",
    "",
    `Selected recipient: ${fields.recipient}`,
    `Recipient email: ${fields.to}`,
    "",
    "Note: This is an intake copy for steward review. Timelines and filing requirements should be confirmed with a steward or regional representative."
  ].join("\n");
}

function downloadCopy(submission) {
  const blob = new Blob([submission.body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const name = (submission.memberName || "member").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "member";
  link.href = url;
  link.download = `local-4005-grievance-${name}.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function mailtoUrl(submission) {
  const params = new URLSearchParams();
  params.set("subject", submission.subject);
  params.set("body", submission.body);
  if (submission.cc) params.set("cc", submission.cc);
  return `mailto:${encodeURIComponent(submission.to)}?${params.toString()}`;
}

function value(id) {
  return document.querySelector(`#${id}`)?.value.trim() || "";
}
