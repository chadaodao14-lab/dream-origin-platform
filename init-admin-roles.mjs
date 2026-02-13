/**
 * Initialize Admin Roles and Permissions
 * Creates predefined roles and permissions for the multi-level admin system
 */

import { getDb } from "../server/db.js";
import { adminRoles, adminPermissions, rolePermissions } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

// Define all roles
const ROLES = [
  {
    code: "SUPER_ADMIN",
    name: "Super Administrator",
    level: 10,
    description: "Highest level admin with full system access",
    maxCount: 1,
  },
  {
    code: "FINANCE_ADMIN",
    name: "Finance Administrator",
    level: 8,
    description: "Manages financial operations, fund transfers, and reports",
    maxCount: 3,
  },
  {
    code: "RISK_ADMIN",
    name: "Risk Administrator",
    level: 7,
    description: "Manages risk assessment, monitoring, and security",
    maxCount: 2,
  },
  {
    code: "AUDIT_ADMIN",
    name: "Audit Administrator",
    level: 6,
    description: "Handles audit logs, compliance checks, and reporting",
    maxCount: 2,
  },
  {
    code: "CONTENT_ADMIN",
    name: "Content Administrator",
    level: 5,
    description: "Manages platform content, announcements, and help docs",
    maxCount: 3,
  },
  {
    code: "USER_ADMIN",
    name: "User Administrator",
    level: 4,
    description: "Manages user accounts, KYC verification, and complaints",
    maxCount: 5,
  },
];

// Define all permissions
const PERMISSIONS = [
  // System permissions
  { code: "system:config:read", name: "View System Config", category: "system" },
  { code: "system:config:write", name: "Modify System Config", category: "system" },
  { code: "system:role:manage", name: "Manage Roles and Permissions", category: "system" },
  { code: "system:admin:manage", name: "Manage Admin Accounts", category: "system" },
  { code: "system:backup:execute", name: "Execute Database Backup", category: "system" },

  // Finance permissions
  { code: "finance:fund:view", name: "View Fund Information", category: "finance" },
  { code: "finance:fund:transfer", name: "Execute Fund Transfer", category: "finance" },
  { code: "finance:commission:manage", name: "Manage Commission Distribution", category: "finance" },
  { code: "finance:report:view", name: "View Financial Reports", category: "finance" },
  { code: "finance:report:export", name: "Export Financial Reports", category: "finance" },
  { code: "finance:audit:trail", name: "View Financial Audit Trail", category: "finance" },

  // Risk permissions
  { code: "risk:monitor:view", name: "View Risk Monitoring", category: "risk" },
  { code: "risk:alert:manage", name: "Manage Risk Alerts", category: "risk" },
  { code: "risk:user:block", name: "Block/Unblock Users", category: "risk" },
  { code: "risk:transaction:review", name: "Review Suspicious Transactions", category: "risk" },
  { code: "risk:policy:manage", name: "Manage Risk Policies", category: "risk" },

  // Audit permissions
  { code: "audit:log:view", name: "View Audit Logs", category: "audit" },
  { code: "audit:log:export", name: "Export Audit Logs", category: "audit" },
  { code: "audit:report:generate", name: "Generate Audit Reports", category: "audit" },
  { code: "audit:compliance:check", name: "Execute Compliance Checks", category: "audit" },

  // Content permissions
  { code: "content:news:manage", name: "Manage News and Announcements", category: "content" },
  { code: "content:banner:manage", name: "Manage Banners", category: "content" },
  { code: "content:help:manage", name: "Manage Help Documentation", category: "content" },
  { code: "content:review:approve", name: "Review and Approve Content", category: "content" },

  // User permissions
  { code: "user:account:view", name: "View User Accounts", category: "user" },
  { code: "user:account:edit", name: "Edit User Information", category: "user" },
  { code: "user:account:disable", name: "Disable User Accounts", category: "user" },
  { code: "user:complaint:handle", name: "Handle User Complaints", category: "user" },
  { code: "user:kyc:verify", name: "Verify KYC Information", category: "user" },
];

// Define role-permission mappings
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    // All permissions
    ...PERMISSIONS.map((p) => p.code),
  ],
  FINANCE_ADMIN: [
    "finance:fund:view",
    "finance:fund:transfer",
    "finance:commission:manage",
    "finance:report:view",
    "finance:report:export",
    "finance:audit:trail",
    "audit:log:view",
  ],
  RISK_ADMIN: [
    "risk:monitor:view",
    "risk:alert:manage",
    "risk:user:block",
    "risk:transaction:review",
    "risk:policy:manage",
    "audit:log:view",
  ],
  AUDIT_ADMIN: [
    "audit:log:view",
    "audit:log:export",
    "audit:report:generate",
    "audit:compliance:check",
    "finance:audit:trail",
  ],
  CONTENT_ADMIN: [
    "content:news:manage",
    "content:banner:manage",
    "content:help:manage",
    "content:review:approve",
  ],
  USER_ADMIN: [
    "user:account:view",
    "user:account:edit",
    "user:account:disable",
    "user:complaint:handle",
    "user:kyc:verify",
    "audit:log:view",
  ],
};

async function initializeRolesAndPermissions() {
  try {
    console.log("🚀 Starting admin roles and permissions initialization...\n");

    const db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }

    // 1. Create roles
    console.log("📋 Creating admin roles...");
    const createdRoles = {};

    for (const role of ROLES) {
      const existing = await db
        .select()
        .from(adminRoles)
        .where(eq(adminRoles.code, role.code));

      if (existing.length > 0) {
        console.log(`  ⚠️  Role "${role.name}" already exists`);
        createdRoles[role.code] = existing[0].id;
      } else {
        const result = await db.insert(adminRoles).values({
          code: role.code,
          name: role.name,
          level: role.level,
          description: role.description,
          maxCount: role.maxCount,
          isActive: true,
        });

        createdRoles[role.code] = result[0].insertId;
        console.log(`  ✅ Role "${role.name}" created (ID: ${result[0].insertId})`);
      }
    }

    // 2. Create permissions
    console.log("\n🔐 Creating permissions...");
    const createdPermissions = {};

    for (const permission of PERMISSIONS) {
      const existing = await db
        .select()
        .from(adminPermissions)
        .where(eq(adminPermissions.code, permission.code));

      if (existing.length > 0) {
        console.log(`  ⚠️  Permission "${permission.name}" already exists`);
        createdPermissions[permission.code] = existing[0].id;
      } else {
        const result = await db.insert(adminPermissions).values({
          code: permission.code,
          name: permission.name,
          category: permission.category,
          isActive: true,
        });

        createdPermissions[permission.code] = result[0].insertId;
        console.log(`  ✅ Permission "${permission.name}" created (ID: ${result[0].insertId})`);
      }
    }

    // 3. Assign permissions to roles
    console.log("\n🔗 Assigning permissions to roles...");

    for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = createdRoles[roleCode];
      console.log(`\n  Role: ${roleCode}`);

      for (const permCode of permissionCodes) {
        const permId = createdPermissions[permCode];

        if (!permId) {
          console.log(`    ⚠️  Permission "${permCode}" not found`);
          continue;
        }

        const existing = await db
          .select()
          .from(rolePermissions)
          .where(
            eq(rolePermissions.roleId, roleId) && eq(rolePermissions.permissionId, permId)
          );

        if (existing.length === 0) {
          await db.insert(rolePermissions).values({
            roleId,
            permissionId: permId,
          });

          console.log(`    ✅ Permission "${permCode}" assigned`);
        }
      }
    }

    console.log("\n✨ Admin roles and permissions initialization completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  - Roles created: ${Object.keys(createdRoles).length}`);
    console.log(`  - Permissions created: ${Object.keys(createdPermissions).length}`);
    console.log(`  - Role-permission mappings: ${Object.values(ROLE_PERMISSIONS).reduce((sum, perms) => sum + perms.length, 0)}`);
  } catch (error) {
    console.error("❌ Error initializing roles and permissions:");
    console.error(error);
    process.exit(1);
  }
}

// Run initialization
initializeRolesAndPermissions().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
