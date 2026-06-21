import knowledgeBase from './knowledge-base.json';

export interface ChatResponse {
  text: string;
  category: string;
}

export const processChatQuery = async (query: string, userName: string = 'Guest'): Promise<ChatResponse> => {
  const normalizedQuery = query.toLowerCase().trim();
  
  // 1. Check casual conversational intents first
  const casualIntents = [
    { keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening'], response: 'Hello %name%! I am Enoch, your camp guide. How can I assist you today?', category: 'greeting' },
    { keywords: ['how are you', 'how do you do', 'what is up'], response: 'I am functioning perfectly within Redemption City networks! How can I assist you today, %name%?', category: 'how_are_you' },
    { keywords: ['what is your name', 'who are you'], response: 'I am Enoch, your local AI guide for Redemption City.', category: 'bot_name' },
    { keywords: ['who made you', 'who created you', 'are you a robot'], response: 'I am a digital AI assistant created to help you navigate and survive in Redemption City.', category: 'bot_creator' },
    { keywords: ['what can you do', 'help me'], response: 'I can give you directions, locate facilities, find medical help, and assist you with emergency situations in Redemption City.', category: 'bot_functions' },
    { keywords: ['tell me a joke', 'make me laugh'], response: 'I am better at navigating Redemption City than telling jokes, but why did the Christian cross the road? To get to the Old Auditorium faster!', category: 'joke' },
    { keywords: ['stupid', 'idiot', 'dumb'], response: 'I am still learning! Please ask me straightforward questions about Redemption City locations and I will do my best to help.', category: 'insult' },
    { keywords: ['help', 'sos', 'emergency'], response: 'This sounds like an emergency. Please use the SOS button immediately or go to the Main Altar at (0,0).', category: 'emergency' }
  ];

  for (const intent of casualIntents) {
    if (intent.keywords.some(k => normalizedQuery.includes(k))) {
      return {
        text: intent.response.replace(/%name%/g, userName.split(' ')[0] || userName),
        category: intent.category
      };
    }
  }

  // 2. Search Knowledge Base using weighted keyword matching
  let bestMatch = null;
  let highestScore = 0;

  for (const entry of knowledgeBase) {
    let score = 0;
    
    // Check keywords array
    if (entry.keywords && Array.isArray(entry.keywords)) {
      for (const keyword of entry.keywords) {
        const kw = keyword.toLowerCase();
        if (normalizedQuery.includes(kw)) {
          score += 1;
          // Exact phrase matches get a huge boost
          if (normalizedQuery === kw) {
            score += 5;
          }
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && highestScore > 0) {
    return {
      text: bestMatch.response.replace(/%name%/g, userName.split(' ')[0] || userName),
      category: bestMatch.category
    };
  }

  // 3. Fallback Intent
  return {
    text: `I'm not quite sure I understand, ${userName.split(' ')[0] || userName}. Could you rephrase that? You can ask me about locations, facilities, or medical help.`,
    category: "System"
  };
};
