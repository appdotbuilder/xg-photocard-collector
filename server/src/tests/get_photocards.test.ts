import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { photocardsTable } from '../db/schema';
import { type CreatePhotocardInput, type PhotocardFilter } from '../schema';
import { getPhotocards } from '../handlers/get_photocards';

// Test photocard data
const testPhotocards: CreatePhotocardInput[] = [
  {
    filename: 'albums_xg_tape1_standard_jurin.jpg',
    image_url: 'https://example.com/jurin-tape1.jpg',
    category: 'ALBUMS',
    release_type: 'ALBUM',
    release_structure: 'ALBUM_CARD',
    album_name: 'TAPE #1',
    store: null,
    version: 'STANDARD',
    member: 'JURIN'
  },
  {
    filename: 'albums_xg_tape1_standard_chisa.jpg',
    image_url: 'https://example.com/chisa-tape1.jpg',
    category: 'ALBUMS',
    release_type: 'ALBUM',
    release_structure: 'ALBUM_CARD',
    album_name: 'TAPE #1',
    store: null,
    version: 'STANDARD',
    member: 'CHISA'
  },
  {
    filename: 'events_xg_showcase_ktown4u_hinata.jpg',
    image_url: 'https://example.com/hinata-showcase.jpg',
    category: 'EVENTS',
    release_type: 'SHOWCASE',
    release_structure: 'KTOWN4U',
    album_name: 'XG SHOWCASE',
    store: 'KTOWN4U',
    version: 'STANDARD',
    member: 'HINATA'
  },
  {
    filename: 'merch_xg_fanmeeting_tower_harvey.jpg',
    image_url: 'https://example.com/harvey-fanmeeting.jpg',
    category: 'MERCH',
    release_type: 'FANMEETING',
    release_structure: 'TOWER_RECORDS',
    album_name: 'XG FANMEETING 2024',
    store: 'Tower Records',
    version: 'STANDARD',
    member: 'HARVEY'
  }
];

describe('getPhotocards', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestPhotocards = async () => {
    for (const photocard of testPhotocards) {
      await db.insert(photocardsTable).values(photocard).execute();
    }
  };

  it('should return all photocards when no filter is provided', async () => {
    await createTestPhotocards();

    const result = await getPhotocards();

    expect(result).toHaveLength(4);
    expect(result.every(pc => pc.id !== undefined)).toBe(true);
    expect(result.every(pc => pc.created_at instanceof Date)).toBe(true);
    expect(result.every(pc => pc.updated_at instanceof Date)).toBe(true);
  });

  it('should return empty array when no photocards exist', async () => {
    const result = await getPhotocards();
    expect(result).toHaveLength(0);
  });

  it('should filter by category', async () => {
    await createTestPhotocards();

    const filter: PhotocardFilter = { category: 'ALBUMS' };
    const result = await getPhotocards(filter);

    expect(result).toHaveLength(2);
    expect(result.every(pc => pc.category === 'ALBUMS')).toBe(true);
    expect(result.map(pc => pc.member)).toEqual(expect.arrayContaining(['JURIN', 'CHISA']));
  });

  it('should filter by member', async () => {
    await createTestPhotocards();

    const filter: PhotocardFilter = { member: 'HINATA' };
    const result = await getPhotocards(filter);

    expect(result).toHaveLength(1);
    expect(result[0].member).toBe('HINATA');
    expect(result[0].category).toBe('EVENTS');
  });

  it('should filter by release type', async () => {
    await createTestPhotocards();

    const filter: PhotocardFilter = { release_type: 'ALBUM' };
    const result = await getPhotocards(filter);

    expect(result).toHaveLength(2);
    expect(result.every(pc => pc.release_type === 'ALBUM')).toBe(true);
  });

  it('should filter by release structure', async () => {
    await createTestPhotocards();

    const filter: PhotocardFilter = { release_structure: 'KTOWN4U' };
    const result = await getPhotocards(filter);

    expect(result).toHaveLength(1);
    expect(result[0].release_structure).toBe('KTOWN4U');
    expect(result[0].member).toBe('HINATA');
  });

  it('should filter by album name (partial match)', async () => {
    await createTestPhotocards();

    const filter: PhotocardFilter = { album_name: 'TAPE' };
    const result = await getPhotocards(filter);

    expect(result).toHaveLength(2);
    expect(result.every(pc => pc.album_name.includes('TAPE'))).toBe(true);
  });

  it('should filter by album name (case insensitive)', async () => {
    await createTestPhotocards();

    const filter: PhotocardFilter = { album_name: 'tape' };
    const result = await getPhotocards(filter);

    expect(result).toHaveLength(2);
    expect(result.every(pc => pc.album_name.toUpperCase().includes('TAPE'))).toBe(true);
  });

  it('should filter by store (partial match)', async () => {
    await createTestPhotocards();

    const filter: PhotocardFilter = { store: 'Tower' };
    const result = await getPhotocards(filter);

    expect(result).toHaveLength(1);
    expect(result[0].store).toBe('Tower Records');
    expect(result[0].member).toBe('HARVEY');
  });

  it('should filter by store (case insensitive)', async () => {
    await createTestPhotocards();

    const filter: PhotocardFilter = { store: 'tower' };
    const result = await getPhotocards(filter);

    expect(result).toHaveLength(1);
    expect(result[0].store).toBe('Tower Records');
  });

  it('should filter by version', async () => {
    await createTestPhotocards();

    const filter: PhotocardFilter = { version: 'STANDARD' };
    const result = await getPhotocards(filter);

    expect(result).toHaveLength(4);
    expect(result.every(pc => pc.version === 'STANDARD')).toBe(true);
  });

  it('should apply multiple filters correctly (AND logic)', async () => {
    await createTestPhotocards();

    const filter: PhotocardFilter = {
      category: 'ALBUMS',
      member: 'JURIN'
    };
    const result = await getPhotocards(filter);

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('ALBUMS');
    expect(result[0].member).toBe('JURIN');
    expect(result[0].album_name).toBe('TAPE #1');
  });

  it('should return empty array when filters match no photocards', async () => {
    await createTestPhotocards();

    const filter: PhotocardFilter = {
      category: 'ALBUMS',
      member: 'HARVEY' // Harvey has MERCH category, not ALBUMS
    };
    const result = await getPhotocards(filter);

    expect(result).toHaveLength(0);
  });

  it('should handle complex multi-filter queries', async () => {
    await createTestPhotocards();

    const filter: PhotocardFilter = {
      category: 'EVENTS',
      release_type: 'SHOWCASE',
      store: 'KTOWN4U'
    };
    const result = await getPhotocards(filter);

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('EVENTS');
    expect(result[0].release_type).toBe('SHOWCASE');
    expect(result[0].store).toBe('KTOWN4U');
    expect(result[0].member).toBe('HINATA');
  });

  it('should return photocards with correct data structure', async () => {
    await createTestPhotocards();

    const result = await getPhotocards();
    const photocard = result[0];

    expect(photocard).toHaveProperty('id');
    expect(photocard).toHaveProperty('filename');
    expect(photocard).toHaveProperty('image_url');
    expect(photocard).toHaveProperty('category');
    expect(photocard).toHaveProperty('release_type');
    expect(photocard).toHaveProperty('release_structure');
    expect(photocard).toHaveProperty('album_name');
    expect(photocard).toHaveProperty('store');
    expect(photocard).toHaveProperty('version');
    expect(photocard).toHaveProperty('member');
    expect(photocard).toHaveProperty('created_at');
    expect(photocard).toHaveProperty('updated_at');

    expect(typeof photocard.id).toBe('number');
    expect(typeof photocard.filename).toBe('string');
    expect(typeof photocard.image_url).toBe('string');
    expect(photocard.created_at).toBeInstanceOf(Date);
    expect(photocard.updated_at).toBeInstanceOf(Date);
  });
});