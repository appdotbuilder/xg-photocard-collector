import { serial, text, pgTable, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define PostgreSQL enums
export const releaseStructureEnum = pgEnum('release_structure', [
  'TOWER_RECORDS',
  'KTOWN4U', 
  'HMV',
  'ALADIN_RAKUTEN',
  'BROADCAST',
  'ALPHAZ_EXCLUSIVE',
  'LUCKY_DRAW',
  'SHOPS',
  'ALBUM_CARD',
  'UNIT_POB',
  'VIP_PHOTOCARD',
  'ANNUAL_MEMBERSHIP'
]);

export const releaseTypeEnum = pgEnum('release_type', [
  'ALBUM',
  'ANNIVERSARY', 
  'SHOWCASE',
  'KCON',
  'WEVERSE',
  'FANMEETING',
  'LUCKY_DRAW',
  'SEASON_GREETINGS',
  'PHOTOCARD',
  'POSTCARD'
]);

export const memberEnum = pgEnum('member', [
  'JURIN',
  'CHISA',
  'HINATA',
  'HARVEY',
  'JURIA',
  'MAYA',
  'COCONA'
]);

export const categoryEnum = pgEnum('category', [
  'ALBUMS',
  'EVENTS',
  'MERCH',
  'FANCLUB',
  'SEASON_GREETINGS',
  'SHOWCASE'
]);

export const versionEnum = pgEnum('version', [
  'STANDARD',
  'G_VER',
  'R1',
  'R2', 
  'R3',
  'ZERO',
  'USA'
]);

export const conditionEnum = pgEnum('condition', [
  'MINT',
  'NEAR_MINT',
  'GOOD',
  'FAIR',
  'POOR'
]);

// Master photocards table (catalog/market data)
export const photocardsTable = pgTable('photocards', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull().unique(),
  image_url: text('image_url').notNull(),
  category: categoryEnum('category').notNull(),
  release_type: releaseTypeEnum('release_type').notNull(),
  release_structure: releaseStructureEnum('release_structure').notNull(),
  album_name: text('album_name').notNull(),
  store: text('store'), // Nullable - some cards may not have specific store
  version: versionEnum('version').notNull(),
  member: memberEnum('member').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// User photocards collection table
export const userPhotocardsTable = pgTable('user_photocards', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(), // Simple string-based user identification
  photocard_id: integer('photocard_id').notNull().references(() => photocardsTable.id),
  user_image_url: text('user_image_url').notNull(), // User's uploaded image
  condition: conditionEnum('condition').notNull().default('MINT'),
  acquired_date: timestamp('acquired_date'), // Nullable - user may not know when they got it
  notes: text('notes'), // Nullable - optional user notes
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const photocardsRelations = relations(photocardsTable, ({ many }) => ({
  userPhotocards: many(userPhotocardsTable)
}));

export const userPhotocardsRelations = relations(userPhotocardsTable, ({ one }) => ({
  photocard: one(photocardsTable, {
    fields: [userPhotocardsTable.photocard_id],
    references: [photocardsTable.id]
  })
}));

// TypeScript types for the table schemas
export type Photocard = typeof photocardsTable.$inferSelect;
export type NewPhotocard = typeof photocardsTable.$inferInsert;
export type UserPhotocard = typeof userPhotocardsTable.$inferSelect;
export type NewUserPhotocard = typeof userPhotocardsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  photocards: photocardsTable,
  userPhotocards: userPhotocardsTable
};

export const tableRelations = {
  photocardsRelations,
  userPhotocardsRelations
};