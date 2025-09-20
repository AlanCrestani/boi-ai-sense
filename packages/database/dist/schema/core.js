import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
// Enums - correspondem aos tipos customizados do banco real
export const appRoleEnum = pgEnum('app_role', ['owner', 'admin', 'manager', 'employee', 'viewer']);
export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'expired', 'cancelled']);
// Organizations - tabela de organizações/fazendas
export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    domain: text('domain'),
    logoUrl: text('logo_url'),
    subscriptionStatus: text('subscription_status').default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
// Profiles - perfis de usuários
export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().unique(), // FK para auth.users
    organizationId: uuid('organization_id').notNull(),
    fullName: text('full_name').notNull(),
    email: text('email').notNull(),
    avatarUrl: text('avatar_url'),
    phone: text('phone'),
    position: text('position'),
    department: text('department'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
// User Roles - permissões de usuários
export const userRoles = pgTable('user_roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(), // FK para auth.users
    organizationId: uuid('organization_id').notNull(),
    role: appRoleEnum('role').notNull().default('employee'),
    grantedBy: uuid('granted_by'), // FK para auth.users
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
});
// Invitations - sistema de convites
export const invitations = pgTable('invitations', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    email: text('email').notNull(),
    role: appRoleEnum('role').notNull().default('employee'),
    invitedBy: uuid('invited_by').notNull(), // FK para auth.users
    invitationToken: text('invitation_token').notNull().unique(),
    status: invitationStatusEnum('status').default('pending'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
    profiles: many(profiles),
    userRoles: many(userRoles),
    invitations: many(invitations),
}));
export const profilesRelations = relations(profiles, ({ one }) => ({
    organization: one(organizations, {
        fields: [profiles.organizationId],
        references: [organizations.id],
    }),
}));
export const userRolesRelations = relations(userRoles, ({ one }) => ({
    organization: one(organizations, {
        fields: [userRoles.organizationId],
        references: [organizations.id],
    }),
}));
export const invitationsRelations = relations(invitations, ({ one }) => ({
    organization: one(organizations, {
        fields: [invitations.organizationId],
        references: [organizations.id],
    }),
}));
// Zod schemas para validação
export const insertOrganizationsSchema = createInsertSchema(organizations);
export const selectOrganizationsSchema = createSelectSchema(organizations);
export const insertProfilesSchema = createInsertSchema(profiles);
export const selectProfilesSchema = createSelectSchema(profiles);
export const insertUserRolesSchema = createInsertSchema(userRoles);
export const selectUserRolesSchema = createSelectSchema(userRoles);
export const insertInvitationsSchema = createInsertSchema(invitations);
export const selectInvitationsSchema = createSelectSchema(invitations);
//# sourceMappingURL=core.js.map