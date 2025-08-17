import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type ParseFilenameInput } from '../schema';
import { parseFilename } from '../handlers/parse_filename';

describe('parseFilename', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should parse basic album filename correctly', async () => {
    const input: ParseFilenameInput = {
      filename: 'albums_awe_amazon_usa_jurin.png'
    };

    const result = await parseFilename(input);

    expect(result.category).toEqual('ALBUMS');
    expect(result.album_name).toEqual('Awe');
    expect(result.store).toEqual('Amazon Usa');
    expect(result.version).toEqual('STANDARD');
    expect(result.member).toEqual('JURIN');
    expect(result.release_type).toEqual('ALBUM');
    expect(result.release_structure).toEqual('SHOPS');
  });

  it('should parse filename with g_ver version', async () => {
    const input: ParseFilenameInput = {
      filename: 'albums_new_dna_aladin_rakuten_g_ver_standard_hinata.png'
    };

    const result = await parseFilename(input);

    expect(result.category).toEqual('ALBUMS');
    expect(result.album_name).toEqual('New Dna');
    expect(result.store).toEqual('Aladin Rakuten');
    expect(result.version).toEqual('G_VER');
    expect(result.member).toEqual('HINATA');
    expect(result.release_type).toEqual('ALBUM');
    expect(result.release_structure).toEqual('ALADIN_RAKUTEN');
  });

  it('should parse events filename with lucky draw', async () => {
    const input: ParseFilenameInput = {
      filename: 'events_the_first_howl_lucky_draw_r3_standard_maya.png'
    };

    const result = await parseFilename(input);

    expect(result.category).toEqual('EVENTS');
    expect(result.album_name).toEqual('The First Howl');
    expect(result.store).toEqual('Lucky Draw');
    expect(result.version).toEqual('R3');
    expect(result.member).toEqual('MAYA');
    expect(result.release_type).toEqual('LUCKY_DRAW');
    expect(result.release_structure).toEqual('LUCKY_DRAW');
  });

  it('should parse merch filename with benefit store', async () => {
    const input: ParseFilenameInput = {
      filename: 'merch_anniversary_md_benefit_standard_chisa.png'
    };

    const result = await parseFilename(input);

    expect(result.category).toEqual('MERCH');
    expect(result.album_name).toEqual('Anniversary');
    expect(result.store).toEqual('Md Benefit');
    expect(result.version).toEqual('STANDARD');
    expect(result.member).toEqual('CHISA');
    expect(result.release_type).toEqual('ANNIVERSARY');
    expect(result.release_structure).toEqual('UNIT_POB');
  });

  it('should parse fanclub filename', async () => {
    const input: ParseFilenameInput = {
      filename: 'fanclub_alphaz_fanclub_the_box_zero_standard_chisa.png'
    };

    const result = await parseFilename(input);

    expect(result.category).toEqual('FANCLUB');
    expect(result.album_name).toEqual('Alphaz Fanclub');
    expect(result.store).toEqual('The Box');
    expect(result.version).toEqual('ZERO');
    expect(result.member).toEqual('CHISA');
    expect(result.release_type).toEqual('FANMEETING');
    expect(result.release_structure).toEqual('ANNUAL_MEMBERSHIP');
  });

  it('should parse season greetings filename', async () => {
    const input: ParseFilenameInput = {
      filename: 'season_greetings_season_greetings_sg_2023_standard_harvey.png'
    };

    const result = await parseFilename(input);

    expect(result.category).toEqual('SEASON_GREETINGS');
    expect(result.album_name).toEqual('Season Greetings');
    expect(result.store).toEqual('Sg 2023');
    expect(result.version).toEqual('STANDARD');
    expect(result.member).toEqual('HARVEY');
    expect(result.release_type).toEqual('SEASON_GREETINGS');
    expect(result.release_structure).toEqual('SHOPS');
  });

  it('should parse showcase filename with merch benefit', async () => {
    const input: ParseFilenameInput = {
      filename: 'showcase_1st_showcase_merch_benefit_standard_juria.png'
    };

    const result = await parseFilename(input);

    expect(result.category).toEqual('SHOWCASE');
    expect(result.album_name).toEqual('1st Showcase');
    expect(result.store).toEqual('Merch Benefit');
    expect(result.version).toEqual('STANDARD');
    expect(result.member).toEqual('JURIA');
    expect(result.release_type).toEqual('SHOWCASE');
    expect(result.release_structure).toEqual('UNIT_POB');
  });

  it('should parse showcase filename with watch band benefit', async () => {
    const input: ParseFilenameInput = {
      filename: 'showcase_1st_showcase_watch_band_benefit_standard_harvey.png'
    };

    const result = await parseFilename(input);

    expect(result.category).toEqual('SHOWCASE');
    expect(result.album_name).toEqual('1st Showcase');
    expect(result.store).toEqual('Watch Band Benefit');
    expect(result.version).toEqual('STANDARD');
    expect(result.member).toEqual('HARVEY');
    expect(result.release_type).toEqual('SHOWCASE');
    expect(result.release_structure).toEqual('UNIT_POB');
  });

  it('should handle different file extensions', async () => {
    const jpegInput: ParseFilenameInput = {
      filename: 'albums_awe_amazon_usa_jurin.jpeg'
    };

    const jpgInput: ParseFilenameInput = {
      filename: 'albums_awe_amazon_usa_jurin.jpg'
    };

    const jpegResult = await parseFilename(jpegInput);
    const jpgResult = await parseFilename(jpgInput);

    expect(jpegResult.album_name).toEqual('Awe');
    expect(jpgResult.album_name).toEqual('Awe');
  });

  it('should parse filename without store (album card)', async () => {
    const input: ParseFilenameInput = {
      filename: 'albums_awe_standard_cocona.png'
    };

    const result = await parseFilename(input);

    expect(result.category).toEqual('ALBUMS');
    expect(result.album_name).toEqual('Awe');
    expect(result.store).toEqual(null);
    expect(result.version).toEqual('STANDARD');
    expect(result.member).toEqual('COCONA');
    expect(result.release_structure).toEqual('ALBUM_CARD');
  });

  it('should parse filename with R2 version', async () => {
    const input: ParseFilenameInput = {
      filename: 'albums_awe_tower_records_r2_maya.png'
    };

    const result = await parseFilename(input);

    expect(result.category).toEqual('ALBUMS');
    expect(result.version).toEqual('R2');
    expect(result.member).toEqual('MAYA');
    expect(result.store).toEqual('Tower Records');
    expect(result.release_structure).toEqual('TOWER_RECORDS');
  });

  it('should throw error for invalid filename format', async () => {
    const input: ParseFilenameInput = {
      filename: 'invalid_format.png'
    };

    await expect(parseFilename(input)).rejects.toThrow(/insufficient parts/i);
  });

  it('should throw error for unknown category', async () => {
    const input: ParseFilenameInput = {
      filename: 'unknown_category_album_store_standard_jurin.png'
    };

    await expect(parseFilename(input)).rejects.toThrow(/unknown category/i);
  });

  it('should throw error for unknown member', async () => {
    const input: ParseFilenameInput = {
      filename: 'albums_awe_store_standard_unknown.png'
    };

    await expect(parseFilename(input)).rejects.toThrow(/unknown member/i);
  });

  it('should handle case insensitive parsing', async () => {
    const input: ParseFilenameInput = {
      filename: 'ALBUMS_AWE_AMAZON_USA_JURIN.PNG'
    };

    const result = await parseFilename(input);

    expect(result.category).toEqual('ALBUMS');
    expect(result.member).toEqual('JURIN');
    expect(result.album_name).toEqual('Awe');
  });

  it('should infer HMV release structure', async () => {
    const input: ParseFilenameInput = {
      filename: 'albums_awe_hmv_standard_jurin.png'
    };

    const result = await parseFilename(input);

    expect(result.store).toEqual('Hmv');
    expect(result.release_structure).toEqual('HMV');
  });

  it('should infer KTOWN4U release structure', async () => {
    const input: ParseFilenameInput = {
      filename: 'albums_awe_ktown4u_standard_jurin.png'
    };

    const result = await parseFilename(input);

    expect(result.store).toEqual('Ktown4u');
    expect(result.release_structure).toEqual('KTOWN4U');
  });
});