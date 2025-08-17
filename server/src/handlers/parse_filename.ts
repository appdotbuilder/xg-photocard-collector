import { type ParseFilenameInput, type ParsedFilename } from '../schema';

export const parseFilename = async (input: ParseFilenameInput): Promise<ParsedFilename> => {
  try {
    // Remove file extension and split by underscores
    const filename = input.filename.replace(/\.(png|jpg|jpeg)$/i, '');
    const parts = filename.toLowerCase().split('_');
    
    if (parts.length < 4) {
      throw new Error('Invalid filename format - insufficient parts');
    }

    // Extract category (first part, handling multi-word categories)
    let category: string;
    let categoryEndIndex = 1; // Where category ends, album starts
    
    if (parts[0] === 'season' && parts.length > 1 && parts[1] === 'greetings') {
      category = 'SEASON_GREETINGS';
      categoryEndIndex = 2; // Skip both "season" and "greetings"
    } else {
      const categoryMap: Record<string, any> = {
        'albums': 'ALBUMS',
        'events': 'EVENTS', 
        'merch': 'MERCH',
        'fanclub': 'FANCLUB',
        'showcase': 'SHOWCASE'
      };
      
      category = categoryMap[parts[0]];
      if (!category) {
        throw new Error(`Unknown category: ${parts[0]}`);
      }
    }


    // Extract member (last part)
    const memberMap: Record<string, any> = {
      'jurin': 'JURIN',
      'chisa': 'CHISA', 
      'hinata': 'HINATA',
      'harvey': 'HARVEY',
      'juria': 'JURIA',
      'maya': 'MAYA',
      'cocona': 'COCONA'
    };
    
    const member = memberMap[parts[parts.length - 1]];
    if (!member) {
      throw new Error(`Unknown member: ${parts[parts.length - 1]}`);
    }

    // Work backwards from the member to determine version and middle parts
    let memberIndex = parts.length - 1;
    let versionEndIndex = memberIndex; // End of version part (exclusive)
    let version = 'STANDARD';
    
    const versionOnlyMap: Record<string, any> = {
      'r1': 'R1',
      'r2': 'R2',
      'r3': 'R3', 
      'zero': 'ZERO'
    };
    
    // Check patterns from most specific to least specific
    // Check for g_ver_standard pattern (4 parts: g ver standard member)
    if (memberIndex >= 3 && parts[memberIndex - 3] === 'g' && parts[memberIndex - 2] === 'ver' && parts[memberIndex - 1] === 'standard') {
      version = 'G_VER';
      versionEndIndex = memberIndex - 3;
    }
    // Check for g_ver pattern (3 parts: g ver member)
    else if (memberIndex >= 2 && parts[memberIndex - 2] === 'g' && parts[memberIndex - 1] === 'ver') {
      version = 'G_VER';
      versionEndIndex = memberIndex - 2;
    }
    // Check for version_standard pattern (3 parts: version standard member)
    else if (memberIndex >= 2 && parts[memberIndex - 1] === 'standard' && versionOnlyMap[parts[memberIndex - 2]]) {
      version = versionOnlyMap[parts[memberIndex - 2]];
      versionEndIndex = memberIndex - 2;
    }
    // Check for explicit "standard" keyword only (2 parts: standard member)
    else if (parts[memberIndex - 1] === 'standard') {
      version = 'STANDARD';
      versionEndIndex = memberIndex - 1;
    }
    // Check for single version part (2 parts: version member)
    else if (versionOnlyMap[parts[memberIndex - 1]]) {
      version = versionOnlyMap[parts[memberIndex - 1]];
      versionEndIndex = memberIndex - 1;
    }
    
    // Everything between category end and version is album + store
    let middleParts = parts.slice(categoryEndIndex, versionEndIndex);
    
    // Store patterns to identify where store starts
    const multiWordStores = [
      ['tower', 'records'],
      ['aladin', 'rakuten'], 
      ['lucky', 'draw'],
      ['the', 'box'],
      ['watch', 'band'],
      ['md', 'benefit'],
      ['merch', 'benefit'],
      ['alphaz', 'fanclub']
    ];
    
    const singleWordStores = [
      'amazon', 'ktown4u', 'hmv', 'broadcast', 'exclusive',
      'shops', 'sg', 'benefit', 'md', 'merch', 'fanclub', 'usa'
    ];
    
    // Find where store starts
    let storeStartIndex = -1;
    
    // Check for multi-word store patterns
    for (const [word1, word2] of multiWordStores) {
      for (let i = 0; i < middleParts.length - 1; i++) {
        if (middleParts[i] === word1 && middleParts[i + 1] === word2) {
          storeStartIndex = i;
          break;
        }
      }
      if (storeStartIndex >= 0) break;
    }
    
    // If no multi-word store found, check for single word stores
    if (storeStartIndex === -1) {
      for (let i = 0; i < middleParts.length; i++) {
        if (singleWordStores.includes(middleParts[i])) {
          storeStartIndex = i;
          break;
        }
      }
    }
    
    let albumParts: string[] = [];
    let storeParts: string[] = [];
    
    if (storeStartIndex >= 0) {
      albumParts = middleParts.slice(0, storeStartIndex);
      storeParts = middleParts.slice(storeStartIndex);
    } else {
      // No store found, everything is album
      albumParts = middleParts;
      storeParts = [];
    }
    
    const album_name = albumParts.join(' ').replace(/\b\w/g, l => l.toUpperCase());
    const store = storeParts.length > 0 ? storeParts.join(' ').replace(/\b\w/g, l => l.toUpperCase()) : null;

    // Infer release_type based on category and context
    let release_type: string;
    switch (category) {
      case 'ALBUMS':
        release_type = 'ALBUM';
        break;
      case 'EVENTS':
        if (album_name.toLowerCase().includes('anniversary')) {
          release_type = 'ANNIVERSARY';
        } else if (store?.toLowerCase().includes('lucky draw')) {
          release_type = 'LUCKY_DRAW';
        } else if (album_name.toLowerCase().includes('kcon')) {
          release_type = 'KCON';
        } else if (album_name.toLowerCase().includes('fanmeeting')) {
          release_type = 'FANMEETING';
        } else {
          release_type = 'SHOWCASE';
        }
        break;
      case 'MERCH':
        if (album_name.toLowerCase().includes('anniversary')) {
          release_type = 'ANNIVERSARY';
        } else {
          release_type = 'SHOWCASE';
        }
        break;
      case 'FANCLUB':
        release_type = 'FANMEETING';
        break;
      case 'SEASON_GREETINGS':
        release_type = 'SEASON_GREETINGS';
        break;
      case 'SHOWCASE':
        release_type = 'SHOWCASE';
        break;
      default:
        release_type = 'PHOTOCARD';
    }

    // Infer release_structure based on store and context
    let release_structure: string;
    if (!store) {
      release_structure = 'ALBUM_CARD';
    } else {
      const storeText = store.toLowerCase();
      if (storeText.includes('tower records')) {
        release_structure = 'TOWER_RECORDS';
      } else if (storeText.includes('ktown4u')) {
        release_structure = 'KTOWN4U';
      } else if (storeText.includes('hmv')) {
        release_structure = 'HMV';
      } else if (storeText.includes('aladin') || storeText.includes('rakuten')) {
        release_structure = 'ALADIN_RAKUTEN';
      } else if (storeText.includes('broadcast')) {
        release_structure = 'BROADCAST';
      } else if (storeText.includes('alphaz') || storeText.includes('exclusive')) {
        release_structure = 'ALPHAZ_EXCLUSIVE';
      } else if (storeText.includes('lucky') || storeText.includes('draw')) {
        release_structure = 'LUCKY_DRAW';
      } else if (storeText.includes('benefit') || storeText.includes('md')) {
        release_structure = 'UNIT_POB';
      } else if (storeText.includes('fanclub') || storeText.includes('the box')) {
        release_structure = 'ANNUAL_MEMBERSHIP';
      } else if (storeText.includes('vip')) {
        release_structure = 'VIP_PHOTOCARD';
      } else {
        release_structure = 'SHOPS';
      }
    }

    return {
      category,
      release_type,
      album_name,
      store,
      version,
      member,
      release_structure
    } as ParsedFilename;
    
  } catch (error) {
    console.error('Filename parsing failed:', error);
    throw error;
  }
};