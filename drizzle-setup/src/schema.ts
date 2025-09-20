import { pgTable, uuid, text, timestamp, boolean, pgSchema } from "drizzle-orm/pg-core";

// Define auth schema
export const authSchema = pgSchema("auth");

// Reference to Supabase auth.users table
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  created_at: timestamp('created_at', { withTimezone: true }),
});

// Custom profiles table in public schema that extends auth.users
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().unique(), // FK to auth.users
  fullName: text('full_name'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});