import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { photocardsTable, userPhotocardsTable } from '../db/schema';
import { removeFromCollection } from '../handlers/remove_from_collection';
import { eq, and } from 'drizzle-orm';

describe('removeFromCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove photocard from user collection', async () => {
    // Create test photocard first
    const photocardResult = await db.insert(photocardsTable)
      .values({
        filename: 'test_card.jpg',
        image_url: 'https://example.com/test.jpg',
        category: 'ALBUMS',
        release_type: 'ALBUM',
        release_structure: 'TOWER_RECORDS',
        album_name: 'Test Album',
        store: 'Tower Records',
        version: 'STANDARD',
        member: 'JURIN'
      })
      .returning()
      .execute();

    const photocardId = photocardResult[0].id;

    // Add photocard to user collection
    const userPhotocardResult = await db.insert(userPhotocardsTable)
      .values({
        user_id: 'test-user-123',
        photocard_id: photocardId,
        user_image_url: 'https://example.com/user-card.jpg',
        condition: 'MINT',
        notes: 'My favorite card'
      })
      .returning()
      .execute();

    const userPhotocardId = userPhotocardResult[0].id;

    // Remove the photocard from collection
    const result = await removeFromCollection(userPhotocardId, 'test-user-123');

    expect(result).toBe(true);

    // Verify photocard was removed from collection
    const userPhotocards = await db.select()
      .from(userPhotocardsTable)
      .where(eq(userPhotocardsTable.id, userPhotocardId))
      .execute();

    expect(userPhotocards).toHaveLength(0);
  });

  it('should return false for non-existent photocard', async () => {
    const result = await removeFromCollection(99999, 'test-user-123');

    expect(result).toBe(false);
  });

  it('should return false when user tries to remove another user\'s photocard', async () => {
    // Create test photocard first
    const photocardResult = await db.insert(photocardsTable)
      .values({
        filename: 'test_card.jpg',
        image_url: 'https://example.com/test.jpg',
        category: 'ALBUMS',
        release_type: 'ALBUM',
        release_structure: 'TOWER_RECORDS',
        album_name: 'Test Album',
        store: 'Tower Records',
        version: 'STANDARD',
        member: 'JURIN'
      })
      .returning()
      .execute();

    const photocardId = photocardResult[0].id;

    // Add photocard to user1's collection
    const userPhotocardResult = await db.insert(userPhotocardsTable)
      .values({
        user_id: 'user1',
        photocard_id: photocardId,
        user_image_url: 'https://example.com/user-card.jpg',
        condition: 'MINT'
      })
      .returning()
      .execute();

    const userPhotocardId = userPhotocardResult[0].id;

    // Try to remove with different user_id (user2)
    const result = await removeFromCollection(userPhotocardId, 'user2');

    expect(result).toBe(false);

    // Verify photocard still exists in user1's collection
    const userPhotocards = await db.select()
      .from(userPhotocardsTable)
      .where(
        and(
          eq(userPhotocardsTable.id, userPhotocardId),
          eq(userPhotocardsTable.user_id, 'user1')
        )
      )
      .execute();

    expect(userPhotocards).toHaveLength(1);
  });

  it('should not affect master photocard when removing from user collection', async () => {
    // Create test photocard first
    const photocardResult = await db.insert(photocardsTable)
      .values({
        filename: 'test_card.jpg',
        image_url: 'https://example.com/test.jpg',
        category: 'ALBUMS',
        release_type: 'ALBUM',
        release_structure: 'TOWER_RECORDS',
        album_name: 'Test Album',
        store: 'Tower Records',
        version: 'STANDARD',
        member: 'JURIN'
      })
      .returning()
      .execute();

    const photocardId = photocardResult[0].id;

    // Add photocard to user collection
    const userPhotocardResult = await db.insert(userPhotocardsTable)
      .values({
        user_id: 'test-user-123',
        photocard_id: photocardId,
        user_image_url: 'https://example.com/user-card.jpg',
        condition: 'MINT'
      })
      .returning()
      .execute();

    const userPhotocardId = userPhotocardResult[0].id;

    // Remove the photocard from collection
    await removeFromCollection(userPhotocardId, 'test-user-123');

    // Verify master photocard still exists
    const masterPhotocards = await db.select()
      .from(photocardsTable)
      .where(eq(photocardsTable.id, photocardId))
      .execute();

    expect(masterPhotocards).toHaveLength(1);
    expect(masterPhotocards[0].filename).toBe('test_card.jpg');
  });

  it('should handle multiple users having the same photocard', async () => {
    // Create test photocard first
    const photocardResult = await db.insert(photocardsTable)
      .values({
        filename: 'test_card.jpg',
        image_url: 'https://example.com/test.jpg',
        category: 'ALBUMS',
        release_type: 'ALBUM',
        release_structure: 'TOWER_RECORDS',
        album_name: 'Test Album',
        store: 'Tower Records',
        version: 'STANDARD',
        member: 'JURIN'
      })
      .returning()
      .execute();

    const photocardId = photocardResult[0].id;

    // Add photocard to user1's collection
    const user1Result = await db.insert(userPhotocardsTable)
      .values({
        user_id: 'user1',
        photocard_id: photocardId,
        user_image_url: 'https://example.com/user1-card.jpg',
        condition: 'MINT'
      })
      .returning()
      .execute();

    // Add same photocard to user2's collection
    const user2Result = await db.insert(userPhotocardsTable)
      .values({
        user_id: 'user2',
        photocard_id: photocardId,
        user_image_url: 'https://example.com/user2-card.jpg',
        condition: 'GOOD'
      })
      .returning()
      .execute();

    const user1PhotocardId = user1Result[0].id;
    const user2PhotocardId = user2Result[0].id;

    // Remove photocard from user1's collection
    const result = await removeFromCollection(user1PhotocardId, 'user1');

    expect(result).toBe(true);

    // Verify only user1's photocard was removed
    const user1Photocards = await db.select()
      .from(userPhotocardsTable)
      .where(eq(userPhotocardsTable.id, user1PhotocardId))
      .execute();

    expect(user1Photocards).toHaveLength(0);

    // Verify user2's photocard still exists
    const user2Photocards = await db.select()
      .from(userPhotocardsTable)
      .where(eq(userPhotocardsTable.id, user2PhotocardId))
      .execute();

    expect(user2Photocards).toHaveLength(1);
    expect(user2Photocards[0].user_id).toBe('user2');
    expect(user2Photocards[0].condition).toBe('GOOD');
  });
});