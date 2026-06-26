// ─────────────────────────────────────────────
//  ViaUnion · Portal
//  The top-level authenticated view.
//  Swap out section components with your own.
//
//  Props:
//    user          – authenticated user object
//    users         – all users list (for admin role manager)
//    onRoleChange  – async fn(userId, newRole)
//    onLogout      – fn()
//    sections      – object of section components (see below)
// ─────────────────────────────────────────────
import React, { useState } from "react";
import {
  isAdmin,
  isSteward,
  isCommittee,
  getPortalTitle,
  getPermissions,
} from "./roles/roleHelpers";
import RoleGate from "./roles/RoleGate";
import RoleManager from "./roles/RoleManager";

// ── Nav items per role ──────────────────────────────────────────────────────

function buildNavItems(user) {
  const perms = getPermissions(user);
  const items = [];

  if (perms.canViewCases)        items.push({ id: "cases",    label: "Cases",          icon: "📋" });
  if (perms.canViewApprovalPanel) items.push({ id: "approvals", label: "Approvals",    icon: "✅" });
  if (perms.canViewQAModeration)  items.push({ id: "qa",       label: "Q&A",           icon: "💬" });
  if (perms.canViewResources)     items.push({ id: "resources",label: "Resources",     icon: "📁" });
  if (perms.canViewInternalFiles) items.push({ id: "files",    label: "Internal Files",icon: "🗂" });
  if (perms.canViewStats)         items.push({ id: "stats",    label: "Stats",         icon: "📊" });
  if (perms.canViewWagesForm)     items.push({ id: "wages",    label: "Wages Form",    icon: "💵" });
  if (perms.canManageRoles)       items.push({ id: "roles",    label: "Manage Roles",  icon: "🔑" });

  return items;
}

// ── Role badge colours ──────────────────────────────────────────────────────

function roleBadgeStyle(user) {
  if (isAdmin(user))     return { background: "#fef2f2", color: "#991b1b",  border: "1px solid #fca5a5" };
  if (isSteward(user))   return { background: "#eff6ff", color: "#1d4ed8",  border: "1px solid #93c5fd" };
  if (isCommittee(user)) return { background: "#f0fdf4", color: "#166534",  border: "1px solid #86efac" };
  return                         { background: "#f9fafb", color: "#374151",  border: "1px solid #d1d5db" };
}

function roleLabel(user) {
  if (isAdmin(user))     return "Admin";
  if (isSteward(user))   return "Shop Steward";
  if (isCommittee(user)) return "Committee";
  return "Member";
}

// ── Portal ──────────────────────────────────────────────────────────────────

export default function Portal({
  user,
  users = [],
  onRoleChange = async () => {},
  onLogout = () => {},
  // Section components — swap these with your real implementations.
  // Each receives `user` and `permissions` props.
  sections = {},
}) {
  const navItems = buildNavItems(user);
  const [activeTab, setActiveTab] = useState(navItems[0]?.id ?? "wages");
  const perms = getPermissions(user);
  const title = getPortalTitle(user);

  // ── Placeholder section when not provided by consumer ──────────────────
  function Section({ id }) {
    const Comp = sections[id];
    if (Comp) return <Comp user={user} permissions={perms} />;
    return (
      <div style={styles.placeholder}>
        <span style={styles.placeholderIcon}>🔧</span>
        <p style={styles.placeholderText}>
          Mount your <code>&lt;{id.charAt(0).toUpperCase() + id.slice(1)}Section /&gt;</code> component here.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.shell}>
      {/* ── Sidebar ── */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.brand}>
            <span style={styles.brandIcon}>⚖️</span>
            <span style={styles.brandName}>ViaUnion</span>
          </div>

          <div style={styles.portalBadge}>{title}</div>

          <nav style={styles.nav}>
            {navItems.map((item) => (
              <button
                key={item.id}
                style={{
                  ...styles.navItem,
                  ...(activeTab === item.id ? styles.navItemActive : {}),
                }}
                onClick={() => setActiveTab(item.id)}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={styles.sidebarBottom}>
          <div style={styles.userCard}>
            <div style={{ ...styles.userAvatar, ...roleBadgeStyle(user) }}>
              {(user?.name || user?.email || "?")[0].toUpperCase()}
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user?.name || user?.email}</div>
              <span style={{ ...styles.userRole, ...roleBadgeStyle(user) }}>
                {roleLabel(user)}
              </span>
            </div>
          </div>
          <button style={styles.logoutBtn} onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={styles.main}>
        <div style={styles.contentWrap}>

          {/* Cases */}
          {activeTab === "cases" && (
            <RoleGate user={user} permission="canViewCases">
              <Section id="cases" />
            </RoleGate>
          )}

          {/* Approvals — admin only */}
          {activeTab === "approvals" && (
            <RoleGate user={user} permission="canViewApprovalPanel"
              fallback={<Forbidden />}>
              <Section id="approvals" />
            </RoleGate>
          )}

          {/* Q&A moderation — admin only */}
          {activeTab === "qa" && (
            <RoleGate user={user} permission="canViewQAModeration"
              fallback={<Forbidden />}>
              <Section id="qa" />
            </RoleGate>
          )}

          {/* Resources */}
          {activeTab === "resources" && (
            <RoleGate user={user} permission="canViewResources">
              <Section id="resources" />
            </RoleGate>
          )}

          {/* Internal Files */}
          {activeTab === "files" && (
            <RoleGate user={user} permission="canViewInternalFiles">
              <div>
                <Section id="files" />
                {/* Grievance tracker upload — stewards + admins only */}
                <RoleGate user={user} permission="canUploadGrievanceTracker">
                  <Section id="grievanceUpload" />
                </RoleGate>
              </div>
            </RoleGate>
          )}

          {/* Stats */}
          {activeTab === "stats" && (
            <RoleGate user={user} permission="canViewStats">
              <Section id="stats" />
            </RoleGate>
          )}

          {/* Wages form — all roles */}
          {activeTab === "wages" && (
            <Section id="wages" />
          )}

          {/* Role management — admin only */}
          {activeTab === "roles" && (
            <RoleGate user={user} permission="canManageRoles"
              fallback={<Forbidden />}>
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Role Management</h2>
                <RoleManager
                  currentUser={user}
                  users={users}
                  onRoleChange={onRoleChange}
                />
              </div>
            </RoleGate>
          )}

        </div>
      </main>
    </div>
  );
}

function Forbidden() {
  return (
    <div style={styles.forbidden}>
      <span style={{ fontSize: 40 }}>🔒</span>
      <p style={{ margin: "12px 0 4px", fontWeight: 600, color: "#374151" }}>
        Access restricted
      </p>
      <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>
        You don't have permission to view this section.
      </p>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  shell: {
    display: "flex",
    height: "100vh",
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    background: "#f9fafb",
  },
  sidebar: {
    width: 220,
    background: "#111827",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    flexShrink: 0,
  },
  sidebarTop: { padding: "24px 16px 0" },
  brand: { display: "flex", alignItems: "center", gap: 8, marginBottom: 20 },
  brandIcon: { fontSize: 22 },
  brandName: { fontSize: 16, fontWeight: 700, color: "#f9fafb", letterSpacing: "-0.01em" },
  portalBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 16,
    paddingLeft: 2,
  },
  nav: { display: "flex", flexDirection: "column", gap: 2 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    transition: "background 0.15s, color 0.15s",
  },
  navItemActive: {
    background: "#1f2937",
    color: "#f9fafb",
  },
  navIcon: { fontSize: 15, flexShrink: 0 },
  sidebarBottom: { padding: 16, borderTop: "1px solid #1f2937" },
  userCard: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  userInfo: { overflow: "hidden" },
  userName: { fontSize: 13, fontWeight: 600, color: "#f9fafb", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  userRole: { fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20 },
  logoutBtn: {
    width: "100%",
    padding: "8px",
    background: "#1f2937",
    border: "none",
    borderRadius: 8,
    color: "#9ca3af",
    fontSize: 13,
    cursor: "pointer",
  },
  main: { flex: 1, overflow: "auto" },
  contentWrap: { padding: "32px 40px", maxWidth: 1100, margin: "0 auto" },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 16 },
  placeholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    border: "2px dashed #e5e7eb",
    borderRadius: 12,
    padding: "60px 40px",
    textAlign: "center",
  },
  placeholderIcon: { fontSize: 32 },
  placeholderText: { color: "#6b7280", fontSize: 14, marginTop: 12 },
  forbidden: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "80px 40px",
    textAlign: "center",
  },
};
