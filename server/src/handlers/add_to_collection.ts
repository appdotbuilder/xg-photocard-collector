import { db } from '../db';
import { photocardsTable, userPhotocardsTable } from '../db/schema';
import { type AddToCollectionInput, type UserPhotocard } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function addToCollection(input: AddToCollectionInput): Promise<UserPhotocard> {
  try {
    // Validate that the referenced photocard exists in the master catalog
    const existingPhotocard = await db.select()
      .from(photocardsTable)
      .where(eq(photocardsTable.id, input.photocard_id))
      .execute();

    if (existingPhotocard.length === 0) {
      throw new Error(`Photocard with ID ${input.photocard_id} not found in catalog`);
    }

    // Check if user has already added this photocard to their collection
    const existingUserPhotocard = await db.select()
      .from(userPhotocardsTable)
      .where(and(
        eq(userPhotocardsTable.user_id, input.user_id),
        eq(userPhotocardsTable.photocard_id, input.photocard_id)
      ))
      .execute();

    if (existingUserPhotocard.length > 0) {
      throw new Error('This photocard is already in your collection');
    }

    // Insert the photocard into user's collection
    const result = await db.insert(userPhotocardsTable)
      .values({
        user_id: input.user_id,
        photocard_id: input.photocard_id,
        user_image_url: input.user_image_url,
        condition: input.condition || 'MINT',
        acquired_date: input.acquired_date || null,
        notes: input.notes || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Failed to add photocard to collection:', error);
    throw error;
  }
}