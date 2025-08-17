import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { photocardsTable } from '../db/schema';
import { type CreatePhotocardInput } from '../schema';
import { bulkImportPhotocards } from '../handlers/bulk_import_photocards';
import { eq } from 'drizzle-orm';

// Test data for bulk import
const testPhotocards: CreatePhotocardInput[] = [
  {
    filename: 'ALBUMS_XTRAORDINARY_R1_JURIN_001.jpg',
    image_url: 'https://example.com/image1.jpg',
    category: 'ALBUMS',
    release_type: 'ALBUM',
    release_structure: 'ALBUM_CARD',
    album_name: 'XTRAORDINARY',
    store: null,
    version: 'R1',
    member: 'JURIN'
  },
  {
    filename: 'ALBUMS_NEW_DNA_R2_CHISA_002.jpg',
    image_url: 'https://example.com/image2.jpg',
    category: 'ALBUMS',
    release_type: 'ALBUM',
    release_structure: 'ALBUM_CARD',
    album_name: 'NEW DNA',
    store: null,
    version: 'R2',
    member: 'CHISA'
  },
  {
    filename: 'EVENTS_KCON_TOWER_HINATA_003.jpg',
    image_url: 'https://example.com/image3.jpg',
    category: 'EVENTS',
    release_type: 'KCON',
    release_structure: 'TOWER_RECORDS',
    album_name: 'KCON 2023',
    store: 'Tower Records',
    version: 'STANDARD',
    member: 'HINATA'
  }
];

describe('bulkImportPhotocards', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should import multiple photocards successfully', async () => {
    const result = await bulkImportPhotocards(testPhotocards);

    // Check return value
    expect(result).toHaveLength(3);
    expect(result[0].filename).toEqual('ALBUMS_XTRAORDINARY_R1_JURIN_001.jpg');
    expect(result[0].member).toEqual('JURIN');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify data was saved to database
    const savedPhotocards = await db.select()
      .from(photocardsTable)
      .execute();

    expect(savedPhotocards).toHaveLength(3);
    
    // Check specific saved data
    const jurinCard = savedPhotocards.find(p => p.member === 'JURIN');
    expect(jurinCard).toBeDefined();
    expect(jurinCard!.album_name).toEqual('XTRAORDINARY');
    expect(jurinCard!.version).toEqual('R1');
    expect(jurinCard!.category).toEqual('ALBUMS');
  });

  it('should handle empty input array', async () => {
    const result = await bulkImportPhotocards([]);

    expect(result).toHaveLength(0);
    
    const savedPhotocards = await db.select()
      .from(photocardsTable)
      .execute();

    expect(savedPhotocards).toHaveLength(0);
  });

  it('should skip duplicate filenames', async () => {
    // First import
    await bulkImportPhotocards([testPhotocards[0]]);

    // Second import with same filename
    const result = await bulkImportPhotocards([
      testPhotocards[0], // Duplicate
      testPhotocards[1]  // New
    ]);

    // Should only import the new one
    expect(result).toHaveLength(1);
    expect(result[0].filename).toEqual('ALBUMS_NEW_DNA_R2_CHISA_002.jpg');

    // Check total count in database
    const savedPhotocards = await db.select()
      .from(photocardsTable)
      .execute();

    expect(savedPhotocards).toHaveLength(2);
  });

  it('should handle mixed success and failure scenarios', async () => {
    // First, create a photocard to cause a duplicate
    await db.insert(photocardsTable)
      .values({
        filename: testPhotocards[0].filename,
        image_url: testPhotocards[0].image_url,
        category: testPhotocards[0].category,
        release_type: testPhotocards[0].release_type,
        release_structure: testPhotocards[0].release_structure,
        album_name: testPhotocards[0].album_name,
        store: testPhotocards[0].store,
        version: testPhotocards[0].version,
        member: testPhotocards[0].member
      })
      .execute();

    // Import with duplicates and new cards
    const result = await bulkImportPhotocards(testPhotocards);

    // Should skip the duplicate and import the rest
    expect(result).toHaveLength(2);
    expect(result.map(r => r.filename)).not.toContain(testPhotocards[0].filename);
    expect(result.map(r => r.filename)).toContain(testPhotocards[1].filename);
    expect(result.map(r => r.filename)).toContain(testPhotocards[2].filename);
  });

  it('should import photocards with nullable store field', async () => {
    const photocardWithNullStore: CreatePhotocardInput = {
      filename: 'TEST_ALBUM_STANDARD_MAYA_004.jpg',
      image_url: 'https://example.com/image4.jpg',
      category: 'ALBUMS',
      release_type: 'ALBUM',
      release_structure: 'ALBUM_CARD',
      album_name: 'Test Album',
      store: null,
      version: 'STANDARD',
      member: 'MAYA'
    };

    const result = await bulkImportPhotocards([photocardWithNullStore]);

    expect(result).toHaveLength(1);
    expect(result[0].store).toBeNull();

    const savedPhotocard = await db.select()
      .from(photocardsTable)
      .where(eq(photocardsTable.id, result[0].id))
      .execute();

    expect(savedPhotocard[0].store).toBeNull();
  });

  it('should process large batches correctly', async () => {
    // Create a larger set of test data
    const largeBatch: CreatePhotocardInput[] = [];
    for (let i = 0; i < 250; i++) {
      largeBatch.push({
        filename: `BATCH_TEST_${i.toString().padStart(3, '0')}.jpg`,
        image_url: `https://example.com/batch${i}.jpg`,
        category: 'ALBUMS',
        release_type: 'ALBUM',
        release_structure: 'ALBUM_CARD',
        album_name: 'Batch Test Album',
        store: null,
        version: 'STANDARD',
        member: i % 2 === 0 ? 'JURIN' : 'CHISA'
      });
    }

    const result = await bulkImportPhotocards(largeBatch);

    expect(result).toHaveLength(250);

    // Verify all were saved
    const savedPhotocards = await db.select()
      .from(photocardsTable)
      .execute();

    expect(savedPhotocards).toHaveLength(250);
  });

  it('should handle all enum values correctly', async () => {
    const enumTestPhotocards: CreatePhotocardInput[] = [
      {
        filename: 'SHOWCASE_ANNIVERSARY_TOWER_RECORDS_HARVEY.jpg',
        image_url: 'https://example.com/harvey.jpg',
        category: 'SHOWCASE',
        release_type: 'ANNIVERSARY',
        release_structure: 'TOWER_RECORDS',
        album_name: 'Anniversary Event',
        store: 'Tower Records',
        version: 'G_VER',
        member: 'HARVEY'
      },
      {
        filename: 'FANCLUB_WEVERSE_LUCKY_DRAW_COCONA.jpg',
        image_url: 'https://example.com/cocona.jpg',
        category: 'FANCLUB',
        release_type: 'WEVERSE',
        release_structure: 'LUCKY_DRAW',
        album_name: 'Fanclub Special',
        store: 'Weverse Shop',
        version: 'ZERO',
        member: 'COCONA'
      }
    ];

    const result = await bulkImportPhotocards(enumTestPhotocards);

    expect(result).toHaveLength(2);
    expect(result[0].category).toEqual('SHOWCASE');
    expect(result[0].release_type).toEqual('ANNIVERSARY');
    expect(result[0].release_structure).toEqual('TOWER_RECORDS');
    expect(result[0].version).toEqual('G_VER');
    expect(result[0].member).toEqual('HARVEY');

    expect(result[1].category).toEqual('FANCLUB');
    expect(result[1].release_type).toEqual('WEVERSE');
    expect(result[1].release_structure).toEqual('LUCKY_DRAW');
    expect(result[1].version).toEqual('ZERO');
    expect(result[1].member).toEqual('COCONA');
  });
});