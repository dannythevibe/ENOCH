// Global variable to keep track of active audio players to prevent overlapping speech
let activeAudio: HTMLAudioElement | null = null;

// Stop any currently playing audio stream or speech synthesis
export function stopSpeech(): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// Scoring helper to select the most natural sounding local system male voice
function getVoiceScore(name: string): number {
  const lowercaseName = name.toLowerCase();
  let score = 0;
  
  // We explicitly want a MALE voice. Let's look for male indicators.
  const isMaleName = 
    lowercaseName.includes('david') || 
    lowercaseName.includes('guy') || 
    lowercaseName.includes('george') || 
    lowercaseName.includes('mark') || 
    lowercaseName.includes('richard') || 
    lowercaseName.includes('daniel') || 
    lowercaseName.includes('male') || 
    (lowercaseName.includes('google') && lowercaseName.includes('male')) ||
    lowercaseName.includes('james');

  const isFemaleName = 
    lowercaseName.includes('zira') || 
    lowercaseName.includes('samantha') || 
    lowercaseName.includes('jenny') || 
    lowercaseName.includes('hazel') || 
    lowercaseName.includes('susan') || 
    lowercaseName.includes('female') ||
    lowercaseName.includes('karen') ||
    lowercaseName.includes('heera') ||
    lowercaseName.includes('haruka');

  if (isMaleName) {
    score += 200; // Strong bonus for male voices
  }
  if (isFemaleName) {
    score -= 300; // Penalize female voices
  }

  // Weight for neural/natural features
  if (lowercaseName.includes('natural')) score += 50;
  if (lowercaseName.includes('neural')) score += 40;
  
  // Specific premium system voice models
  if (lowercaseName.includes('david')) score += 80;
  if (lowercaseName.includes('guy')) score += 70;
  if (lowercaseName.includes('george')) score += 60;
  if (lowercaseName.includes('mark')) score += 50;
  if (lowercaseName.includes('google')) score += 30;
  
  return score;
}

// Fetch the best available local English voice
function selectBestLocalVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  
  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
  
  if (englishVoices.length === 0) return null;
  
  // Sort English voices by their natural score descending
  const sorted = [...englishVoices].sort((a, b) => {
    return getVoiceScore(b.name) - getVoiceScore(a.name);
  });
  
  return sorted[0];
}

// Speak using native browser Web Speech Synthesis
function speakLocally(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any active speech
  window.speechSynthesis.cancel();

  // Strip Markdown markers like asterisks or brackets to prevent speaking formatting characters
  const cleanText = text.replace(/[*#_\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const bestVoice = selectBestLocalVoice();
  
  if (bestVoice) {
    utterance.voice = bestVoice;
    console.log(`Enoch using offline natural voice: ${bestVoice.name}`);
  } else {
    console.log('Enoch using default system offline voice');
  }

  // Adjust parameters for a warmer, deeper masculine tone
  utterance.rate = 0.98; // Natural conversational rate
  utterance.pitch = 0.90; // Lower pitch gives David a much richer, warmer resonance
  
  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.error('SpeechSynthesis error:', e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

let isElevenLabsAvailable: boolean | null = null;

// Primary speech entry point (Hybrid: ElevenLabs -> Local Synthesis)
export async function speakText(text: string, onStart?: () => void, onEnd?: () => void): Promise<void> {
  stopSpeech();
  
  if (onStart) onStart();

  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

  if (isOnline && isElevenLabsAvailable !== false) {
    let timeoutId: any = null;
    try {
      const controller = new AbortController();
      // Set an 800ms connection timeout to prevent UI hang/glitching
      timeoutId = setTimeout(() => controller.abort(), 800);
      
      const checkUrl = `/api/tts?text=${encodeURIComponent(text)}`;
      const res = await fetch(checkUrl, { signal: controller.signal });
      if (timeoutId) clearTimeout(timeoutId);

      if (res.ok) {
        isElevenLabsAvailable = true;
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        activeAudio = audio;
        
        audio.onended = () => {
          if (activeAudio === audio) activeAudio = null;
          URL.revokeObjectURL(audioUrl); // release memory
          if (onEnd) onEnd();
        };
        
        audio.onerror = (err) => {
          console.warn('ElevenLabs audio play error, falling back to local speech:', err);
          if (activeAudio === audio) activeAudio = null;
          URL.revokeObjectURL(audioUrl);
          speakLocally(text, onEnd);
        };

        await audio.play();
        console.log('Enoch speaking via ElevenLabs natural cloud voice');
        return;
      } else {
        console.warn(`ElevenLabs status ${res.status}. Falling back to local speech.`);
        isElevenLabsAvailable = false; // Cache failure so subsequent clicks respond instantly
      }
    } catch (e) {
      console.warn('ElevenLabs connection failed or timed out. Falling back to local speech:', e);
      isElevenLabsAvailable = false; // Cache failure
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  // Fallback to offline speech synthesis
  speakLocally(text, onEnd);
}
