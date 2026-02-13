/**
 * Permission checking and authorization utilities
 */

import { getDb } from "../db";
import { userAdminRoles, rolePermissions, adminPermissions, adminRoles } from "../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { ForbiddenError, AuthError } from "./errors";
import { logger } from "./logger";

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    // Get user's admin roles
    const userRoles = await db
      .select({ roleId: userAdminRoles.roleId })
      .from(userAdminRoles)
      .where(
        and(
          eq(userAdminRoles.userId, userId),
          eq(userAdminRoles.isActive, true)
        )
      );

    if (userRoles.length === 0) {
      return [];
    }

    const roleIds = userRoles.map((r) => r.roleId);

    // Get permissions for these roles
    const permissions = await db
      .select({ code: adminPermissions.code })
      .from(rolePermissions)
      .innerJoin(
        adminPermissions,
        eq(rolePermissions.permissionId, adminPermissions.id)
      )
      .where(
        and(
          inArray(rolePermissions.roleId, roleIds),
          eq(adminPermissions.isActive, true)
        )
      );

    return permissions.map((p: any) => p.code);
  } catch (error) {
    logger.error("Error getting user permissions", error as Error);
    return [];
  }
}

/**
 * Get all roles for a user
 */
export async function getUserAdminRoles(userId: number) {
  try {
    const db = await getDb();
    if (!db) return [];

    const roles = await db
      .select({
        id: userAdminRoles.id,
        roleId: userAdminRoles.roleId,
        roleName: adminRoles.name,
        roleCode: adminRoles.code,
        roleLevel: adminRoles.level,
        assignedAt: userAdminRoles.assignedAt,
        expiresAt: userAdminRoles.expiresAt,
        isActive: userAdminRoles.isActive,
      })
      .from(userAdminRoles)
      .innerJoin(adminRoles, eq(userAdminRoles.roleId, adminRoles.id))
      .where(eq(userAdminRoles.userId, userId));

    return roles;
  } catch (error) {
    logger.error("Error getting user admin roles", error as Error);
    return [];
  }
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: number,
  requiredPermission: string
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    return permissions.includes(requiredPermission);
  } catch (error) {
    logger.error("Error checking permission", error as Error);
    return false;
  }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: number,
  requiredPermissions: string[]
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    return requiredPermissions.some((p) => permissions.includes(p));
  } catch (error) {
    logger.error("Error checking any permission", error as Error);
    return false;
  }
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  userId: number,
  requiredPermissions: string[]
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    return requiredPermissions.every((p) => permissions.includes(p));
  } catch (error) {
    logger.error("Error checking all permissions", error as Error);
    return false;
  }
}

/**
 * Get user's highest privilege level
 */
export async function getUserPrivilegeLevel(userId: number): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;

    const roles = await db
      .select({ level: adminRoles.level })
      .from(userAdminRoles)
      .innerJoin(adminRoles, eq(userAdminRoles.roleId, adminRoles.id))
      .where(
        and(
          eq(userAdminRoles.userId, userId),
          eq(userAdminRoles.isActive, true)
        )
      );

    if (roles.length === 0) {
      return 0;
    }

    return Math.max(...roles.map((r: any) => r.level));
  } catch (error) {
    logger.error("Error getting user privilege level", error as Error);
    return 0;
  }
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(
  userId: number,
  roleId: number,
  assignedBy: number,
  expiresAt?: Date
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Check if role already assigned
    const existing = await db
      .select()
      .from(userAdminRoles)
      .where(
        and(
          eq(userAdminRoles.userId, userId),
          eq(userAdminRoles.roleId, roleId)
        )
      );

    if (existing.length > 0) {
      throw new Error("Role already assigned to this user");
    }

    const result = await db.insert(userAdminRoles).values({
      userId,
      roleId,
      assignedBy,
      expiresAt,
      isActive: true,
    });

    logger.info("Role assigned to user", {
      userId,
      roleId,
      assignedBy,
    });

    return result;
  } catch (error) {
    logger.error("Error assigning role to user", error as Error);
    throw error;
  }
}

/**
 * Revoke a role from a user
 */
export async function revokeRoleFromUser(userId: number, roleId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .delete(userAdminRoles)
      .where(
        and(
          eq(userAdminRoles.userId, userId),
          eq(userAdminRoles.roleId, roleId)
        )
      );

    logger.info("Role revoked from user", {
      userId,
      roleId,
    });

    return result;
  } catch (error) {
    logger.error("Error revoking role from user", error as Error);
    throw error;
  }
}

/**
 * Create a new admin role
 */
export async function createAdminRole(
  code: string,
  name: string,
  level: number,
  description?: string,
  maxCount?: number
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(adminRoles).values({
      code,
      name,
      level,
      description,
      maxCount,
      isActive: true,
    });

    logger.info("Admin role created", {
      code,
      name,
      level,
    });

    return result;
  } catch (error) {
    logger.error("Error creating admin role", error as Error);
    throw error;
  }
}

/**
 * Create a new permission
 */
export async function createPermission(
  code: string,
  name: string,
  category?: string,
  description?: string
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(adminPermissions).values({
      code,
      name,
      category,
      description,
      isActive: true,
    });

    logger.info("Permission created", {
      code,
      name,
      category,
    });

    return result;
  } catch (error) {
    logger.error("Error creating permission", error as Error);
    throw error;
  }
}

/**
 * Assign permission to role
 */
export async function assignPermissionToRole(roleId: number, permissionId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Check if already assigned
    const existing = await db
      .select()
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        )
      );

    if (existing.length > 0) {
      throw new Error("Permission already assigned to this role");
    }

    const result = await db.insert(rolePermissions).values({
      roleId,
      permissionId,
    });

    logger.info("Permission assigned to role", {
      roleId,
      permissionId,
    });

    return result;
  } catch (error) {
    logger.error("Error assigning permission to role", error as Error);
    throw error;
  }
}

/**
 * Revoke permission from role
 */
export async function revokePermissionFromRole(roleId: number, permissionId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        )
      );

    logger.info("Permission revoked from role", {
      roleId,
      permissionId,
    });

    return result;
  } catch (error) {
    logger.error("Error revoking permission from role", error as Error);
    throw error;
  }
}

/**
 * Get all roles with their permissions
 */
export async function getAllRolesWithPermissions() {
  try {
    const db = await getDb();
    if (!db) return [];

    const roles: any = await db.select().from(adminRoles).where(eq(adminRoles.isActive, true));

    const rolesWithPermissions: any = await Promise.all(
      roles.map(async (role: any) => {
        const permissions = await db
          .select({ code: adminPermissions.code, name: adminPermissions.name })
          .from(rolePermissions)
          .innerJoin(
            adminPermissions,
            eq(rolePermissions.permissionId, adminPermissions.id)
          )
          .where(eq(rolePermissions.roleId, role.id));

        return {
          ...role,
          permissions: permissions.map((p: any) => p.code),
        };
      })
    ) as any;

    return rolesWithPermissions;
  } catch (error) {
    logger.error("Error getting all roles with permissions", error as Error);
    return [];
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const roles = await db
      .select()
      .from(userAdminRoles)
      .where(
        and(
          eq(userAdminRoles.userId, userId),
          eq(userAdminRoles.isActive, true)
        )
      );

    return roles.length > 0;
  } catch (error) {
    logger.error("Error checking if user is admin", error as Error);
    return false;
  }
}

/**
 * Enforce permission check (throws error if not authorized)
 */
export async function enforcePermission(userId: number, requiredPermission: string) {
  const hasPerms = await hasPermission(userId, requiredPermission);

  if (!hasPerms) {
    logger.warn("Permission denied", {
      userId,
      requiredPermission,
    });

    throw new ForbiddenError(
      `User does not have required permission: ${requiredPermission}`
    );
  }
}

/**
 * Enforce admin check (throws error if not admin)
 */
export async function enforceAdmin(userId: number) {
  const isAdmin = await isUserAdmin(userId);

  if (!isAdmin) {
    logger.warn("Admin access denied", {
      userId,
    });

    throw new ForbiddenError("User is not an admin");
  }
}
