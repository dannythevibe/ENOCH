import knowledgeBase from './knowledge-base.json';
import { roadNodes } from './mock-data';

export interface ChatResponse {
  text: string;
  spokenText?: string;
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
  'dove guest house': 'dove',
  'yellow bus': 'yellow-bus',
  'yellow-bus': 'yellow-bus',
  'mimis': 'mimis',
  'mimi\'s restaurant': 'mimis',
  'mimi': 'mimis',
  'shalom restaurant': 'shalom',
  'shalom': 'shalom',
  'cherith restaurant': 'cherith',
  'cherith': 'cherith',
  'kings': 'kings',
  'king\'s restaurant': 'kings',
  'tantalizers': 'kings',
  'delta kitchen': 'delta-kitchen',
  'delta': 'delta-kitchen',
  'truly hospitable': 'truly-hospitable',
  'commercial banking district': 'banking-district',
  'banking district': 'banking-district',
  'gtbank': 'banking-district',
  'zenith bank': 'banking-district',
  'jubilee bank': 'banking-district'
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
    return match[1].replace(/^[\s*]+|[\s*]+$/g, '').trim();
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

const cleanDescription = (response: string, name: string): string => {
  const nameLower = name.toLowerCase();
  const responseLower = response.toLowerCase();
  
  if (responseLower.startsWith(nameLower)) {
    let remainder = response.slice(name.length).trim();
    if (remainder.startsWith(',') || remainder.startsWith('-') || remainder.startsWith(':') || remainder.startsWith('.')) {
      remainder = remainder.slice(1).trim();
    }
    if (remainder.length > 0) {
      remainder = remainder.charAt(0).toUpperCase() + remainder.slice(1);
    }
    return remainder;
  }
  return response;
};

const formatCategoryList = (categoryName: string, excludeName?: string): { text: string; spokenText: string } => {
  const entries = knowledgeBase.filter(e => e.category.toLowerCase() === categoryName.toLowerCase());

  if (entries.length === 0) {
    const msg = `I don't have any specific locations registered under the ${categoryName} category.`;
    return { text: msg, spokenText: msg };
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
      const msg = `That was the only registered option in the ${categoryName} category. Let me know if you need info on other facilities!`;
      return { text: msg, spokenText: msg };
    }
    const msg = `I don't have other locations registered under the ${categoryName} category.`;
    return { text: msg, spokenText: msg };
  }

  const categoryConfig = CATEGORIES.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
  const categoryTitle = categoryConfig ? categoryConfig.displayName : categoryName;

  const header = excludeName 
    ? `Here are other options for **${categoryTitle}** in Redemption City:`
    : `Here are the options for **${categoryTitle}** in Redemption City:`;

  const listItems = filteredEntries.map(e => {
    const name = getEntryName(e.response, e.keywords);
    const cleanDesc = cleanDescription(e.response, name);
    return `**${name}**\n${cleanDesc}`;
  });

  const text = `${header}\n\n${listItems.join('\n\n')}`;

  // Generate a conversational, highly summarized spoken summary
  const names = filteredEntries.map(e => getEntryName(e.response, e.keywords));
  const sampleNames = names.slice(0, 3);
  let sampleText = sampleNames.join(', ');
  if (sampleNames.length > 1) {
    const last = sampleNames[sampleNames.length - 1];
    sampleText = sampleNames.slice(0, -1).join(', ') + ' and ' + last;
  }

  let recommendation = "";
  if (categoryName.toLowerCase() === 'food') {
    recommendation = " Yellow Bus is highly popular for local street food.";
  } else if (categoryName.toLowerCase() === 'lodging') {
    recommendation = " Bethel Guest House is highly recommended.";
  } else if (categoryName.toLowerCase() === 'medical') {
    recommendation = " Redeemer's Health Centre is the primary hospital.";
  }

  const spokenText = `I found ${filteredEntries.length} options for ${categoryTitle} in Redemption City, including ${sampleText}.${recommendation} Which one would you like me to show you?`;

  return { text, spokenText };
};

const _processChatQuery = async (
  query: string, 
  userName: string = 'Guest', 
  history: ChatMessage[] = []
): Promise<ChatResponse> => {
  const normalizedQuery = query.toLowerCase().trim();
  const cleanedQuery = cleanText(query);
  const userFirstName = userName.split(' ')[0] || userName;

  // A. Detect "from X to Y" street routing query
  let sourceLandmarkId: string | undefined = undefined;
  let destLandmarkId: string | undefined = undefined;
  
  const routingMatch = normalizedQuery.match(/(?:from|between)\s+([a-zA-Z0-9\s'-]+?)\s+to\s+([a-zA-Z0-9\s'-]+)/i);
  if (routingMatch) {
    const fromPart = routingMatch[1].trim();
    const toPart = routingMatch[2].trim();

    for (const [key, id] of Object.entries(LANDMARK_MAPPINGS)) {
      if (fromPart === key || fromPart.includes(key) || key.includes(fromPart)) {
        sourceLandmarkId = id;
      }
      if (toPart === key || toPart.includes(key) || key.includes(toPart)) {
        destLandmarkId = id;
      }
    }
  }

  if (sourceLandmarkId && destLandmarkId) {
    const sourceNode = roadNodes.find(n => n.id === sourceLandmarkId);
    const destNode = roadNodes.find(n => n.id === destLandmarkId);
    if (sourceNode && destNode) {
      return {
        text: `I have calculated the street path from **${sourceNode.name}** to **${destNode.name}**. You can view the walking instructions and route details on the map: [Show Route](map:${sourceLandmarkId}->${destLandmarkId}).`,
        category: 'Navigation',
        landmarkId: `${sourceLandmarkId}->${destLandmarkId}`
      };
    }
  }

  // B. Specific POI Entry Search (High confidence POI mappings prioritized above casual chat)
  let bestMatch = null;
  let highestScore = 0;

  for (const entry of knowledgeBase) {
    let score = getSpecificMatchScore(query, entry.keywords);
    
    // Direct name match boost
    const name = getEntryName(entry.response, entry.keywords);
    const cleanedName = cleanText(name);
    if (cleanedQuery === cleanedName) {
      score += 15;
    } else if (cleanedQuery.includes(cleanedName) || cleanedName.includes(cleanedQuery)) {
      const wordRegex = new RegExp(`\\b${cleanedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (wordRegex.test(cleanedQuery)) {
        score += 8;
      }
    }

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

  if (bestMatch && highestScore >= 4) {
    return {
      text: bestMatch.response.replace(/%name%/g, userFirstName),
      category: bestMatch.category,
      landmarkId: landmarkId
    };
  }
  
  // C. Casual Conversational Intent Handler (Most specific prioritized first, strict word boundaries)
  const casualIntents = [
    {
      keywords: [
        'hi how are you doing today', 'hello how are you doing today', 'hey how are you doing today',
        'hi how are you doing', 'hello how are you doing', 'hey how are you doing',
        'hi how are you today', 'hello how are you today', 'hey how are you today',
        'hi how are you', 'hello how are you', 'hey how are you', 'yo how are you'
      ],
      response: `Hello %name%! I'm doing really well today, thanks for asking. How are you doing today? What can I help you find?`,
      category: 'greeting_how_are_you'
    },
    {
      keywords: [
        'how are you doing today', 'how are you today', 'how are you doing', 'how are you',
        'how is it going today', 'how is it going', 'how do you do', 'what is up', 'what\'s up',
        'how far', 'you okay'
      ],
      response: `I'm doing great, thanks for asking! How are you doing today, %name%?`,
      category: 'how_are_you'
    },
    {
      keywords: ['what is your name', 'who are you', 'your name', 'what are you called', 'who is this'],
      response: 'I\'m Enoch, your local camp guide. How is your day going?',
      category: 'bot_name'
    },
    {
      keywords: ['who made you', 'who created you', 'are you a robot', 'developer', 'who is your creator'],
      response: 'I\'m an AI assistant created to help you navigate and get around Redemption City.',
      category: 'bot_creator'
    },
    {
      keywords: ['what can you do', 'help me', 'features', 'what is your purpose', 'why are you here'],
      response: 'I can help you find walking directions on the map, look up food spots, guest houses, banking ATMs, or locate medical care. What are you looking to find?',
      category: 'bot_functions'
    },
    {
      keywords: ['tell me a joke', 'make me laugh'],
      response: 'Why did the Christian cross the road? To get to the Old Auditorium faster! I am working on my humor databases.',
      category: 'joke'
    },
    {
      keywords: ['stupid', 'idiot', 'dumb', 'crazy', 'shitty'],
      response: 'I am doing my best to assist you! Please ask straightforward questions about Redemption City facilities or services.',
      category: 'insult'
    },
    {
      keywords: ['sos', 'emergency', 'help me', 'danger'],
      response: 'This sounds like an emergency. Please use the SOS button immediately or head to the Main Altar.',
      category: 'emergency'
    },
    {
      keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'yo', 'greetings'],
      response: `Hey %name%! How's it going? What can I help you with today?`,
      category: 'greeting'
    }
  ];

  for (const intent of casualIntents) {
    if (intent.keywords.some(k => {
      if (cleanedQuery === k) return true;
      const wordRegex = new RegExp(`\\b${k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      return wordRegex.test(cleanedQuery);
    })) {
      return {
        text: intent.response.replace(/%name%/g, userFirstName),
        category: intent.category
      };
    }
  }

  // D. Follow-Up Query Resolution (Memory-Aware)
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
            const match = content.match(/^(?:\*\*(.*?)\*\*|([^\n*]+?)\s+(?:is|are|operates|offers|houses|handles|positioned)\b)/i);
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

      const formatted = formatCategoryList(lastCategory, lastMatchedEntryName || undefined);
      return {
        text: formatted.text,
        spokenText: formatted.spokenText,
        category: lastCategory,
        landmarkId: followUpLandmarkId
      };
    }
  }

  // E. Category Detection & Fallback
  const queryCategory = getQueryCategory(query);
  if (queryCategory) {
    const formatted = formatCategoryList(queryCategory);
    return {
      text: formatted.text,
      spokenText: formatted.spokenText,
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

export const processChatQuery = async (
  query: string,
  userName: string = 'Guest',
  history: ChatMessage[] = []
): Promise<ChatResponse> => {
  const response = await _processChatQuery(query, userName, history);
  // Strip any emoji characters from the output text to keep responses strictly clean
  const cleanText = response.text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
  const cleanSpoken = response.spokenText ? response.spokenText.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '') : undefined;
  return {
    ...response,
    text: cleanText,
    spokenText: cleanSpoken
  };
};
