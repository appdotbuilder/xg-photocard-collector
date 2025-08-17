import { z } from 'zod';

// Enums for photocard categorization
export const releaseStructureEnum = z.enum([
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

export const releaseTypeEnum = z.enum([
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

export const memberEnum = z.enum([
  'JURIN',
  'CHISA',
  'HINATA',
  'HARVEY',
  'JURIA',
  'MAYA',
  'COCONA'
]);

export const categoryEnum = z.enum([
  'ALBUMS',
  'EVENTS',
  'MERCH',
  'FANCLUB',
  'SEASON_GREETINGS',
  'SHOWCASE'
]);

export const versionEnum = z.enum([
  'STANDARD',
  'G_VER',
  'R1',
  'R2', 
  'R3',
  'ZERO',
  'USA'
]);

// Master photocard schema (for catalog/market view)
export const photocardSchema = z.object({
  id: z.number(),
  filename: z.string(),
  image_url: z.string(),
  category: categoryEnum,
  release_type: releaseTypeEnum,
  release_structure: releaseStructureEnum,
  album_name: z.string(),
  store: z.string().nullable(),
  version: versionEnum,
  member: memberEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Photocard = z.infer<typeof photocardSchema>;

// User collection schema
export const userPhotocardSchema = z.object({
  id: z.number(),
  user_id: z.string(), // Will be used for user identification
  photocard_id: z.number(),
  user_image_url: z.string(), // User's uploaded image
  condition: z.enum(['MINT', 'NEAR_MINT', 'GOOD', 'FAIR', 'POOR']).default('MINT'),
  acquired_date: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserPhotocard = z.infer<typeof userPhotocardSchema>;

// Input schemas for creating photocards
export const createPhotocardInputSchema = z.object({
  filename: z.string(),
  image_url: z.string(),
  category: categoryEnum,
  release_type: releaseTypeEnum,
  release_structure: releaseStructureEnum,
  album_name: z.string(),
  store: z.string().nullable(),
  version: versionEnum,
  member: memberEnum
});

export type CreatePhotocardInput = z.infer<typeof createPhotocardInputSchema>;

// Input schema for adding photocard to user collection
export const addToCollectionInputSchema = z.object({
  user_id: z.string(),
  photocard_id: z.number(),
  user_image_url: z.string(),
  condition: z.enum(['MINT', 'NEAR_MINT', 'GOOD', 'FAIR', 'POOR']).default('MINT'),
  acquired_date: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type AddToCollectionInput = z.infer<typeof addToCollectionInputSchema>;

// Schema for parsing filename and auto-filling photocard details
export const parseFilenameInputSchema = z.object({
  filename: z.string()
});

export type ParseFilenameInput = z.infer<typeof parseFilenameInputSchema>;

// Parsed filename result schema
export const parsedFilenameSchema = z.object({
  category: categoryEnum,
  release_type: releaseTypeEnum.optional(),
  album_name: z.string(),
  store: z.string().nullable(),
  version: versionEnum,
  member: memberEnum,
  release_structure: releaseStructureEnum.optional()
});

export type ParsedFilename = z.infer<typeof parsedFilenameSchema>;

// User collection with photocard details (for fetching collection)
export const userPhotocardWithDetailsSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  photocard_id: z.number(),
  user_image_url: z.string(),
  condition: z.enum(['MINT', 'NEAR_MINT', 'GOOD', 'FAIR', 'POOR']),
  acquired_date: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  // Embedded photocard details
  photocard: photocardSchema
});

export type UserPhotocardWithDetails = z.infer<typeof userPhotocardWithDetailsSchema>;

// Input schema for updating user photocard
export const updateUserPhotocardInputSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  condition: z.enum(['MINT', 'NEAR_MINT', 'GOOD', 'FAIR', 'POOR']).optional(),
  acquired_date: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateUserPhotocardInput = z.infer<typeof updateUserPhotocardInputSchema>;

// Filter schema for catalog search
export const photocardFilterSchema = z.object({
  category: categoryEnum.optional(),
  release_type: releaseTypeEnum.optional(),
  release_structure: releaseStructureEnum.optional(),
  member: memberEnum.optional(),
  album_name: z.string().optional(),
  store: z.string().optional(),
  version: versionEnum.optional()
});

export type PhotocardFilter = z.infer<typeof photocardFilterSchema>;