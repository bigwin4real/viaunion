// ─────────────────────────────────────────────
//  ViaUnion · Role Definitions & Helper Functions
// ─────────────────────────────────────────────

export const ROLES = {
  ADMIN: "admin",
  STEWARD: "steward",
  COMMITTEE: "committee",
};

/**
 * Returns the user's role string from a user object.
 * Supports { role } or { roles: [] } shapes.
 */
export function getUserRole(user) {
  if (!user) return null;
  if (user.role) return user.role;
  if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles[0];
  return null;
}

export function isAdmin(user) {
  return getUserRole(user) === ROLES.ADMIN;
}

export function isSteward(user) {
  return getUserRole(user) === ROLES.STEWARD;
}

export function isCommittee(user) {
  return getUserRole(user) === ROLES.COMMITTEE;
}

export function isAdminOrSteward(user) {
  return isAdmin(user) || isSteward(user);
}

/**
 * Returns the portal title for a given user.
 */
export function getPortalTitle(user) {
  if (isAdmin(user)) return "Admin Portal";
  if (isSteward(user)) return "Steward Portal";
  if (isCommittee(user)) return "Committee Forms";
  return "Member Portal";
}

/**
 * Returns the set of features a user can access.
 * Use this as a single source of truth for all
 * conditional rendering decisions.
 */
export function getPermissions(user) {
  return {
    // Case management
    canViewCases: isAdminOrSteward(user),
    canManageAllCases: isAdmin(user),

    // Approvals
    canViewApprovalPanel: isAdmin(user),
    canApproveAccounts: isAdmin(user),

    // Q&A moderation
    canViewQAModeration: isAdmin(user),
    canDeleteQuestions: isAdmin(user),

    // Resources
    canViewResources: isAdminOrSteward(user),
    canViewAdminResources: isAdmin(user),

    // Internal files
    canViewInternalFiles: isAdminOrSteward(user),
    canViewGrievanceTracker: isAdminOrSteward(user),
    canUploadGrievanceTracker: isSteward(user) || isAdmin(user),

    // Stats
    canViewStats: isAdminOrSteward(user),

    // Forms
    canViewWagesForm: true, // all roles

    // Role management
    canManageRoles: isAdmin(user),
  };
}
