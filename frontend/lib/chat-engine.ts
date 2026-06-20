import knowledgeBase from './knowledge-base.json';

interface ChatResponse {
  text: string;
  category: string;
}

export const processChatQuery = async (query: string): Promise<ChatResponse> => {
  // Simulate processing delay for terminal feel
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 400));

  const lowerQuery = query.toLowerCase();

  // Keyword matching
  let bestMatch = null;
  let maxScore = 0;

  for (const entry of knowledgeBase) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (lowerQuery.includes(keyword)) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && maxScore > 0) {
    return {
      text: bestMatch.response,
      category: bestMatch.category,
    };
  }

  // Fallback
  return {
    text: "I cannot parse that query. Network is offline. Please stick to keywords regarding facilities, medical, or navigation.",
    category: "System",
  };
};
