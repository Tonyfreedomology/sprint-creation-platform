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

    const { voiceName, voiceDescription, sampleText } = await req.json();
    
    if (!voiceName || !voiceDescription || !sampleText) {
      throw new Error('Voice name, description, and sample text are required');
    }

    console.log('Creating custom voice:', voiceName, 'with description:', voiceDescription);

    // Step 1: Generate TTS with the voice description to create a generation
    const ttsResponse = await fetch('https://api.hume.ai/v0/tts/synthesize-json', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': HUME_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        utterances: [{
          text: sampleText,
          voice: {
            description: voiceDescription
          }
        }]
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('Hume TTS generation error:', errorText);
      throw new Error(`Failed to generate TTS: ${ttsResponse.status} - ${errorText}`);
    }

    const ttsData = await ttsResponse.json();
    console.log('TTS generation successful:', ttsData);

    const generationId = ttsData.generations?.[0]?.generationId;
    
    if (!generationId) {
      throw new Error('No generation ID returned from TTS');
    }

    // Step 2: Save the voice using the generation ID
    const saveResponse = await fetch('https://api.hume.ai/v0/tts/voices', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': HUME_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        generation_id: generationId,
        name: voiceName
      }),
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.error('Hume voice save error:', errorText);
      throw new Error(`Failed to save voice: ${saveResponse.status} - ${errorText}`);
    }

    const voiceData = await saveResponse.json();
    console.log('Voice saved successfully:', voiceData);

    return new Response(JSON.stringify({
      success: true,
      voiceId: voiceData.id,
      voiceName: voiceData.name,
      generationId: generationId,
      message: 'Custom voice created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Voice creation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});