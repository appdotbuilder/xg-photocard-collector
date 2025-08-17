import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { photocardsTable, userPhotocardsTable } from '../db/schema';
import { getUserPhotocard } from '../handlers/get_user_photocard';

describe('getUserPhotocard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  const testPhotocard = {
    filename: 'test_photocard.jpg',
    image_url: 'https://example.com/test.jpg',
    category: 'ALBUMS' as const,
    release_type: 'ALBUM' as const,
    release_structure: 'TOWER_RECORDS' as const,
    album_name: 'Test Album',
    store: 'Tower Records',
    version: 'STANDARD' as const,
    member: 'JURIN' as const
  };

  const testUserPhotocard = {
    user_id: 'user123',
    user_image_url: 'https://example.com/user-image.jpg',
    condition: 'MINT' as const,
    acquired_date: new Date('2023-01-15'),
    notes: 'Great condition, no bends'
  };

  it('should return user photocard with embedded photocard details', async () => {
    // Create master photocard
    const [masterPhotocard] = await db.insert(photocardsTable)
      .values(testPhotocard)
      .returning()
      .execute();

    // Add to user collection
    const [userPhotocard] = await db.insert(userPhotocardsTable)
      .values({
        ...testUserPhotocard,
        photocard_id: masterPhotocard.id
      })
      .returning()
      .execute();

    // Test the handler
    const result = await getUserPhotocard(userPhotocard.id, 'user123');

    // Validate user collection data
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(userPhotocard.id);
    expect(result!.user_id).toEqual('user123');
    expect(result!.photocard_id).toEqual(masterPhotocard.id);
    expect(result!.user_image_url).toEqual('https://example.com/user-image.jpg');
    expect(result!.condition).toEqual('MINT');
    expect(result!.acquired_date).toEqual(new Date('2023-01-15'));
    expect(result!.notes).toEqual('Great condition, no bends');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Validate embedded photocard details
    expect(result!.photocard).toBeDefined();
    expect(result!.photocard.id).toEqual(masterPhotocard.id);
    expect(result!.photocard.filename).toEqual('test_photocard.jpg');
    expect(result!.photocard.image_url).toEqual('https://example.com/test.jpg');
    expect(result!.photocard.category).toEqual('ALBUMS');
    expect(result!.photocard.release_type).toEqual('ALBUM');
    expect(result!.photocard.release_structure).toEqual('TOWER_RECORDS');
    expect(result!.photocard.album_name).toEqual('Test Album');
    expect(result!.photocard.store).toEqual('Tower Records');
    expect(result!.photocard.version).toEqual('STANDARD');
    expect(result!.photocard.member).toEqual('JURIN');
    expect(result!.photocard.created_at).toBeInstanceOf(Date);
    expect(result!.photocard.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when photocard does not exist', async () => {
    const result = await getUserPhotocard(999, 'user123');
    expect(result).toBeNull();
  });

  it('should return null when photocard exists but belongs to different user', async () => {
    // Create master photocard
    const [masterPhotocard] = await db.insert(photocardsTable)
      .values(testPhotocard)
      .returning()
      .execute();

    // Add to user collection for different user
    const [userPhotocard] = await db.insert(userPhotocardsTable)
      .values({
        ...testUserPhotocard,
        user_id: 'different_user',
        photocard_id: masterPhotocard.id
      })
      .returning()
      .execute();

    // Try to access with wrong user_id
    const result = await getUserPhotocard(userPhotocard.id, 'user123');
    expect(result).toBeNull();
  });

  it('should handle null values correctly', async () => {
    // Create photocard with null store
    const photocardWithNulls = {
      ...testPhotocard,
      store: null
    };

    const [masterPhotocard] = await db.insert(photocardsTable)
      .values(photocardWithNulls)
      .returning()
      .execute();

    // Add to user collection with null values
    const userPhotocardWithNulls = {
      user_id: 'user123',
      photocard_id: masterPhotocard.id,
      user_image_url: 'https://example.com/user-image.jpg',
      condition: 'GOOD' as const,
      acquired_date: null,
      notes: null
    };

    const [userPhotocard] = await db.insert(userPhotocardsTable)
      .values(userPhotocardWithNulls)
      .returning()
      .execute();

    const result = await getUserPhotocard(userPhotocard.id, 'user123');

    expect(result).not.toBeNull();
    expect(result!.acquired_date).toBeNull();
    expect(result!.notes).toBeNull();
    expect(result!.photocard.store).toBeNull();
  });

  it('should enforce security by checking user ownership', async () => {
    // Create master photocard
    const [masterPhotocard] = await db.insert(photocardsTable)
      .values(testPhotocard)
      .returning()
      .execute();

    // Create collection entries for different users
    const [userPhotocard1] = await db.insert(userPhotocardsTable)
      .values({
        ...testUserPhotocard,
        user_id: 'user1',
        photocard_id: masterPhotocard.id
      })
      .returning()
      .execute();

    const [userPhotocard2] = await db.insert(userPhotocardsTable)
      .values({
        ...testUserPhotocard,
        user_id: 'user2',
        photocard_id: masterPhotocard.id
      })
      .returning()
      .execute();

    // Each user should only see their own collection entry
    const result1 = await getUserPhotocard(userPhotocard1.id, 'user1');
    const result2 = await getUserPhotocard(userPhotocard2.id, 'user2');

    expect(result1).not.toBeNull();
    expect(result1!.user_id).toEqual('user1');

    expect(result2).not.toBeNull();
    expect(result2!.user_id).toEqual('user2');

    // Cross-user access should return null
    const crossAccess1 = await getUserPhotocard(userPhotocard1.id, 'user2');
    const crossAccess2 = await getUserPhotocard(userPhotocard2.id, 'user1');

    expect(crossAccess1).toBeNull();
    expect(crossAccess2).toBeNull();
  });

  it('should handle different condition and member values', async () => {
    // Create photocard with different member
    const harveyPhotocard = {
      ...testPhotocard,
      member: 'HARVEY' as const,
      album_name: 'Harvey Special'
    };

    const [masterPhotocard] = await db.insert(photocardsTable)
      .values(harveyPhotocard)
      .returning()
      .execute();

    // Add with different condition
    const [userPhotocard] = await db.insert(userPhotocardsTable)
      .values({
        ...testUserPhotocard,
        photocard_id: masterPhotocard.id,
        condition: 'NEAR_MINT' as const
      })
      .returning()
      .execute();

    const result = await getUserPhotocard(userPhotocard.id, 'user123');

    expect(result).not.toBeNull();
    expect(result!.condition).toEqual('NEAR_MINT');
    expect(result!.photocard.member).toEqual('HARVEY');
    expect(result!.photocard.album_name).toEqual('Harvey Special');
  });
});