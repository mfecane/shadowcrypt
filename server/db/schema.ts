import { relations, sql } from 'drizzle-orm'
import { boolean, doublePrecision, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const userRole = pgEnum('user_role', ['client', 'artist', 'admin', 'moderator'])

export type UserRole = (typeof userRole.enumValues)[number]

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name'),
	image: text('image'),
	roles: userRole('roles')
		.array()
		.notNull()
		.default(sql`ARRAY['client']::user_role[]`),
	emailVerified: timestamp('email_verified', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const userProfiles = pgTable('user_profiles', {
	userId: uuid('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const folders = pgTable('folders', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	archived: boolean('archived').notNull().default(false),
	lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const collections = pgTable('collections', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
	name: text('name').notNull(),
	pinned: boolean('pinned').notNull().default(false),
	archived: boolean('archived').notNull().default(false),
	lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
	/** World-space point at the viewport center (Pixi world container local space). */
	viewportCenterX: doublePrecision('viewport_center_x'),
	viewportCenterY: doublePrecision('viewport_center_y'),
	/** Uniform scale of the world container (same range as NavigationTool clamp). */
	viewportZoom: doublePrecision('viewport_zoom'),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const images = pgTable('images', {
	id: uuid('id').defaultRandom().primaryKey(),
	collectionId: uuid('collection_id')
		.notNull()
		.references(() => collections.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
	hash: text('hash').notNull(),
	width: integer('width'),
	height: integer('height'),
	layoutX: doublePrecision('layout_x'),
	layoutY: doublePrecision('layout_y'),
	layoutW: doublePrecision('layout_w'),
	layoutH: doublePrecision('layout_h'),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const emailLoginNonces = pgTable('email_login_nonces', {
	id: text('id').primaryKey(),
	email: text('email').notNull(),
	nonceHash: text('nonce_hash').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	consumedAt: timestamp('consumed_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
})

export const uploadStatus = pgEnum('upload_status', ['tmp', 'final'])

export const uploads = pgTable('uploads', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	objectKey: text('object_key').notNull(),
	status: uploadStatus('status').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

export const usersRelations = relations(users, ({ many, one }) => ({
	collections: many(collections),
	folders: many(folders),
	images: many(images),
	uploads: many(uploads),
	profile: one(userProfiles, {
		fields: [users.id],
		references: [userProfiles.userId],
	}),
}))

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
	user: one(users, {
		fields: [userProfiles.userId],
		references: [users.id],
	}),
}))

export const foldersRelations = relations(folders, ({ one, many }) => ({
	user: one(users, {
		fields: [folders.userId],
		references: [users.id],
	}),
	collections: many(collections),
}))

export const collectionsRelations = relations(collections, ({ one, many }) => ({
	user: one(users, {
		fields: [collections.userId],
		references: [users.id],
	}),
	folder: one(folders, {
		fields: [collections.folderId],
		references: [folders.id],
	}),
	images: many(images),
}))

export const imagesRelations = relations(images, ({ one }) => ({
	collection: one(collections, {
		fields: [images.collectionId],
		references: [collections.id],
	}),
	user: one(users, {
		fields: [images.userId],
		references: [users.id],
	}),
}))

export const uploadsRelations = relations(uploads, ({ one }) => ({
	user: one(users, {
		fields: [uploads.userId],
		references: [users.id],
	}),
}))
