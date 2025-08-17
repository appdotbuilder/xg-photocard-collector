import { db } from '../db';
import { userPhotocardsTable } from '../db/schema';
import { type UpdateUserPhotocardInput, type UserPhotocard } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateUserPhotocard = async (input: UpdateUserPhotocardInput): Promise<UserPhotocard> => {
  try {
    // First, verify the record exists and belongs to the user
    const existingRecord = await db.select()
      .from(userPhotocardsTable)
      .where(
        and(
          eq(userPhotocardsTable.id, input.id),
          eq(userPhotocardsTable.user_id, input.user_id)
        )
      )
      .execute();

    if (existingRecord.length === 0) {
      throw new Error('User photocard not found or access denied');
    }

    // Build update values only for provided fields
    const updateValues: any = {
      updated_at: new Date()
    };

    if (input.condition !== undefined) {
      updateValues.condition = input.condition;
    }

    if (input.acquired_date !== undefined) {
      updateValues.acquired_date = input.acquired_date;
    }

    if (input.notes !== undefined) {
      updateValues.notes = input.notes;
    }

    // Update the record
    const result = await db.update(userPhotocardsTable)
      .set(updateValues)
      .where(
        and(
          eq(userPhotocardsTable.id, input.id),
          eq(userPhotocardsTable.user_id, input.user_id)
        )
      )
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Failed to update user photocard');
    }

    return result[0];
  } catch (error) {
    console.error('User photocard update failed:', error);
    throw error;
  }
};