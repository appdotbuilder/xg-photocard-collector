import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { photocardsTable, userPhotocardsTable } from '../db/schema';
import { type UpdateUserPhotocardInput } from '../schema';
import { updateUserPhotocard } from '../handlers/update_user_photocard';
import { eq, and } from 'drizzle-orm';

describe('updateUserPhotocard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPhotocardId: number;
  let testUserPhotocardId: number;

  beforeEach(async () => {
    // Create a test photocard first
    const photocardResult = await db.insert(photocardsTable)
      .values({
        filename: 'test_album_standard_jurin.jpg',
        image_url: 'https://example.com/test.jpg',
        category: 'ALBUMS',
        release_type: 'ALBUM',
        release_structure: 'ALBUM_CARD',
        album_name: 'Test Album',
        store: 'Test Store',
        version: 'STANDARD',
        member: 'JURIN'
      })
      .returning()
      .execute();

    testPhotocardId = photocardResult[0].id;

    // Create a test user photocard
    const userPhotocardResult = await db.insert(userPhotocardsTable)
      .values({
        user_id: 'test_user',
        photocard_id: testPhotocardId,
        user_image_url: 'https://example.com/user_image.jpg',
        condition: 'MINT',
        acquired_date: new Date('2023-01-01'),
        notes: 'Original notes'
      })
      .returning()
      .execute();

    testUserPhotocardId = userPhotocardResult[0].id;
  });

  it('should update user photocard condition', async () => {
    const input: UpdateUserPhotocardInput = {
      id: testUserPhotocardId,
      user_id: 'test_user',
      condition: 'NEAR_MINT'
    };

    const result = await updateUserPhotocard(input);

    expect(result.id).toEqual(testUserPhotocardId);
    expect(result.user_id).toEqual('test_user');
    expect(result.condition).toEqual('NEAR_MINT');
    expect(result.acquired_date).toBeInstanceOf(Date);
    expect(result.notes).toEqual('Original notes');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update acquired date', async () => {
    const newDate = new Date('2023-06-15');
    const input: UpdateUserPhotocardInput = {
      id: testUserPhotocardId,
      user_id: 'test_user',
      acquired_date: newDate
    };

    const result = await updateUserPhotocard(input);

    expect(result.acquired_date).toEqual(newDate);
    expect(result.condition).toEqual('MINT'); // Should preserve existing condition
    expect(result.notes).toEqual('Original notes'); // Should preserve existing notes
  });

  it('should update notes', async () => {
    const input: UpdateUserPhotocardInput = {
      id: testUserPhotocardId,
      user_id: 'test_user',
      notes: 'Updated notes about this photocard'
    };

    const result = await updateUserPhotocard(input);

    expect(result.notes).toEqual('Updated notes about this photocard');
    expect(result.condition).toEqual('MINT'); // Should preserve existing condition
    expect(result.acquired_date).toBeInstanceOf(Date); // Should preserve existing date
  });

  it('should update multiple fields at once', async () => {
    const newDate = new Date('2023-12-25');
    const input: UpdateUserPhotocardInput = {
      id: testUserPhotocardId,
      user_id: 'test_user',
      condition: 'GOOD',
      acquired_date: newDate,
      notes: 'Multiple updates applied'
    };

    const result = await updateUserPhotocard(input);

    expect(result.condition).toEqual('GOOD');
    expect(result.acquired_date).toEqual(newDate);
    expect(result.notes).toEqual('Multiple updates applied');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update acquired_date to null', async () => {
    const input: UpdateUserPhotocardInput = {
      id: testUserPhotocardId,
      user_id: 'test_user',
      acquired_date: null
    };

    const result = await updateUserPhotocard(input);

    expect(result.acquired_date).toBeNull();
    expect(result.condition).toEqual('MINT'); // Should preserve other fields
  });

  it('should update notes to null', async () => {
    const input: UpdateUserPhotocardInput = {
      id: testUserPhotocardId,
      user_id: 'test_user',
      notes: null
    };

    const result = await updateUserPhotocard(input);

    expect(result.notes).toBeNull();
    expect(result.condition).toEqual('MINT'); // Should preserve other fields
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalRecord = await db.select()
      .from(userPhotocardsTable)
      .where(eq(userPhotocardsTable.id, testUserPhotocardId))
      .execute();

    const originalUpdatedAt = originalRecord[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateUserPhotocardInput = {
      id: testUserPhotocardId,
      user_id: 'test_user',
      condition: 'NEAR_MINT'
    };

    const result = await updateUserPhotocard(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should persist changes in database', async () => {
    const input: UpdateUserPhotocardInput = {
      id: testUserPhotocardId,
      user_id: 'test_user',
      condition: 'FAIR',
      notes: 'Database persistence test'
    };

    await updateUserPhotocard(input);

    // Verify changes are saved in database
    const savedRecord = await db.select()
      .from(userPhotocardsTable)
      .where(eq(userPhotocardsTable.id, testUserPhotocardId))
      .execute();

    expect(savedRecord).toHaveLength(1);
    expect(savedRecord[0].condition).toEqual('FAIR');
    expect(savedRecord[0].notes).toEqual('Database persistence test');
  });

  it('should throw error if record does not exist', async () => {
    const input: UpdateUserPhotocardInput = {
      id: 99999, // Non-existent ID
      user_id: 'test_user',
      condition: 'MINT'
    };

    expect(updateUserPhotocard(input)).rejects.toThrow(/not found or access denied/i);
  });

  it('should throw error if user does not own the record', async () => {
    const input: UpdateUserPhotocardInput = {
      id: testUserPhotocardId,
      user_id: 'different_user', // Different user ID
      condition: 'MINT'
    };

    expect(updateUserPhotocard(input)).rejects.toThrow(/not found or access denied/i);
  });

  it('should preserve non-updated fields', async () => {
    // Get original record
    const originalRecord = await db.select()
      .from(userPhotocardsTable)
      .where(eq(userPhotocardsTable.id, testUserPhotocardId))
      .execute();

    const input: UpdateUserPhotocardInput = {
      id: testUserPhotocardId,
      user_id: 'test_user',
      condition: 'POOR' // Only updating condition
    };

    const result = await updateUserPhotocard(input);

    // Should preserve all other fields
    expect(result.user_id).toEqual(originalRecord[0].user_id);
    expect(result.photocard_id).toEqual(originalRecord[0].photocard_id);
    expect(result.user_image_url).toEqual(originalRecord[0].user_image_url);
    expect(result.acquired_date).toEqual(originalRecord[0].acquired_date);
    expect(result.notes).toEqual(originalRecord[0].notes);
    expect(result.created_at).toEqual(originalRecord[0].created_at);
    
    // But should update the specified field and updated_at
    expect(result.condition).toEqual('POOR');
    expect(result.updated_at.getTime()).toBeGreaterThan(originalRecord[0].updated_at.getTime());
  });

  it('should handle all condition enum values', async () => {
    const conditions = ['MINT', 'NEAR_MINT', 'GOOD', 'FAIR', 'POOR'] as const;

    for (const condition of conditions) {
      const input: UpdateUserPhotocardInput = {
        id: testUserPhotocardId,
        user_id: 'test_user',
        condition: condition
      };

      const result = await updateUserPhotocard(input);
      expect(result.condition).toEqual(condition);
    }
  });
});