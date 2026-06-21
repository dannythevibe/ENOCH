import { NlpManager } from 'node-nlp';
import knowledgeBase from './knowledge-base.json';

// We must create the NLP manager. 
// Since we are running in the browser, we use a basic configuration.
const manager = new NlpManager({ languages: ['en'], forceNER: true, nlu: { log: false } });

let isTrained = false;

const trainModel = async () => {
  if (isTrained) return;
  
  // Train intents from knowledge base
  for (const entry of knowledgeBase) {
    for (const keyword of entry.keywords) {
      // Create simple utterances from keywords
      manager.addDocument('en', keyword, entry.category);
      manager.addDocument('en', `where is ${keyword}`, entry.category);
      manager.addDocument('en', `I need ${keyword}`, entry.category);
    }
    manager.addAnswer('en', entry.category, entry.response);
  }

  // Add casual chat / conversation intents
  manager.addDocument('en', 'hello', 'greeting');
  manager.addDocument('en', 'hi', 'greeting');
  manager.addDocument('en', 'good morning', 'greeting');
  manager.addDocument('en', 'good evening', 'greeting');
  manager.addDocument('en', 'hey', 'greeting');
  manager.addAnswer('en', 'greeting', 'Hello %name%! I am Enoch, your camp guide. How can I assist you today?');

  manager.addDocument('en', 'how are you', 'how_are_you');
  manager.addDocument('en', 'how do you do', 'how_are_you');
  manager.addDocument('en', 'what is up', 'how_are_you');
  manager.addAnswer('en', 'how_are_you', 'I am functioning perfectly within Redemption City networks! How can I assist you today, %name%?');

  manager.addDocument('en', 'what is your name', 'bot_name');
  manager.addDocument('en', 'who are you', 'bot_name');
  manager.addAnswer('en', 'bot_name', 'I am Enoch, your local AI guide for Redemption City.');

  manager.addDocument('en', 'who made you', 'bot_creator');
  manager.addDocument('en', 'who created you', 'bot_creator');
  manager.addDocument('en', 'are you a robot', 'bot_creator');
  manager.addAnswer('en', 'bot_creator', 'I am a digital AI assistant created to help you navigate and survive in Redemption City.');

  manager.addDocument('en', 'what can you do', 'bot_functions');
  manager.addDocument('en', 'help me', 'bot_functions');
  manager.addAnswer('en', 'bot_functions', 'I can give you directions, locate facilities, find medical help, and assist you with emergency situations in Redemption City.');

  manager.addDocument('en', 'tell me a joke', 'joke');
  manager.addDocument('en', 'make me laugh', 'joke');
  manager.addAnswer('en', 'joke', 'I am better at navigating Redemption City than telling jokes, but why did the Christian cross the road? To get to the Old Auditorium faster!');

  manager.addDocument('en', 'stupid', 'insult');
  manager.addDocument('en', 'idiot', 'insult');
  manager.addDocument('en', 'dumb', 'insult');
  manager.addAnswer('en', 'insult', 'I am still learning! Please ask me straightforward questions about Redemption City locations and I will do my best to help.');

  manager.addDocument('en', 'help', 'emergency');
  manager.addDocument('en', 'sos', 'emergency');
  manager.addDocument('en', 'emergency', 'emergency');
  manager.addAnswer('en', 'emergency', 'This sounds like an emergency. Please use the SOS button immediately or go to the Main Altar at (0,0).');

  await manager.train();
  isTrained = true;
};

export interface ChatResponse {
  text: string;
  category: string;
}

export const processChatQuery = async (query: string, userName: string = 'Guest'): Promise<ChatResponse> => {
  await trainModel();
  
  const response = await manager.process('en', query);
  
  if (response.intent === 'None' || response.score < 0.5) {
    return {
      text: `I'm not quite sure I understand, ${userName}. Could you rephrase that? You can ask me about locations, facilities, or medical help.`,
      category: "System"
    };
  }

  const answer = response.answer || "I understand what you mean, but I don't have a specific answer for that.";
  
  // Personalize the answer
  const personalizedAnswer = answer.replace(/%name%/g, userName.split(' ')[0] || userName);

  return {
    text: personalizedAnswer,
    category: response.intent
  };
};
