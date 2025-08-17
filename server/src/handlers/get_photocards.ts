import { db } from '../db';
import { photocardsTable } from '../db/schema';
import { type Photocard, type PhotocardFilter } from '../schema';
import { eq, and, ilike, type SQL } from 'drizzle-orm';

export const getPhotocards = async (filter?: PhotocardFilter): Promise<Photocard[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter) {
      // Filter by category
      if (filter.category) {
        conditions.push(eq(photocardsTable.category, filter.category));
      }

      // Filter by release type
      if (filter.release_type) {
        conditions.push(eq(photocardsTable.release_type, filter.release_type));
      }

      // Filter by release structure
      if (filter.release_structure) {
        conditions.push(eq(photocardsTable.release_structure, filter.release_structure));
      }

      // Filter by member
      if (filter.member) {
        conditions.push(eq(photocardsTable.member, filter.member));
      }

      // Filter by album name (case-insensitive partial match)
      if (filter.album_name) {
        conditions.push(ilike(photocardsTable.album_name, `%${filter.album_name}%`));
      }

      // Filter by store (case-insensitive partial match)
      if (filter.store) {
        conditions.push(ilike(photocardsTable.store, `%${filter.store}%`));
      }

      // Filter by version
      if (filter.version) {
        conditions.push(eq(photocardsTable.version, filter.version));
      }
    }

    // Build query with or without where clause
    const query = conditions.length > 0
      ? db.select().from(photocardsTable).where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : db.select().from(photocardsTable);

    // Execute query
    const results = await query.execute();

    // Return results (no numeric conversions needed for photocards table)
    return results;
  } catch (error) {
    console.error('Failed to fetch photocards:', error);
    throw error;
  }
};