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
        output_format: 'mp3_22050_32', // Lower bitrate for faster processing
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
      console.error('ElevenLabs API error:', response.status, response.statusText, errorText);
      
      let errorMessage = `ElevenLabs API error: ${response.status} ${response.statusText}`;
      
      // Parse error details if available
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail) {
          if (errorData.detail.status === 'quota_exceeded') {
            errorMessage = `ElevenLabs quota exceeded. You need ${errorData.detail.message.match(/(\d+) credits are required/)?.[1] || 'more'} credits but only have ${errorData.detail.message.match(/You have (\d+) credits/)?.[1] || 'insufficient'} remaining. Please check your ElevenLabs account.`;
          } else if (errorData.detail.message) {
            errorMessage = `ElevenLabs error: ${errorData.detail.message}`;
          }
        }
      } catch (parseError) {
        // If we can't parse the error, use the raw text
        errorMessage += `: ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    // Get audio as array buffer and convert to base64 safely
    const audioBuffer = await response.arrayBuffer();
    console.log('Audio generated successfully, size:', audioBuffer.byteLength, 'bytes');

    // Convert to base64 in chunks to avoid stack overflow
    const uint8Array = new Uint8Array(audioBuffer);
    let binaryString = '';
    const chunkSize = 8192; // Process in smaller chunks
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const audioBase64 = btoa(binaryString);

    console.log('Base64 conversion completed, length:', audioBase64.length);

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