import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = await req.json(); // Default to Sarah voice
    
    if (!text) {
      throw new Error('Text is required for audio generation');
    }

    // Get the ElevenLabs API key from Supabase secrets
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    console.log('Generating audio with ElevenLabs for text length:', text.length);

    // Call ElevenLabs Text-to-Speech API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, response.statusText, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    // Convert audio to base64
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    console.log('Audio generated successfully, size:', audioBuffer.byteLength, 'bytes');

    return new Response(
      JSON.stringify({ 
        audioContent: audioBase64,
        contentType: 'audio/mpeg'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Audio generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});