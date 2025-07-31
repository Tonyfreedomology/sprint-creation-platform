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
    const HUME_API_KEY = Deno.env.get('HUME_API_KEY');
    if (!HUME_API_KEY) {
      throw new Error('HUME_API_KEY is not configured');
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const voiceName = formData.get('voiceName') as string;
    
    if (!audioFile) {
      throw new Error('No audio file provided');
    }

    console.log('Creating voice clone for:', voiceName, 'with file size:', audioFile.size);

    // Step 1: Create the voice clone with Hume
    const cloneResponse = await fetch('https://api.hume.ai/v0/evi/voices', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': HUME_API_KEY,
      },
      body: (() => {
        const cloneFormData = new FormData();
        cloneFormData.append('file', audioFile);
        cloneFormData.append('name', voiceName || `Voice_${Date.now()}`);
        return cloneFormData;
      })(),
    });

    if (!cloneResponse.ok) {
      const errorText = await cloneResponse.text();
      console.error('Hume voice clone error:', errorText);
      throw new Error(`Failed to create voice clone: ${cloneResponse.status} - ${errorText}`);
    }

    const cloneData = await cloneResponse.json();
    console.log('Voice clone created successfully:', cloneData);

    // The response should contain the voice ID
    const voiceId = cloneData.id;
    
    if (!voiceId) {
      throw new Error('No voice ID returned from Hume');
    }

    return new Response(JSON.stringify({
      success: true,
      voiceId: voiceId,
      voiceName: cloneData.name || voiceName,
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