import { db } from '../db';
import { userPhotocardsTable, photocardsTable } from '../db/schema';
import { type UserPhotocardWithDetails } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getUserPhotocard(id: number, userId: string): Promise<UserPhotocardWithDetails | null> {
  try {
    // Join user collection entry with master photocard details
    // Security: Filter by both id and user_id to ensure the card belongs to the user
    const results = await db.select()
      .from(userPhotocardsTable)
      .innerJoin(photocardsTable, eq(userPhotocardsTable.photocard_id, photocardsTable.id))
      .where(
        and(
          eq(userPhotocardsTable.id, id),
          eq(userPhotocardsTable.user_id, userId)
        )
      )
      .execute();

    // Return null if no matching record found
    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    
    // Construct the response with nested photocard details
    return {
      id: result.user_photocards.id,
      user_id: result.user_photocards.user_id,
      photocard_id: result.user_photocards.photocard_id,
      user_image_url: result.user_photocards.user_image_url,
      condition: result.user_photocards.condition,
      acquired_date: result.user_photocards.acquired_date,
      notes: result.user_photocards.notes,
      created_at: result.user_photocards.created_at,
      updated_at: result.user_photocards.updated_at,
      photocard: {
        id: result.photocards.id,
        filename: result.photocards.filename,
        image_url: result.photocards.image_url,
        category: result.photocards.category,
        release_type: result.photocards.release_type,
        release_structure: result.photocards.release_structure,
        album_name: result.photocards.album_name,
        store: result.photocards.store,
        version: result.photocards.version,
        member: result.photocards.member,
        created_at: result.photocards.created_at,
        updated_at: result.photocards.updated_at
      }
    };
  } catch (error) {
    console.error('Get user photocard failed:', error);
    throw error;
  }
}