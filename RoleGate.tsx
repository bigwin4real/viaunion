// ─────────────────────────────────────────────
//  ViaUnion · RoleGate
//  Wrap any section in <RoleGate> to show it
//  only when the user has the required permission.
// ─────────────────────────────────────────────
import React from "react";
import { getPermissions } from "./roleHelpers";

/**
 * <RoleGate user={user} permission="canViewApprovalPanel">
 *   <ApprovalPanel />
 * </RoleGate>
 *
 * If the user doesn't have the permission, renders null
 * (or the optional `fallback` prop).
 */
export default function RoleGate({ user, permission, fallback = null, children }) {
  const perms = getPermissions(user);

  if (!perms[permission]) return fallback;
  return <>{children}</>;
}
