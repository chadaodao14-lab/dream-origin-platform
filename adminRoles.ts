/**
 * Admin roles and permissions management router
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getUserPermissions,
  getUserAdminRoles,
  hasPermission,
  assignRoleToUser,
  revokeRoleFromUser,
  createAdminRole,
  createPermission,
  assignPermissionToRole,
  revokePermissionFromRole,
  getAllRolesWithPermissions,
  enforcePermission,
  enforceAdmin,
  getUserPrivilegeLevel,
} from "../_core/permissions";
import { logger } from "../_core/logger";
import { ForbiddenError } from "../_core/errors";

export const adminRolesRouter = router({
  /**
   * Get current user's permissions
   */
  getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const permissions = await getUserPermissions(ctx.user.id);
      return {
        success: true,
        permissions,
      };
    } catch (error) {
      logger.error("Error getting user permissions", error as Error);
      throw error;
    }
  }),

  /**
   * Get current user's admin roles
   */
  getMyRoles: protectedProcedure.query(async ({ ctx }) => {
    try {
      const roles = await getUserAdminRoles(ctx.user.id);
      return {
        success: true,
        roles,
      };
    } catch (error) {
      logger.error("Error getting user roles", error as Error);
      throw error;
    }
  }),

  /**
   * Get user's privilege level
   */
  getPrivilegeLevel: protectedProcedure.query(async ({ ctx }) => {
    try {
      const level = await getUserPrivilegeLevel(ctx.user.id);
      return {
        success: true,
        level,
      };
    } catch (error) {
      logger.error("Error getting privilege level", error as Error);
      throw error;
    }
  }),

  /**
   * Get all roles with their permissions
   */
  getAllRoles: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Check if user has permission to view roles
      await enforcePermission(ctx.user.id, "system:role:manage");

      const roles = await getAllRolesWithPermissions();
      return {
        success: true,
        roles,
      };
    } catch (error) {
      logger.error("Error getting all roles", error as Error);
      throw error;
    }
  }),

  /**
   * Assign role to user
   */
  assignRole: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        roleId: z.number().int().positive(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user has permission to manage roles
        await enforcePermission(ctx.user.id, "system:role:manage");

        // Check if target user privilege level is not higher than current user
        const targetUserLevel = await getUserPrivilegeLevel(input.userId);
        const currentUserLevel = await getUserPrivilegeLevel(ctx.user.id);

        if (targetUserLevel >= currentUserLevel) {
          throw new ForbiddenError(
            "Cannot assign roles to users with equal or higher privilege level"
          );
        }

        await assignRoleToUser(input.userId, input.roleId, ctx.user.id, input.expiresAt);

        logger.info("Role assigned to user", {
          adminId: ctx.user.id,
          userId: input.userId,
          roleId: input.roleId,
        });

        return {
          success: true,
          message: "Role assigned successfully",
        };
      } catch (error) {
        logger.error("Error assigning role", error as Error);
        throw error;
      }
    }),

  /**
   * Revoke role from user
   */
  revokeRole: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        roleId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user has permission to manage roles
        await enforcePermission(ctx.user.id, "system:role:manage");

        // Check if target user privilege level is not higher than current user
        const targetUserLevel = await getUserPrivilegeLevel(input.userId);
        const currentUserLevel = await getUserPrivilegeLevel(ctx.user.id);

        if (targetUserLevel >= currentUserLevel) {
          throw new ForbiddenError(
            "Cannot revoke roles from users with equal or higher privilege level"
          );
        }

        await revokeRoleFromUser(input.userId, input.roleId);

        logger.info("Role revoked from user", {
          adminId: ctx.user.id,
          userId: input.userId,
          roleId: input.roleId,
        });

        return {
          success: true,
          message: "Role revoked successfully",
        };
      } catch (error) {
        logger.error("Error revoking role", error as Error);
        throw error;
      }
    }),

  /**
   * Create new admin role
   */
  createRole: protectedProcedure
    .input(
      z.object({
        code: z.string().min(3).max(50),
        name: z.string().min(1).max(100),
        level: z.number().int().min(1).max(10),
        description: z.string().optional(),
        maxCount: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user has permission to manage roles
        await enforcePermission(ctx.user.id, "system:role:manage");

        // Check if current user has higher privilege level than the role being created
        const currentUserLevel = await getUserPrivilegeLevel(ctx.user.id);
        if (input.level >= currentUserLevel) {
          throw new ForbiddenError(
            "Cannot create roles with equal or higher privilege level than your own"
          );
        }

        await createAdminRole(input.code, input.name, input.level, input.description, input.maxCount);

        logger.info("Admin role created", {
          adminId: ctx.user.id,
          roleCode: input.code,
          roleLevel: input.level,
        });

        return {
          success: true,
          message: "Role created successfully",
        };
      } catch (error) {
        logger.error("Error creating role", error as Error);
        throw error;
      }
    }),

  /**
   * Create new permission
   */
  createPermission: protectedProcedure
    .input(
      z.object({
        code: z.string().min(3).max(100),
        name: z.string().min(1).max(100),
        category: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user has permission to manage permissions
        await enforcePermission(ctx.user.id, "system:role:manage");

        await createPermission(input.code, input.name, input.category, input.description);

        logger.info("Permission created", {
          adminId: ctx.user.id,
          permissionCode: input.code,
        });

        return {
          success: true,
          message: "Permission created successfully",
        };
      } catch (error) {
        logger.error("Error creating permission", error as Error);
        throw error;
      }
    }),

  /**
   * Assign permission to role
   */
  assignPermission: protectedProcedure
    .input(
      z.object({
        roleId: z.number().int().positive(),
        permissionId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user has permission to manage roles
        await enforcePermission(ctx.user.id, "system:role:manage");

        await assignPermissionToRole(input.roleId, input.permissionId);

        logger.info("Permission assigned to role", {
          adminId: ctx.user.id,
          roleId: input.roleId,
          permissionId: input.permissionId,
        });

        return {
          success: true,
          message: "Permission assigned successfully",
        };
      } catch (error) {
        logger.error("Error assigning permission", error as Error);
        throw error;
      }
    }),

  /**
   * Revoke permission from role
   */
  revokePermission: protectedProcedure
    .input(
      z.object({
        roleId: z.number().int().positive(),
        permissionId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user has permission to manage roles
        await enforcePermission(ctx.user.id, "system:role:manage");

        await revokePermissionFromRole(input.roleId, input.permissionId);

        logger.info("Permission revoked from role", {
          adminId: ctx.user.id,
          roleId: input.roleId,
          permissionId: input.permissionId,
        });

        return {
          success: true,
          message: "Permission revoked successfully",
        };
      } catch (error) {
        logger.error("Error revoking permission", error as Error);
        throw error;
      }
    }),

  /**
   * Check if user has specific permission
   */
  hasPermission: protectedProcedure
    .input(
      z.object({
        permission: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const has = await hasPermission(ctx.user.id, input.permission);
        return {
          success: true,
          hasPermission: has,
        };
      } catch (error) {
        logger.error("Error checking permission", error as Error);
        throw error;
      }
    }),
});
