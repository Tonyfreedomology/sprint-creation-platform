import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ElevenLabsAudioRequest {
  text: string;
  voiceId?: string;
  voiceStyle?: string;
  contentType?: string;
  sprintId?: string;
}

// Voice style to ElevenLabs voice ID mapping
const VOICE_STYLE_MAPPING: Record<string, { voiceId: string; description: string }> = {
  'warm-coach': { voiceId: 'EXAVITQu4vr4xnSDxMaL', description: 'Sarah - Warm, encouraging voice' },
  'strong-mentor': { voiceId: 'TX3LPaxmHKxFdv7VOQHJ', description: 'Liam - Strong, confident voice' },
  'wise-guide': { voiceId: 'onwK4e9ZLuTAKqWW03F9', description: 'Daniel - Wise, calm voice' },
  'motivational-speaker': { voiceId: 'cjVigY5qzO86Huf0OWal', description: 'Eric - Dynamic, inspiring voice' },
  'trusted-friend': { voiceId: 'XB0fDUnXU5powFXDhCwa', description: 'Charlotte - Warm, relatable voice' },
  'professional-trainer': { voiceId: 'nPczCjzI2devNBz1zQrb', description: 'Brian - Clear, professional voice' },
  'compassionate-counselor': { voiceId: 'cgSgspJ2msm6clMCkdW9', description: 'Jessica - Gentle, compassionate voice' },
};

// Default voices by gender
const DEFAULT_VOICES = {
  male: 'TX3LPaxmHKxFdv7VOQHJ', // Liam
  female: 'EXAVITQu4vr4xnSDxMaL', // Sarah
};

function getVoiceId(voiceStyle?: string, savedVoiceId?: string): string {
  // If we have a saved voice ID (from voice cloning), use that
  if (savedVoiceId) {
    return savedVoiceId;
  }
  
  // If we have a voice style, map it to an ElevenLabs voice
  if (voiceStyle && VOICE_STYLE_MAPPING[voiceStyle]) {
    return VOICE_STYLE_MAPPING[voiceStyle].voiceId;
  }
  
  // Default to Sarah (warm female voice)
  return DEFAULT_VOICES.female;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const { text, voiceId, voiceStyle, contentType, sprintId }: ElevenLabsAudioRequest = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    console.log('Generating audio with ElevenLabs:', { 
      textLength: text.length, 
      voiceStyle, 
      contentType,
      customVoiceId: voiceId,
      sprintId 
    });

    // Determine which voice to use
    const selectedVoiceId = voiceId || getVoiceId(voiceStyle);
    
    console.log('Using voice ID:', selectedVoiceId);

    // Call ElevenLabs Text-to-Speech API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS error:', errorText);
      throw new Error(`Failed to generate audio: ${response.status} - ${errorText}`);
    }

    // Convert audio response to base64 (handle large files properly)
    const audioBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(audioBuffer);
    let base64Audio = '';
    
    // Convert in chunks to avoid stack overflow for large files
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      base64Audio += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
    }
    
    console.log('Audio generated successfully, size:', audioBuffer.byteLength);

    return new Response(JSON.stringify({
      success: true,
      audioContent: base64Audio,
      contentType: 'audio/mpeg',
      voiceId: selectedVoiceId,
      message: 'Audio generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Audio generation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});