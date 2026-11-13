import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * The tables the dashboard and the embedded form need.
 *
 * Column names follow the system design's data model. Every table that
 * holds partner data carries `partner_id`, because every query is scoped
 * by it - a partner can only ever reach their own rows.
 */

export const partners = sqliteTable('partners', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at').notNull(),
});

export const partnerUsers = sqliteTable(
  'partner_users',
  {
    id: text('id').primaryKey(),
    partnerId: text('partner_id')
      .notNull()
      .references(() => partners.id),
    email: text('email').notNull(),
    /* Only ever a bcrypt hash. The password itself is never stored. */
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull().default('editor'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [uniqueIndex('partner_users_email_idx').on(table.email)],
);

export const apiKeys = sqliteTable(
  'api_keys',
  {
    id: text('id').primaryKey(),
    partnerId: text('partner_id')
      .notNull()
      .references(() => partners.id),
    /* Safe to put in a web page: it only allows reading a published config
       and submitting to that form. */
    publicKey: text('public_key').notNull(),
    /* The secret key is shown to the partner once, at creation, and only
       its hash is kept - so it can never be read back out of here. */
    secretKeyHash: text('secret_key_hash').notNull(),
    status: text('status').notNull().default('active'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [uniqueIndex('api_keys_public_key_idx').on(table.publicKey)],
);

export const formTemplates = sqliteTable('form_templates', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  defaultConfig: text('default_config', { mode: 'json' }).notNull(),
});

export const partnerForms = sqliteTable(
  'partner_forms',
  {
    id: text('id').primaryKey(),
    partnerId: text('partner_id')
      .notNull()
      .references(() => partners.id),
    type: text('type').notNull(),
    /* The editable configuration. Learners never see this. */
    draftConfig: text('draft_config', { mode: 'json' }).notNull(),
    currentVersion: integer('current_version'),
    status: text('status').notNull().default('draft'),
    updatedAt: text('updated_at'),
    publishedAt: text('published_at'),
  },
  (table) => [uniqueIndex('partner_forms_partner_type_idx').on(table.partnerId, table.type)],
);

/**
 * Published versions.
 *
 * Rows here are written once and never changed - that is what lets a
 * partner pin a version and trust it will keep working. The guarantee is
 * enforced in the database itself by triggers, not only in the route.
 */
export const formVersions = sqliteTable(
  'form_versions',
  {
    id: text('id').primaryKey(),
    partnerFormId: text('partner_form_id')
      .notNull()
      .references(() => partnerForms.id),
    version: integer('version').notNull(),
    config: text('config', { mode: 'json' }).notNull(),
    publishedAt: text('published_at').notNull(),
  },
  (table) => [uniqueIndex('form_versions_form_version_idx').on(table.partnerFormId, table.version)],
);
