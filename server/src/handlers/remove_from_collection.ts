import { db } from '../db';
import { userPhotocardsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function removeFromCollection(id: number, userId: string): Promise<boolean> {
  try {
    // Delete the user photocard record with both ID and user_id validation
    // This ensures the user can only remove their own photocards
    const result = await db.delete(userPhotocardsTable)
      .where(
        and(
          eq(userPhotocardsTable.id, id),
          eq(userPhotocardsTable.user_id, userId)
        )
      )
      .returning()
      .execute();

    // Return true if a record was deleted, false if not found or unauthorized
    return result.length > 0;
  } catch (error) {
    console.error('Failed to remove photocard from collection:', error);
    throw error;
  }
}