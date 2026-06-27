import { NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgfrMMUzDzjG'; // Adam premium male voice

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');

    if (!text) {
      return NextResponse.json({ message: 'Text is required' }, { status: 400 });
    }

    if (!ELEVENLABS_API_KEY) {
      console.warn('ELEVENLABS_API_KEY environment secret is not configured. Falling back to local offline Speech Synthesis.');
      return new NextResponse('API Key Not Configured', { status: 503 });
    }

    // Call ElevenLabs TTS API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'accept': 'audio/mpeg',
          'xi-api-key': ELEVENLABS_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.50, // Lower stability makes the voice significantly more expressive, emotional, and conversational
            similarity_boost: 0.80,
            style: 0.15,
            use_speaker_boost: true
          }
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('ElevenLabs API returned error:', errText);
      return new NextResponse('ElevenLabs API Error', { status: 503 });
    }

    // Stream audio buffer back to client
    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('TTS proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
