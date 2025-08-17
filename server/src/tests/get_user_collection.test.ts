import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { photocardsTable, userPhotocardsTable } from '../db/schema';
import { getUserCollection } from '../handlers/get_user_collection';

describe('getUserCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no collection', async () => {
    const result = await getUserCollection('user123');
    expect(result).toEqual([]);
  });

  it('should return user collection with photocard details', async () => {
    // Create test photocard in master catalog
    const [masterCard] = await db.insert(photocardsTable)
      .values({
        filename: 'xg_jurin_album_card.jpg',
        image_url: 'https://example.com/jurin_card.jpg',
        category: 'ALBUMS',
        release_type: 'ALBUM',
        release_structure: 'ALBUM_CARD',
        album_name: 'NEW DNA',
        store: 'Universal Music',
        version: 'STANDARD',
        member: 'JURIN'
      })
      .returning()
      .execute();

    // Add card to user's collection
    const testDate = new Date('2024-01-15');
    const [userCard] = await db.insert(userPhotocardsTable)
      .values({
        user_id: 'user123',
        photocard_id: masterCard.id,
        user_image_url: 'https://example.com/user_jurin_card.jpg',
        condition: 'MINT',
        acquired_date: testDate,
        notes: 'First card in my collection!'
      })
      .returning()
      .execute();

    const result = await getUserCollection('user123');

    expect(result).toHaveLength(1);
    
    // Verify user collection data
    const collectionItem = result[0];
    expect(collectionItem.id).toBe(userCard.id);
    expect(collectionItem.user_id).toBe('user123');
    expect(collectionItem.photocard_id).toBe(masterCard.id);
    expect(collectionItem.user_image_url).toBe('https://example.com/user_jurin_card.jpg');
    expect(collectionItem.condition).toBe('MINT');
    expect(collectionItem.acquired_date).toEqual(testDate);
    expect(collectionItem.notes).toBe('First card in my collection!');
    expect(collectionItem.created_at).toBeInstanceOf(Date);
    expect(collectionItem.updated_at).toBeInstanceOf(Date);

    // Verify embedded photocard details
    const photocard = collectionItem.photocard;
    expect(photocard.id).toBe(masterCard.id);
    expect(photocard.filename).toBe('xg_jurin_album_card.jpg');
    expect(photocard.image_url).toBe('https://example.com/jurin_card.jpg');
    expect(photocard.category).toBe('ALBUMS');
    expect(photocard.release_type).toBe('ALBUM');
    expect(photocard.release_structure).toBe('ALBUM_CARD');
    expect(photocard.album_name).toBe('NEW DNA');
    expect(photocard.store).toBe('Universal Music');
    expect(photocard.version).toBe('STANDARD');
    expect(photocard.member).toBe('JURIN');
    expect(photocard.created_at).toBeInstanceOf(Date);
    expect(photocard.updated_at).toBeInstanceOf(Date);
  });

  it('should return only specified user collection', async () => {
    // Create test photocards
    const [card1, card2] = await db.insert(photocardsTable)
      .values([
        {
          filename: 'xg_jurin_showcase.jpg',
          image_url: 'https://example.com/jurin_showcase.jpg',
          category: 'SHOWCASE',
          release_type: 'SHOWCASE',
          release_structure: 'BROADCAST',
          album_name: 'SHOWCASE 2024',
          store: null,
          version: 'STANDARD',
          member: 'JURIN'
        },
        {
          filename: 'xg_chisa_album.jpg',
          image_url: 'https://example.com/chisa_album.jpg',
          category: 'ALBUMS',
          release_type: 'ALBUM',
          release_structure: 'ALBUM_CARD',
          album_name: 'SHOOTING STAR',
          store: 'KTOWN4U',
          version: 'R1',
          member: 'CHISA'
        }
      ])
      .returning()
      .execute();

    // Add cards to different users' collections
    await db.insert(userPhotocardsTable)
      .values([
        {
          user_id: 'user123',
          photocard_id: card1.id,
          user_image_url: 'https://example.com/user123_jurin.jpg',
          condition: 'MINT',
          acquired_date: new Date('2024-01-10'),
          notes: 'Love this showcase card!'
        },
        {
          user_id: 'user456',
          photocard_id: card2.id,
          user_image_url: 'https://example.com/user456_chisa.jpg',
          condition: 'NEAR_MINT',
          acquired_date: new Date('2024-01-12'),
          notes: 'Got from KTOWN4U'
        },
        {
          user_id: 'user123',
          photocard_id: card2.id,
          user_image_url: 'https://example.com/user123_chisa.jpg',
          condition: 'GOOD',
          acquired_date: null,
          notes: null
        }
      ])
      .execute();

    const user123Collection = await getUserCollection('user123');
    const user456Collection = await getUserCollection('user456');

    // user123 should have 2 cards
    expect(user123Collection).toHaveLength(2);
    expect(user123Collection.every(item => item.user_id === 'user123')).toBe(true);

    // user456 should have 1 card
    expect(user456Collection).toHaveLength(1);
    expect(user456Collection[0].user_id).toBe('user456');
    expect(user456Collection[0].photocard.member).toBe('CHISA');
  });

  it('should order collection by created_at descending', async () => {
    // Create test photocard
    const [masterCard] = await db.insert(photocardsTable)
      .values({
        filename: 'xg_maya_event.jpg',
        image_url: 'https://example.com/maya_event.jpg',
        category: 'EVENTS',
        release_type: 'FANMEETING',
        release_structure: 'LUCKY_DRAW',
        album_name: 'FANMEETING 2024',
        store: 'Official Store',
        version: 'STANDARD',
        member: 'MAYA'
      })
      .returning()
      .execute();

    // Add same card multiple times to collection (simulating duplicates or different conditions)
    const card1Date = new Date('2024-01-10T10:00:00Z');
    const card2Date = new Date('2024-01-15T10:00:00Z');
    const card3Date = new Date('2024-01-12T10:00:00Z');

    await db.insert(userPhotocardsTable)
      .values([
        {
          user_id: 'user123',
          photocard_id: masterCard.id,
          user_image_url: 'https://example.com/user_maya1.jpg',
          condition: 'MINT',
          acquired_date: card1Date,
          notes: 'First copy'
        },
        {
          user_id: 'user123',
          photocard_id: masterCard.id,
          user_image_url: 'https://example.com/user_maya2.jpg',
          condition: 'NEAR_MINT',
          acquired_date: card2Date,
          notes: 'Second copy'
        },
        {
          user_id: 'user123',
          photocard_id: masterCard.id,
          user_image_url: 'https://example.com/user_maya3.jpg',
          condition: 'GOOD',
          acquired_date: card3Date,
          notes: 'Third copy'
        }
      ])
      .execute();

    const result = await getUserCollection('user123');

    expect(result).toHaveLength(3);
    
    // Should be ordered by created_at descending (most recent first)
    // Since we insert in order, the created_at should follow that pattern
    expect(result[0].notes).toBe('Third copy');
    expect(result[1].notes).toBe('Second copy');
    expect(result[2].notes).toBe('First copy');
    
    // Verify descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle nullable fields correctly', async () => {
    // Create photocard with nullable store
    const [masterCard] = await db.insert(photocardsTable)
      .values({
        filename: 'xg_hinata_special.jpg',
        image_url: 'https://example.com/hinata_special.jpg',
        category: 'MERCH',
        release_type: 'PHOTOCARD',
        release_structure: 'SHOPS',
        album_name: 'SPECIAL EDITION',
        store: null, // Nullable field
        version: 'STANDARD',
        member: 'HINATA'
      })
      .returning()
      .execute();

    // Add to collection with nullable fields
    await db.insert(userPhotocardsTable)
      .values({
        user_id: 'user123',
        photocard_id: masterCard.id,
        user_image_url: 'https://example.com/user_hinata.jpg',
        condition: 'FAIR',
        acquired_date: null, // Nullable field
        notes: null // Nullable field
      })
      .execute();

    const result = await getUserCollection('user123');

    expect(result).toHaveLength(1);
    const collectionItem = result[0];
    
    // Verify nullable fields are handled correctly
    expect(collectionItem.acquired_date).toBeNull();
    expect(collectionItem.notes).toBeNull();
    expect(collectionItem.photocard.store).toBeNull();
    
    // Verify non-nullable fields
    expect(collectionItem.condition).toBe('FAIR');
    expect(collectionItem.photocard.member).toBe('HINATA');
    expect(collectionItem.photocard.album_name).toBe('SPECIAL EDITION');
  });
});