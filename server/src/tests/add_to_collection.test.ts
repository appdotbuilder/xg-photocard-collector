import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { photocardsTable, userPhotocardsTable } from '../db/schema';
import { type AddToCollectionInput } from '../schema';
import { addToCollection } from '../handlers/add_to_collection';
import { eq, and } from 'drizzle-orm';

describe('addToCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test photocard in the master catalog
  const createTestPhotocard = async () => {
    const result = await db.insert(photocardsTable)
      .values({
        filename: 'test-photocard.jpg',
        image_url: 'https://example.com/catalog/test-photocard.jpg',
        category: 'ALBUMS',
        release_type: 'ALBUM',
        release_structure: 'ALBUM_CARD',
        album_name: 'Test Album',
        store: 'TOWER_RECORDS',
        version: 'STANDARD',
        member: 'JURIN'
      })
      .returning()
      .execute();
    return result[0];
  };

  const testInput: AddToCollectionInput = {
    user_id: 'test-user-123',
    photocard_id: 1, // Will be updated in tests
    user_image_url: 'https://example.com/user/my-photocard.jpg',
    condition: 'MINT',
    acquired_date: new Date('2024-01-15'),
    notes: 'Got this at a local shop'
  };

  it('should add photocard to user collection', async () => {
    // Create master photocard first
    const masterPhotocard = await createTestPhotocard();
    
    const input = {
      ...testInput,
      photocard_id: masterPhotocard.id
    };

    const result = await addToCollection(input);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual('test-user-123');
    expect(result.photocard_id).toEqual(masterPhotocard.id);
    expect(result.user_image_url).toEqual('https://example.com/user/my-photocard.jpg');
    expect(result.condition).toEqual('MINT');
    expect(result.acquired_date).toEqual(new Date('2024-01-15'));
    expect(result.notes).toEqual('Got this at a local shop');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save to database correctly', async () => {
    const masterPhotocard = await createTestPhotocard();
    
    const input = {
      ...testInput,
      photocard_id: masterPhotocard.id
    };

    const result = await addToCollection(input);

    // Verify it was saved to database
    const savedUserPhotocards = await db.select()
      .from(userPhotocardsTable)
      .where(eq(userPhotocardsTable.id, result.id))
      .execute();

    expect(savedUserPhotocards).toHaveLength(1);
    const saved = savedUserPhotocards[0];
    expect(saved.user_id).toEqual('test-user-123');
    expect(saved.photocard_id).toEqual(masterPhotocard.id);
    expect(saved.user_image_url).toEqual('https://example.com/user/my-photocard.jpg');
    expect(saved.condition).toEqual('MINT');
    expect(saved.acquired_date).toEqual(new Date('2024-01-15'));
    expect(saved.notes).toEqual('Got this at a local shop');
  });

  it('should use default values for optional fields', async () => {
    const masterPhotocard = await createTestPhotocard();
    
    // Test with all optional fields undefined/null
    const minimalInput: AddToCollectionInput = {
      user_id: 'test-user-456',
      photocard_id: masterPhotocard.id,
      user_image_url: 'https://example.com/user/minimal-card.jpg',
      condition: 'MINT', // This field has a default in the schema
      acquired_date: undefined, // Optional field
      notes: undefined // Optional field
    };

    const result = await addToCollection(minimalInput);

    expect(result.condition).toEqual('MINT');
    expect(result.acquired_date).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('should throw error when photocard does not exist in catalog', async () => {
    const input = {
      ...testInput,
      photocard_id: 999999 // Non-existent ID
    };

    await expect(addToCollection(input)).rejects.toThrow(/photocard with id 999999 not found in catalog/i);
  });

  it('should throw error when user already has the photocard', async () => {
    const masterPhotocard = await createTestPhotocard();
    
    const input = {
      ...testInput,
      photocard_id: masterPhotocard.id
    };

    // Add photocard first time - should succeed
    await addToCollection(input);

    // Try to add same photocard again - should fail
    await expect(addToCollection(input)).rejects.toThrow(/already in your collection/i);
  });

  it('should allow different users to add the same photocard', async () => {
    const masterPhotocard = await createTestPhotocard();
    
    const user1Input = {
      ...testInput,
      user_id: 'user-1',
      photocard_id: masterPhotocard.id
    };

    const user2Input = {
      ...testInput,
      user_id: 'user-2',
      photocard_id: masterPhotocard.id,
      user_image_url: 'https://example.com/user2/card.jpg'
    };

    // Both users should be able to add the same photocard
    const result1 = await addToCollection(user1Input);
    const result2 = await addToCollection(user2Input);

    expect(result1.user_id).toEqual('user-1');
    expect(result2.user_id).toEqual('user-2');
    expect(result1.photocard_id).toEqual(masterPhotocard.id);
    expect(result2.photocard_id).toEqual(masterPhotocard.id);
  });

  it('should allow same user to add different photocards', async () => {
    // Create two different master photocards
    const photocard1 = await createTestPhotocard();
    
    const photocard2 = await db.insert(photocardsTable)
      .values({
        filename: 'second-photocard.jpg',
        image_url: 'https://example.com/catalog/second-photocard.jpg',
        category: 'ALBUMS',
        release_type: 'ALBUM',
        release_structure: 'ALBUM_CARD',
        album_name: 'Another Album',
        store: 'KTOWN4U',
        version: 'G_VER',
        member: 'CHISA'
      })
      .returning()
      .execute();

    const input1 = {
      ...testInput,
      photocard_id: photocard1.id
    };

    const input2 = {
      ...testInput,
      photocard_id: photocard2[0].id,
      user_image_url: 'https://example.com/user/second-card.jpg'
    };

    // Same user should be able to add different photocards
    const result1 = await addToCollection(input1);
    const result2 = await addToCollection(input2);

    expect(result1.user_id).toEqual('test-user-123');
    expect(result2.user_id).toEqual('test-user-123');
    expect(result1.photocard_id).toEqual(photocard1.id);
    expect(result2.photocard_id).toEqual(photocard2[0].id);
  });

  it('should handle missing condition field with default', async () => {
    const masterPhotocard = await createTestPhotocard();
    
    // Simulate input where condition might be undefined (e.g., from API without condition)
    const inputWithoutCondition = {
      user_id: 'test-user-no-condition',
      photocard_id: masterPhotocard.id,
      user_image_url: 'https://example.com/user/no-condition.jpg'
    } as AddToCollectionInput;

    const result = await addToCollection(inputWithoutCondition);

    expect(result.condition).toEqual('MINT'); // Should default to MINT
  });

  it('should handle all condition types', async () => {
    const masterPhotocard = await createTestPhotocard();
    
    const conditions = ['MINT', 'NEAR_MINT', 'GOOD', 'FAIR', 'POOR'] as const;
    
    for (let i = 0; i < conditions.length; i++) {
      const input = {
        user_id: `user-${i}`,
        photocard_id: masterPhotocard.id,
        user_image_url: `https://example.com/user${i}/card.jpg`,
        condition: conditions[i]
      };

      const result = await addToCollection(input);
      expect(result.condition).toEqual(conditions[i]);
    }
  });
});