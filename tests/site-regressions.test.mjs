import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseHTML } from "linkedom";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");

function harness(options = {}) {
  const { document } = parseHTML(html);
  // Linkedom does not implement the browser's default select value or form reset.
  Object.defineProperty(Object.getPrototypeOf(document.createElement("select")), "value", {
    configurable: true,
    get() { const selected = this.querySelector("option[selected]") || this.querySelector("option"); return selected?.getAttribute("value") || ""; },
    set(value) { this.querySelectorAll("option").forEach((option) => { if (option.getAttribute("value") === value) option.setAttribute("selected", ""); else option.removeAttribute("selected"); }); }
  });
  const tables = { ...options.tables };
  const calls = [];
  let counter = 0;
  const client = {
    auth: {
      getUser: async () => ({ data: { user: null } }),
      signOut: async () => ({}),
      setSession: async () => ({})
    },
    from(table) {
      const query = { table, op: "select", filters: [], one: false };
      const chain = {
        select() { return chain; },
        eq(key, value) { query.filters.push([key, value]); return chain; },
        order() { return chain; },
        limit() { return chain; },
        single() { query.one = true; return chain; },
        insert(payload) { query.op = "insert"; query.payload = payload; return chain; },
        update(payload) { query.op = "update"; query.payload = payload; return chain; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            calls.push({ ...query });
            if (options.rejectTable === table) throw new Error("Connection lost");
            if (options.errorTable === table) return { data: null, error: { message: "Temporarily unavailable" } };
            let rows = tables[table] || [];
            if (query.op === "insert") {
              const row = { ...query.payload, id: "00000000-0000-4000-8000-" + String(++counter).padStart(12, "0") };
              rows = [...rows, row]; tables[table] = rows;
              return { data: query.one ? row : [row], error: null };
            }
            const matches = (row) => query.filters.every(([key, value]) => row[key] === value);
            if (query.op === "update") {
              tables[table] = rows = rows.map((row) => matches(row) ? { ...row, ...query.payload } : row);
            }
            const selected = rows.filter(matches);
            return { data: query.one ? selected[0] : selected, error: null };
          }).then(resolve, reject);
        }
      };
      return chain;
    }
  };
  let location = new URL("https://local4005.test/" + (options.search || "?board=1"));
  const window = {
    STEWARD_PORTAL_CONFIG: { supabaseUrl: "https://example.supabase.co", supabaseAnonKey: "x".repeat(40) },
    supabase: options.sdkMissing ? undefined : { createClient: () => client },
    get location() { return location; },
    history: { replaceState(_state, _title, url) { location = new URL(url, location.href); } },
    sessionStorage: { getItem() { return "1"; }, setItem() {} },
    addEventListener() {}
  };
  const evaluate = new Function("window", "document", "fetch", "URL", "URLSearchParams", "AbortController", "setTimeout", "clearTimeout", "crypto",
    source + "\nreturn (expression) => eval(expression);")(
      window, document, options.fetch || (async () => { throw new Error("Offline"); }),
      URL, URLSearchParams, AbortController, setTimeout, clearTimeout,
      { randomUUID: () => "10000000-0000-4000-8000-000000000001" }
    );
  return { document, window, tables, calls, evaluate, async settle() { for (let i = 0; i < 30; i++) await Promise.resolve(); } };
}

function editor(h) {
  h.evaluate(`currentUser = { id: "member-1" };
    currentProfile = { id: "member-1", full_name: "Member", role: "member", assigned_roles: ["member"], active: true };
    app.innerHTML = document.querySelector("#portal-template").innerHTML;
    memberPostPanelOpen = true;`);
  h.document.querySelector("#member-post-title").value = "Test guide";
  h.document.querySelector("#member-post-excerpt").value = "Short summary";
  h.document.querySelector("#member-post-body").value = "Detailed explanation";
}

test("public board survives an unavailable sign-in library without sample notices", async () => {
  const h = harness({ sdkMissing: true });
  await h.settle();
  assert.ok(h.document.querySelector("#staff-login"));
  assert.equal(h.document.querySelector("#public-data-status").hidden, false);
  assert.equal(h.document.querySelectorAll(".announcement-card").length, 0);
  assert.equal(h.document.querySelectorAll(".qa-card").length, 0);
});

test("successful empty reads do not resurrect deleted guides, meetings, or notices", async () => {
  const h = harness();
  await h.settle();
  assert.equal(h.evaluate("memberPosts.length"), 0);
  assert.equal(h.evaluate("meetingNotices.length"), 0);
  assert.equal(h.evaluate("announcementItems.length"), 0);
  assert.equal(h.evaluate("normalizeMeetings([]).length"), 0);
});

test("failed live data loads are visible and retry preserves the board", async () => {
  const h = harness({ errorTable: "member_posts" });
  await h.settle();
  assert.match(h.document.querySelector("#public-data-message").textContent, /agreement guides/);
  assert.equal(h.document.querySelector("#retry-public-data").disabled, false);
  await h.evaluate("loadPublicBoardData()");
  assert.ok(h.document.querySelector("#public-search"));
});

test("search matches all words, accents, contacts and meeting details", async () => {
  const h = harness();
  await h.settle();
  h.document.querySelector("#public-search").value = "Gautreau Rheanne";
  assert.equal(h.evaluate('publicBoardMatches({name:"Rhéanne Gautreau", area:"Moncton"})'), true);
  h.document.querySelector("#public-search").value = "safety moncton";
  assert.equal(h.evaluate('publicBoardMatches({title:"Safety meeting", location:"Moncton"})'), true);
  assert.equal(h.evaluate('publicBoardMatches({title:"Safety meeting", location:"Halifax"})'), false);
});

test("contract filters include shared information and exclude the other contract", async () => {
  const h = harness();
  await h.settle();
  h.document.querySelector("#public-contract").value = "Contract 1";
  assert.equal(h.evaluate('publicBoardMatches({contract:"Shared"})'), true);
  assert.equal(h.evaluate('publicBoardMatches({contract:"Contract 2"})'), false);
  h.document.querySelector("#public-contract").value = "Shared";
  assert.equal(h.evaluate('publicBoardMatches({contract:"Contract 1"})'), false);
});

test("shared search URLs restore filters and encode new searches", async () => {
  const h = harness({ search: "?board=1&q=boot%20allowance&contract=Contract%201" });
  await h.settle();
  assert.equal(h.document.querySelector("#public-search").value, "boot allowance");
  assert.equal(h.document.querySelector("#public-contract").value, "Contract 1");
  h.document.querySelector("#public-search").value = "pay & leave";
  h.evaluate("updatePublicFilters()");
  assert.equal(h.window.location.searchParams.get("q"), "pay & leave");
  assert.equal(h.window.location.searchParams.get("board"), "1");
});

test("pending questions never render publicly even if present in memory", async () => {
  const h = harness();
  await h.settle();
  h.evaluate('publicQuestions = [{question:"Pending private question",status:"pending"},{question:"Answered question",answer:"Answer",status:"answered"}]; renderQABoard();');
  assert.equal(h.document.querySelectorAll(".qa-card").length, 1);
  assert.doesNotMatch(h.document.querySelector("#qa-list").textContent, /Pending private/);
});

test("unsafe saved links cannot execute script from public cards", async () => {
  const h = harness();
  await h.settle();
  for (const url of ["javascript:alert(1)", "data:text/html,test", "//other.test", "java\nscript:alert(1)"]) {
    assert.equal(h.evaluate("safeLink(" + JSON.stringify(url) + ")"), "");
  }
  assert.equal(h.evaluate('safeLink("https://example.ca/agreement.pdf", false)'), "https://example.ca/agreement.pdf");
  h.evaluate('memberPosts = [{id:"one",status:"published",title:"<script>alert(1)</script>",source_url:"javascript:alert(1)"}]; renderPublicBoard();');
  assert.equal(h.document.querySelector("#agreement-guide-list script"), null);
  assert.equal(h.document.querySelector('#agreement-guide-list a[href^="javascript:"]'), null);
});

test("committee contacts load while private case queries stay disabled", async () => {
  const h = harness();
  await h.settle(); h.calls.length = 0;
  h.evaluate('currentProfile = {role:"committee",assigned_roles:["committee"],active:true};');
  await h.evaluate("loadData()");
  assert.ok(h.calls.some((call) => call.table === "election_contacts"));
  assert.ok(h.calls.some((call) => call.table === "distribution_companies"));
  assert.equal(h.calls.some((call) => call.table === "cases" || call.table === "internal_files" || call.table === "profiles"), false);
});

test("ordinary member accounts do not request committee contacts or private cases", async () => {
  const h = harness();
  await h.settle(); h.calls.length = 0;
  h.evaluate('currentProfile = {role:"member",assigned_roles:["member"],active:true};');
  await h.evaluate("loadData()");
  assert.equal(h.calls.some((call) => ["cases","internal_files","election_contacts","distribution_companies","profiles"].includes(call.table)), false);
});

test("saving a new draft twice updates one post and blocks concurrent submits", async () => {
  const h = harness(); await h.settle(); editor(h);
  await Promise.all([h.evaluate("saveMemberPost()"), h.evaluate("saveMemberPost()")]);
  const id = h.document.querySelector("#member-post-id").value;
  assert.ok(id);
  h.document.querySelector("#member-post-title").value = "Updated guide";
  await h.evaluate("saveMemberPost()");
  assert.equal(h.tables.member_posts.length, 1);
  assert.equal(h.tables.member_posts[0].id, id);
  assert.equal(h.tables.member_posts[0].title, "Updated guide");
  assert.equal(h.calls.filter((call) => call.table === "member_posts" && call.op === "insert").length, 1);
});

test("a failed draft save keeps the text and enables retry", async () => {
  const h = harness({ rejectTable: "member_posts" }); await h.settle(); editor(h);
  await h.evaluate("saveMemberPost()");
  assert.equal(h.document.querySelector("#member-post-body").value, "Detailed explanation");
  assert.equal(h.document.querySelector("#save-member-post").disabled, false);
  assert.match(h.document.querySelector("#member-post-message").textContent, /could not confirm/);
});

test("post sources are validated before a database write", async () => {
  const h = harness(); await h.settle(); editor(h); h.calls.length = 0;
  h.document.querySelector("#member-post-source").value = "javascript:alert(1)";
  await h.evaluate("saveMemberPost()");
  assert.equal(h.calls.length, 0);
  assert.match(h.document.querySelector("#member-post-message").textContent, /source link/);
});

test("public navigation anchors and filter descriptions resolve", async () => {
  const h = harness(); await h.settle();
  for (const link of h.document.querySelectorAll(".public-nav a, .hero-actions a")) {
    assert.ok(h.document.querySelector(link.getAttribute("href")), link.getAttribute("href"));
  }
  assert.ok(h.document.querySelector("#" + h.document.querySelector("#public-search").getAttribute("aria-describedby")));
  assert.equal(h.document.querySelector("#assistant-ask").type, "submit");
});
