import knowledgeBase from './knowledge-base.json';

export interface ChatResponse {
  text: string;
  category: string;
  landmarkId?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CategoryConfig {
  name: string;
  keywords: string[];
  displayName: string;
}

const LANDMARK_MAPPINGS: { [key: string]: string } = {
  'altar': 'altar',
  'main altar': 'altar',
  'old auditorium': 'auditorium',
  'new auditorium': 'new-auditorium',
  'the arena': 'new-auditorium',
  'youth center': 'youth',
  'youth centre': 'youth',
  'national youth': 'youth',
  'secretariat': 'secretariat',
  'national secretariat': 'secretariat',
  'main gate': 'city-gate',
  'city gate': 'city-gate',
  'health centre': 'rhc',
  'health center': 'rhc',
  'health village': 'rhv',
  'redeemers health village': 'rhv',
  'rhv': 'rhv',
  'redeemers university': 'run-old',
  'run': 'run-old',
  'bible college': 'bible-college',
  'rcbc': 'bible-college',
  'redeemed christian bible college': 'bible-college',
  'bethel guest house': 'bethel',
  'bethel place': 'bethel',
  'bethel suites': 'bethel',
  'international guest house': 'intl-guest',
  'africa missions guest': 'africa-missions',
  'crm guest house': 'crm-guest',
  'shiloh apartments': 'shiloh',
  'gethsemane lodges': 'shiloh',
  'joy to the wise': 'joy',
  'white house suites': 'white-house',
  'comfort palace': 'comfort',
  'overflow chalets': 'overflow',
  'dove guest house': 'dove'
};

const CATEGORIES: CategoryConfig[] = [
  {
    name: 'Food',
    keywords: ['food', 'restaurant', 'restaurants', 'eat', 'eats', 'eating', 'dining', 'canteen', 'cafeteria', 'cook', 'kitchen', 'hungry', 'starving', 'lunch', 'dinner', 'breakfast', 'chow', 'meal', 'meals', 'fast food', 'street food', 'joint', 'joints', 'bites', 'catering', 'caterer'],
    displayName: 'Dining & Restaurants'
  },
  {
    name: 'Banking',
    keywords: ['bank', 'banks', 'banking', 'cash', 'money', 'atm', 'atms', 'withdraw', 'deposit', 'transfer', 'finance', 'financial', 'mortgage', 'gtbank', 'zenith', 'premium trust', 'unity', 'haggai', 'jubilee'],
    displayName: 'Banking Services & ATMs'
  },
  {
    name: 'Lodging',
    keywords: ['hotel', 'hotels', 'lodging', 'accommodation', 'accommodations', 'stay', 'short stay', 'guest house', 'guesthouse', 'guesthouses', 'suite', 'suites', 'chalet', 'chalets', 'apartment', 'apartments', 'room', 'rooms', 'housing', 'dorm', 'dorms', 'hostel', 'hostels', 'lodge', 'lodges', 'retreat centre'],
    displayName: 'Guest Houses & Accommodations'
  },
  {
    name: 'Emergency',
    keywords: ['security', 'police', 'cop', 'cops', 'patrol', 'guard', 'guards', 'safety', 'emergency', 'sos', 'help', 'danger', 'secure', 'protect', 'protection', 'fire', 'command', 'officer', 'hotline', 'hotlines'],
    displayName: 'Emergency & Security Services'
  },
  {
    name: 'Medical',
    keywords: ['medical', 'hospital', 'hospitals', 'clinic', 'clinics', 'health', 'doctor', 'doctors', 'nurse', 'nurses', 'pharmacy', 'pharmacies', 'medicine', 'medicines', 'sick', 'ill', 'hurt', 'pain', 'treatment', 'first aid', 'healthcare'],
    displayName: 'Medical & Healthcare Facilities'
  },
  {
    name: 'Hotlines',
    keywords: ['water', 'electricity', 'power', 'light', 'lights', 'electrician', 'meter', 'prepaid', 'sanitation', 'dry cleaning', 'waste', 'trash', 'laundry', 'internet', 'wifi', 'network', 'connection', 'tech support', 'hotline', 'hotlines', 'utility', 'utilities'],
    displayName: 'Utility Hotlines & Support'
  },
  {
    name: 'Academic',
    keywords: ['rectem', 'college', 'polytechnic', 'engineering', 'university', 'run', 'rcbc', 'bible college', 'theology', 'academic', 'school', 'schools', 'education', 'student', 'students', 'lecture', 'hostels'],
    displayName: 'Academic Institutions'
  },
  {
    name: 'Recreation',
    keywords: ['park', 'amusement', 'sport', 'sports', 'recreation', 'fun', 'game', 'games', 'play', 'kids', 'basketball', 'volleyball', 'tennis', 'ferris wheel', 'roller coaster', 'swimming', 'pool'],
    displayName: 'Recreation, Parks & Sports'
  },
  {
    name: 'History',
    keywords: ['history', 'background', 'origin', 'start', 'started', 'founded', 'founder', 'foundation', 'successor', 'expansion', 'growth', 'model parish', 'adeboye', 'akindayomi', 'general overseer'],
    displayName: 'RCCG & Redemption City History'
  },
  {
    name: 'Navigation',
    keywords: ['map', 'direction', 'directions', 'route', 'routes', 'where is', 'how to get to', 'find', 'locate', 'location', 'locations', 'exit', 'exits', 'gate', 'gates', 'altar', 'car park', 'parking'],
    displayName: 'Navigation & Facilities'
  },
  {
    name: 'Facilities',
    keywords: ['facility', 'facilities', 'market', 'canaanland', 'portal', 'post office', 'mail', 'post', 'secretariat', 'admin', 'office', 'offices', 'bookshop', 'book', 'books', 'auditorium', 'auditoriums', 'arena'],
    displayName: 'City Facilities & Infrastructure'
  }
];

const cleanText = (text: string): string => {
  return text.toLowerCase().replace(/[.,'":;?!\(\)]/g, ' ').replace(/\s+/g, ' ').trim();
};

const getEntryName = (response: string, keywords: string[]): string => {
  // Regex to match starting name followed by dynamic verbs
  const match = response.match(/^(.*?)\s+(is|are|operates|offers|houses|handles|positioned|hosts)\b/i);
  if (match && match[1]) {
    return match[1].replace(/^[📍\s*]+|[📍\s*]+$/g, '').trim();
  }
  
  if (keywords && keywords.length > 0) {
    const longestKeyword = keywords.reduce((a, b) => a.length > b.length ? a : b);
    return longestKeyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  
  return 'Location';
};

const getQueryCategory = (query: string): string | null => {
  const cleaned = cleanText(query);
  if (!cleaned) return null;

  let bestCategory: string | null = null;
  let maxMatches = 0;

  for (const cat of CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (cleaned.includes(kw)) {
        const wordRegex = new RegExp(`\\b${kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (wordRegex.test(cleaned)) {
          score += 2;
        } else {
          score += 0.5;
        }
      }
    }
    if (score > maxMatches) {
      maxMatches = score;
      bestCategory = cat.name;
    }
  }

  return bestCategory;
};

const isFollowUpQuery = (query: string): boolean => {
  const cleaned = cleanText(query);
  const followUpPhrases = [
    'any other', 'any others', 'more', 'others', 'another', 'another one', 
    'next', 'is there another', 'list more', 'show more', 'what else', 'else',
    'any more', 'more options', 'other options', 'give me more', 'need more'
  ];
  return followUpPhrases.some(phrase => cleaned === phrase || cleaned.startsWith(phrase + ' ') || cleaned.endsWith(' ' + phrase));
};

const getSpecificMatchScore = (query: string, keywords: string[]): number => {
  const cleanedQuery = cleanText(query);
  let score = 0;

  for (const keyword of keywords) {
    const cleanedKw = cleanText(keyword);
    if (!cleanedKw) continue;

    // Skip generic matching words unless they are a perfect match
    if (['bank', 'restaurant', 'hotel', 'hospital', 'school', 'park', 'wifi', 'exit', 'gate', 'altar'].includes(cleanedKw)) {
      if (cleanedQuery === cleanedKw) {
        score += 3;
      } else if (cleanedQuery.includes(cleanedKw)) {
        score += 0.2; // minimal score weight
      }
      continue;
    }

    if (cleanedQuery.includes(cleanedKw)) {
      if (cleanedQuery === cleanedKw) {
        score += 10;
      } else {
        const wordRegex = new RegExp(`\\b${cleanedKw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (wordRegex.test(cleanedQuery)) {
          score += cleanedKw.includes(' ') ? 6 : 4;
        } else {
          score += 1.5;
        }
      }
    }
  }

  return score;
};

const formatCategoryList = (categoryName: string, excludeName?: string): string => {
  const entries = knowledgeBase.filter(e => e.category.toLowerCase() === categoryName.toLowerCase());

  if (entries.length === 0) {
    return `I don't have any specific locations registered under the ${categoryName} category.`;
  }

  let filteredEntries = entries;
  if (excludeName) {
    const cleanExclude = cleanText(excludeName);
    filteredEntries = entries.filter(e => {
      const name = getEntryName(e.response, e.keywords);
      return cleanText(name) !== cleanExclude && !cleanText(name).includes(cleanExclude) && !cleanExclude.includes(cleanText(name));
    });
  }

  if (filteredEntries.length === 0) {
    if (excludeName) {
      return `That was the only registered option in the ${categoryName} category. Let me know if you need info on other facilities!`;
    }
    return `I don't have other locations registered under the ${categoryName} category.`;
  }

  const categoryConfig = CATEGORIES.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
  const categoryTitle = categoryConfig ? categoryConfig.displayName : categoryName;

  const header = excludeName 
    ? `Here are other options for **${categoryTitle}** in Redemption City:`
    : `Here are the options for **${categoryTitle}** in Redemption City:`;

  const listItems = filteredEntries.map(e => {
    const name = getEntryName(e.response, e.keywords);
    return `📍 **${name}**\n${e.response}`;
  });

  return `${header}\n\n${listItems.join('\n\n')}`;
};

export const processChatQuery = async (
  query: string, 
  userName: string = 'Guest', 
  history: ChatMessage[] = []
): Promise<ChatResponse> => {
  const normalizedQuery = query.toLowerCase().trim();
  const cleanedQuery = cleanText(query);
  const userFirstName = userName.split(' ')[0] || userName;
  
  // 1. Casual Conversational Intent Handler
  const casualIntents = [
    { keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'yo'], response: `Hello %name%! I am Enoch, your camp guide. How can I assist you today?`, category: 'greeting' },
    { keywords: ['how are you', 'how do you do', 'what is up', 'how far'], response: `I am functioning perfectly within Redemption City networks! How can I assist you today, %name%?`, category: 'how_are_you' },
    { keywords: ['what is your name', 'who are you', 'your name'], response: 'I am Enoch, your local AI guide for Redemption City.', category: 'bot_name' },
    { keywords: ['who made you', 'who created you', 'are you a robot', 'developer'], response: 'I am a digital AI assistant created to help you navigate and survive in Redemption City.', category: 'bot_creator' },
    { keywords: ['what can you do', 'help me', 'features'], response: 'I can give you directions, locate facilities, find medical help, list accommodations, and support emergency situations in Redemption City.', category: 'bot_functions' },
    { keywords: ['tell me a joke', 'make me laugh'], response: 'Why did the Christian cross the road? To get to the Old Auditorium faster! I am working on my humor databases.', category: 'joke' },
    { keywords: ['stupid', 'idiot', 'dumb', 'crazy'], response: 'I am doing my best to assist you! Please ask straightforward questions about Redemption City facilities or services.', category: 'insult' },
    { keywords: ['sos', 'emergency', 'help me', 'danger'], response: 'This sounds like an emergency. Please use the SOS button immediately or head to the Main Altar at coordinates (0,0).', category: 'emergency' }
  ];

  for (const intent of casualIntents) {
    if (intent.keywords.some(k => cleanedQuery.includes(k) || normalizedQuery.includes(k))) {
      return {
        text: intent.response.replace(/%name%/g, userFirstName),
        category: intent.category
      };
    }
  }

  // 2. Follow-Up Query Resolution (Memory-Aware)
  if (isFollowUpQuery(query) && history.length > 0) {
    let lastCategory: string | null = null;
    let lastMatchedEntryName: string | null = null;

    // Scan backwards to find the last categorized user prompt
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      if (msg.role === 'user') {
        const cat = getQueryCategory(msg.content);
        if (cat) {
          lastCategory = cat;
          
          // Check if there is an assistant response right after to extract the specific matched item
          const nextMsg = history[i + 1];
          if (nextMsg && nextMsg.role === 'assistant') {
            const content = nextMsg.content;
            const match = content.match(/^(?:📍\s+\*\*(.*?)\*\*|([^\n*]+?)\s+(?:is|are|operates|offers|houses|handles|positioned)\b)/i);
            if (match) {
              lastMatchedEntryName = (match[1] || match[2] || '').trim();
            }
          }
          break;
        }
      }
    }

    if (lastCategory) {
      // Find landmark ID for any follow-up if applicable
      let followUpLandmarkId: string | undefined = undefined;
      const entries = knowledgeBase.filter(e => e.category.toLowerCase() === lastCategory!.toLowerCase());
      if (entries.length === 1) {
        // If there's only one, we can map it
        for (const [key, id] of Object.entries(LANDMARK_MAPPINGS)) {
          if (entries[0].keywords.some((kw: string) => cleanText(kw).includes(key))) {
            followUpLandmarkId = id;
            break;
          }
        }
      }

      return {
        text: formatCategoryList(lastCategory, lastMatchedEntryName || undefined),
        category: lastCategory,
        landmarkId: followUpLandmarkId
      };
    }
  }

  // 3. Category Detection
  const queryCategory = getQueryCategory(query);

  // 4. Specific POI Entry Search
  let bestMatch = null;
  let highestScore = 0;

  for (const entry of knowledgeBase) {
    const score = getSpecificMatchScore(query, entry.keywords);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }

  // Resolve landmarkId if possible
  let landmarkId: string | undefined = undefined;
  for (const [key, id] of Object.entries(LANDMARK_MAPPINGS)) {
    if (cleanedQuery.includes(key) || (bestMatch && highestScore >= 4 && bestMatch.keywords.some((kw: string) => cleanText(kw).includes(key)))) {
      landmarkId = id;
      break;
    }
  }

  // If we have a highly confident specific POI match, serve it
  if (bestMatch && highestScore >= 4) {
    return {
      text: bestMatch.response.replace(/%name%/g, userFirstName),
      category: bestMatch.category,
      landmarkId: landmarkId
    };
  }

  // 5. General Category List Fallback
  if (queryCategory) {
    return {
      text: formatCategoryList(queryCategory),
      category: queryCategory,
      landmarkId: landmarkId
    };
  }

  // 6. Generic Fallback
  return {
    text: `I'm not quite sure I understand, ${userFirstName}. Could you rephrase that? You can ask me about locations, dining, guest suites, banking, or medical help.`,
    category: "System"
  };
};
