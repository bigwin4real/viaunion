// ─────────────────────────────────────────────
//  ViaUnion · RoleManager
//  Admin-only panel to view and update user roles.
//  Props:
//    currentUser  – the logged-in user object
//    users        – array of all user objects
//    onRoleChange – async fn(userId, newRole) called on save
// ─────────────────────────────────────────────
import React, { useState } from "react";
import { ROLES, isAdmin } from "./roleHelpers";

const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.STEWARD]: "Shop Steward",
  [ROLES.COMMITTEE]: "Committee Member",
};

const ROLE_COLORS = {
  [ROLES.ADMIN]: { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" },
  [ROLES.STEWARD]: { bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd" },
  [ROLES.COMMITTEE]: { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
};

export default function RoleManager({ currentUser, users = [], onRoleChange }) {
  const [pendingChanges, setPendingChanges] = useState({});
  const [saving, setSaving] = useState({});
  const [search, setSearch] = useState("");

  if (!isAdmin(currentUser)) return null;

  const filtered = users.filter(
    (u) =>
      u.id !== currentUser.id &&
      (u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  function handleSelect(userId, newRole) {
    setPendingChanges((prev) => ({ ...prev, [userId]: newRole }));
  }

  async function handleSave(userId) {
    const newRole = pendingChanges[userId];
    if (!newRole) return;
    setSaving((prev) => ({ ...prev, [userId]: true }));
    try {
      await onRoleChange(userId, newRole);
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }));
    }
  }

  function handleCancel(userId) {
    setPendingChanges((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Manage User Roles</h2>
          <p style={styles.subtitle}>
            Changes take effect immediately on the user's next login.
          </p>
        </div>
        <input
          style={styles.search}
          placeholder="Search members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={styles.empty}>No members match your search.</div>
      ) : (
        <div style={styles.list}>
          {filtered.map((u) => {
            const currentRole = u.role || (u.roles && u.roles[0]) || ROLES.COMMITTEE;
            const selectedRole = pendingChanges[u.id] ?? currentRole;
            const isDirty = pendingChanges[u.id] && pendingChanges[u.id] !== currentRole;
            const colors = ROLE_COLORS[currentRole] || ROLE_COLORS[ROLES.COMMITTEE];

            return (
              <div key={u.id} style={styles.row}>
                {/* Avatar + identity */}
                <div style={styles.identity}>
                  <div style={{ ...styles.avatar, background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                    {(u.name || u.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={styles.name}>{u.name || "—"}</div>
                    <div style={styles.email}>{u.email}</div>
                  </div>
                </div>

                {/* Current role badge */}
                <div style={{ ...styles.badge, background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                  {ROLE_LABELS[currentRole] || currentRole}
                </div>

                {/* Role selector */}
                <select
                  style={styles.select}
                  value={selectedRole}
                  onChange={(e) => handleSelect(u.id, e.target.value)}
                >
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>

                {/* Actions */}
                <div style={styles.actions}>
                  {isDirty ? (
                    <>
                      <button
                        style={styles.saveBtn}
                        onClick={() => handleSave(u.id)}
                        disabled={saving[u.id]}
                      >
                        {saving[u.id] ? "Saving…" : "Save"}
                      </button>
                      <button
                        style={styles.cancelBtn}
                        onClick={() => handleCancel(u.id)}
                        disabled={saving[u.id]}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <span style={styles.noChange}>No changes</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px",
    borderBottom: "1px solid #f3f4f6",
    gap: 16,
    flexWrap: "wrap",
  },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "#6b7280" },
  search: {
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    minWidth: 200,
  },
  list: { display: "flex", flexDirection: "column" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 24px",
    borderBottom: "1px solid #f9fafb",
    flexWrap: "wrap",
  },
  identity: { display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 180 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0,
  },
  name: { fontSize: 14, fontWeight: 600, color: "#111827" },
  email: { fontSize: 12, color: "#9ca3af" },
  badge: {
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  select: {
    padding: "7px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
    background: "#fff",
    outline: "none",
  },
  actions: { display: "flex", gap: 8, alignItems: "center", minWidth: 130 },
  saveBtn: {
    padding: "6px 14px",
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "6px 14px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    cursor: "pointer",
  },
  noChange: { fontSize: 13, color: "#9ca3af" },
  empty: { padding: "40px 24px", textAlign: "center", color: "#9ca3af", fontSize: 14 },
};
