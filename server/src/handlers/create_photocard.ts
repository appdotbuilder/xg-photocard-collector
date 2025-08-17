import { db } from '../db';
import { photocardsTable } from '../db/schema';
import { type CreatePhotocardInput, type Photocard } from '../schema';

export const createPhotocard = async (input: CreatePhotocardInput): Promise<Photocard> => {
  try {
    // Insert photocard record
    const result = await db.insert(photocardsTable)
      .values({
        filename: input.filename,
        image_url: input.image_url,
        category: input.category,
        release_type: input.release_type,
        release_structure: input.release_structure,
        album_name: input.album_name,
        store: input.store,
        version: input.version,
        member: input.member
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Photocard creation failed:', error);
    throw error;
  }
};