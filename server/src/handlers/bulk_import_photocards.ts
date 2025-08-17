import { db } from '../db';
import { photocardsTable } from '../db/schema';
import { type CreatePhotocardInput, type Photocard } from '../schema';
import { eq } from 'drizzle-orm';

export async function bulkImportPhotocards(photocards: CreatePhotocardInput[]): Promise<Photocard[]> {
  try {
    if (photocards.length === 0) {
      return [];
    }

    // Track successful and failed imports
    const successfulImports: Photocard[] = [];
    const failedImports: { photocard: CreatePhotocardInput; error: string }[] = [];

    // Process photocards in batches to avoid memory issues
    const batchSize = 100;
    
    for (let i = 0; i < photocards.length; i += batchSize) {
      const batch = photocards.slice(i, i + batchSize);
      
      // Filter out duplicates by checking existing filenames in this batch
      const batchFilenames = batch.map(p => p.filename);
      const existingPhotocards = await db.select()
        .from(photocardsTable)
        .where(eq(photocardsTable.filename, batchFilenames[0]))
        .execute();

      // Get all existing filenames to avoid duplicates
      const existingFilenameSet = new Set<string>();
      for (const filename of batchFilenames) {
        const existing = await db.select()
          .from(photocardsTable)
          .where(eq(photocardsTable.filename, filename))
          .execute();
        
        if (existing.length > 0) {
          existingFilenameSet.add(filename);
        }
      }

      // Filter out duplicates from current batch
      const uniquePhotocards = batch.filter(p => !existingFilenameSet.has(p.filename));

      if (uniquePhotocards.length === 0) {
        continue; // Skip this batch if all are duplicates
      }

      try {
        // Bulk insert the unique photocards
        const insertedPhotocards = await db.insert(photocardsTable)
          .values(uniquePhotocards.map(photocard => ({
            filename: photocard.filename,
            image_url: photocard.image_url,
            category: photocard.category,
            release_type: photocard.release_type,
            release_structure: photocard.release_structure,
            album_name: photocard.album_name,
            store: photocard.store,
            version: photocard.version,
            member: photocard.member
          })))
          .returning()
          .execute();

        successfulImports.push(...insertedPhotocards);
      } catch (batchError) {
        console.error(`Batch import failed for batch starting at index ${i}:`, batchError);
        
        // If batch fails, try individual inserts to identify specific failures
        for (const photocard of uniquePhotocards) {
          try {
            const result = await db.insert(photocardsTable)
              .values({
                filename: photocard.filename,
                image_url: photocard.image_url,
                category: photocard.category,
                release_type: photocard.release_type,
                release_structure: photocard.release_structure,
                album_name: photocard.album_name,
                store: photocard.store,
                version: photocard.version,
                member: photocard.member
              })
              .returning()
              .execute();

            successfulImports.push(result[0]);
          } catch (individualError) {
            failedImports.push({
              photocard,
              error: individualError instanceof Error ? individualError.message : 'Unknown error'
            });
          }
        }
      }
    }

    // Log import summary
    console.log(`Bulk import completed: ${successfulImports.length} successful, ${failedImports.length} failed`);
    if (failedImports.length > 0) {
      console.error('Failed imports:', failedImports);
    }

    return successfulImports;
  } catch (error) {
    console.error('Bulk import failed:', error);
    throw error;
  }
}