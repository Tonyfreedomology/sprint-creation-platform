import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const formData = await req.formData();
    const voiceName = formData.get('voiceName') as string;
    const audioFile = formData.get('audioFile') as File;
    
    if (!voiceName || !audioFile) {
      throw new Error('Voice name and audio file are required');
    }

    console.log('Creating voice clone:', voiceName, 'with audio file:', audioFile.name);

    // Create form data for ElevenLabs API
    const elevenlabsFormData = new FormData();
    elevenlabsFormData.append('name', voiceName);
    elevenlabsFormData.append('files', audioFile);

    // Call ElevenLabs IVC (Instant Voice Cloning) API
    const response = await fetch('https://api.elevenlabs.io/v1/voices/ivc/create', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: elevenlabsFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs voice cloning error:', errorText);
      throw new Error(`Failed to create voice clone: ${response.status} - ${errorText}`);
    }

    const voiceData = await response.json();
    console.log('Voice clone created successfully:', voiceData);

    return new Response(JSON.stringify({
      success: true,
      voiceId: voiceData.voice_id,
      voiceName: voiceData.name,
      message: 'Voice clone created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Voice cloning error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});