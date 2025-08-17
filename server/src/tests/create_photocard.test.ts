import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { photocardsTable } from '../db/schema';
import { type CreatePhotocardInput } from '../schema';
import { createPhotocard } from '../handlers/create_photocard';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreatePhotocardInput = {
  filename: 'XG_SHOOTING_STAR_ALBUM_COCONA_KTOWN4U_POB_G_VER.jpg',
  image_url: 'https://example.com/photocard.jpg',
  category: 'ALBUMS',
  release_type: 'ALBUM',
  release_structure: 'KTOWN4U',
  album_name: 'SHOOTING STAR',
  store: 'KTOWN4U',
  version: 'G_VER',
  member: 'COCONA'
};

// Test input with nullable store field
const testInputNullStore: CreatePhotocardInput = {
  filename: 'XG_NEW_DNA_ALBUM_JURIN_BROADCAST_R1.jpg',
  image_url: 'https://example.com/photocard2.jpg',
  category: 'ALBUMS',
  release_type: 'ALBUM',
  release_structure: 'BROADCAST',
  album_name: 'NEW DNA',
  store: null,
  version: 'R1',
  member: 'JURIN'
};

describe('createPhotocard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a photocard with all fields', async () => {
    const result = await createPhotocard(testInput);

    // Validate all fields are correctly saved
    expect(result.filename).toEqual('XG_SHOOTING_STAR_ALBUM_COCONA_KTOWN4U_POB_G_VER.jpg');
    expect(result.image_url).toEqual('https://example.com/photocard.jpg');
    expect(result.category).toEqual('ALBUMS');
    expect(result.release_type).toEqual('ALBUM');
    expect(result.release_structure).toEqual('KTOWN4U');
    expect(result.album_name).toEqual('SHOOTING STAR');
    expect(result.store).toEqual('KTOWN4U');
    expect(result.version).toEqual('G_VER');
    expect(result.member).toEqual('COCONA');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a photocard with null store', async () => {
    const result = await createPhotocard(testInputNullStore);

    expect(result.filename).toEqual('XG_NEW_DNA_ALBUM_JURIN_BROADCAST_R1.jpg');
    expect(result.store).toBeNull();
    expect(result.release_structure).toEqual('BROADCAST');
    expect(result.member).toEqual('JURIN');
    expect(result.id).toBeDefined();
  });

  it('should save photocard to database', async () => {
    const result = await createPhotocard(testInput);

    // Query the database to verify the record was saved
    const photocards = await db.select()
      .from(photocardsTable)
      .where(eq(photocardsTable.id, result.id))
      .execute();

    expect(photocards).toHaveLength(1);
    expect(photocards[0].filename).toEqual('XG_SHOOTING_STAR_ALBUM_COCONA_KTOWN4U_POB_G_VER.jpg');
    expect(photocards[0].category).toEqual('ALBUMS');
    expect(photocards[0].member).toEqual('COCONA');
    expect(photocards[0].created_at).toBeInstanceOf(Date);
    expect(photocards[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple photocards with different members', async () => {
    const jurinInput: CreatePhotocardInput = {
      ...testInput,
      filename: 'XG_SHOOTING_STAR_ALBUM_JURIN_KTOWN4U_POB_G_VER.jpg',
      member: 'JURIN'
    };

    const mayaInput: CreatePhotocardInput = {
      ...testInput,
      filename: 'XG_SHOOTING_STAR_ALBUM_MAYA_KTOWN4U_POB_G_VER.jpg',
      member: 'MAYA'
    };

    const result1 = await createPhotocard(jurinInput);
    const result2 = await createPhotocard(mayaInput);

    expect(result1.member).toEqual('JURIN');
    expect(result2.member).toEqual('MAYA');
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should create photocards with different categories and release types', async () => {
    const eventInput: CreatePhotocardInput = {
      filename: 'XG_KCON_2024_SHOWCASE_CHISA_VIP_STANDARD.jpg',
      image_url: 'https://example.com/event.jpg',
      category: 'EVENTS',
      release_type: 'SHOWCASE',
      release_structure: 'VIP_PHOTOCARD',
      album_name: 'KCON 2024',
      store: null,
      version: 'STANDARD',
      member: 'CHISA'
    };

    const result = await createPhotocard(eventInput);

    expect(result.category).toEqual('EVENTS');
    expect(result.release_type).toEqual('SHOWCASE');
    expect(result.release_structure).toEqual('VIP_PHOTOCARD');
    expect(result.album_name).toEqual('KCON 2024');
    expect(result.member).toEqual('CHISA');
  });

  it('should enforce unique filename constraint', async () => {
    // Create first photocard
    await createPhotocard(testInput);

    // Try to create another with same filename
    await expect(createPhotocard(testInput)).rejects.toThrow(/duplicate key value/i);
  });

  it('should handle all enum values correctly', async () => {
    // Test different enum combinations
    const merchInput: CreatePhotocardInput = {
      filename: 'XG_SEASON_GREETINGS_2024_HARVEY_ALPHAZ_EXCLUSIVE_R2.jpg',
      image_url: 'https://example.com/merch.jpg',
      category: 'SEASON_GREETINGS',
      release_type: 'SEASON_GREETINGS',
      release_structure: 'ALPHAZ_EXCLUSIVE',
      album_name: 'Season Greetings 2024',
      store: 'Official Store',
      version: 'R2',
      member: 'HARVEY'
    };

    const result = await createPhotocard(merchInput);

    expect(result.category).toEqual('SEASON_GREETINGS');
    expect(result.release_type).toEqual('SEASON_GREETINGS');
    expect(result.release_structure).toEqual('ALPHAZ_EXCLUSIVE');
    expect(result.version).toEqual('R2');
    expect(result.member).toEqual('HARVEY');
  });
});