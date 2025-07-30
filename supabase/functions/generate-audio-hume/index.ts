import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HumeAudioRequest {
  text: string;
  voiceDescription?: string;
  actingInstructions?: string;
  context?: string;
  numGenerations?: number;
  streaming?: boolean;
  sprintId?: string;
  savedVoiceId?: string;
}

// Define available voice personalities that users can choose from
const VOICE_STYLES = {
  'warm-coach': {
    description: "Warm, encouraging coach with steady confidence and patience. Speaks with gentle authority and supportive energy.",
    name: "Warm Coach"
  },
  'strong-mentor': {
    description: "Strong, assertive mentor with deep conviction and quiet strength. Delivers wisdom with confident presence.",
    name: "Strong Mentor"
  },
  'wise-guide': {
    description: "Wise, experienced guide with calm authority and profound understanding. Speaks with grounded confidence and transformational power.",
    name: "Wise Guide"
  },
  'motivational-speaker': {
    description: "Dynamic, motivational speaker with inspiring energy and passionate conviction. Speaks with enthusiasm and drive.",
    name: "Motivational Speaker"
  },
  'trusted-friend': {
    description: "Supportive, trusted friend with authentic warmth and understanding. Speaks with genuine care and relatability.",
    name: "Trusted Friend"
  },
  'professional-trainer': {
    description: "Professional, knowledgeable trainer with clear authority and practical wisdom. Speaks with competence and clarity.",
    name: "Professional Trainer"
  },
  'compassionate-counselor': {
    description: "Compassionate, empathetic counselor with gentle strength and healing presence. Speaks with deep understanding and safety.",
    name: "Compassionate Counselor"
  }
};

// Define acting instructions for different content types
const ACTING_INSTRUCTIONS = {
  lesson: "Clear and instructional with patient guidance, building understanding step by step",
  exercise: "Motivational and engaging, with encouraging energy that inspires action",
  affirmation: "Deeply confident and empowering, with conviction that builds inner strength",
  email: "Personal and conversational, like a trusted mentor speaking directly to you",
  challenge: "Motivational with gentle intensity, inspiring courage and growth"
};

function getVoiceStyle(styleKey: string): string {
  return VOICE_STYLES[styleKey as keyof typeof VOICE_STYLES]?.description || VOICE_STYLES['warm-coach'].description;
}

function getActingInstructions(contentType: string): string {
  return ACTING_INSTRUCTIONS[contentType as keyof typeof ACTING_INSTRUCTIONS] || ACTING_INSTRUCTIONS.lesson;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== HUME AUDIO GENERATION START ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    } catch (jsonError) {
      console.error('Failed to parse request JSON:', jsonError);
      throw new Error('Invalid JSON in request body');
    }

    const { 
      text, 
      voiceDescription, 
      actingInstructions, 
      context, 
      numGenerations = 1,
      streaming = false,
      voiceStyle = 'warm-coach',
      contentType = 'lesson',
      sprintId,
      savedVoiceId
    } = requestBody;
    
    console.log('Extracted parameters:', {
      textLength: text?.length || 0,
      voiceDescription: voiceDescription || 'undefined',
      actingInstructions: actingInstructions || 'undefined', 
      voiceStyle,
      contentType,
      context: context || 'undefined',
      numGenerations,
      streaming
    });
    
    if (!text) {
      console.error('No text provided in request');
      throw new Error('Text is required for audio generation');
    }

    // Get the Hume API key from Supabase secrets
    const humeApiKey = Deno.env.get('HUME_API_KEY');
    console.log('Hume API key status:', humeApiKey ? 'PRESENT' : 'MISSING');
    if (!humeApiKey) {
      console.error('HUME_API_KEY environment variable not found');
      throw new Error('Hume API key not configured');
    }

    console.log('Generating audio with Hume Octave TTS for text length:', text.length);
    console.log('Voice description:', voiceDescription);
    console.log('Acting instructions:', actingInstructions);
    console.log('Sprint ID:', sprintId);
    console.log('Saved voice ID:', savedVoiceId);

    // Use consistent voice style for the entire sprint
    let finalVoiceDescription = voiceDescription;
    if (!finalVoiceDescription) {
      finalVoiceDescription = getVoiceStyle(voiceStyle);
    }

    // Determine acting instructions based on content type or use custom
    let finalActingInstructions = actingInstructions;
    if (!finalActingInstructions) {
      finalActingInstructions = getActingInstructions(contentType);
    }

    // Combine voice description with acting instructions for better results
    const combinedDescription = `${finalVoiceDescription}. ${finalActingInstructions}`;
    
    console.log('Final voice description:', combinedDescription);

    let humeRequestBody: any;
    let isUsingExistingVoice = false;

    // Check if we have a saved voice ID for this sprint
    if (savedVoiceId) {
      console.log('Using existing saved voice:', savedVoiceId);
      isUsingExistingVoice = true;
      humeRequestBody = {
        utterances: [{
          text: text,
          voice: { id: savedVoiceId }
        }]
      };
    } else {
      console.log('Creating new voice from description');
      humeRequestBody = {
        utterances: [{
          text: text,
          description: combinedDescription
        }]
      };
    }

    console.log('Hume request body:', JSON.stringify(humeRequestBody, null, 2));

    // Use the JSON endpoint to get generation_id for voice saving
    const response = await fetch('https://api.hume.ai/v0/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hume-Api-Key': humeApiKey,
      },
      body: JSON.stringify(humeRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hume API error details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        errorBody: errorText,
        requestUrl: 'https://api.hume.ai/v0/tts',
        requestHeaders: {
          'Content-Type': 'application/json',
          'X-Hume-Api-Key': humeApiKey ? '[PRESENT]' : '[MISSING]',
        },
        requestBody: humeRequestBody
      });
      
      let errorMessage = `Hume API error: ${response.status} ${response.statusText}`;
      
      // Parse error details if available
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage = `Hume error: ${errorData.error}`;
        } else if (errorData.message) {
          errorMessage = `Hume error: ${errorData.message}`;
        } else if (errorData.detail) {
          errorMessage = `Hume error: ${errorData.detail}`;
        }
      } catch (parseError) {
        // If we can't parse the error, use the raw text
        if (errorText) {
          errorMessage += `: ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    // JSON endpoint returns structured data with generation info
    const responseData = await response.json();
    console.log('Hume API response received:', Object.keys(responseData));
    console.log('Full response structure:', JSON.stringify(responseData, null, 2));

    // Extract generation ID and audio base64 from the correct structure
    let generation_id = null;
    let audioBase64 = null;
    
    // Check the actual response structure - Hume returns audio as base64 in the audio field
    if (responseData.generations && Array.isArray(responseData.generations) && responseData.generations.length > 0) {
      const firstGeneration = responseData.generations[0];
      generation_id = firstGeneration.generation_id || firstGeneration.id;
      audioBase64 = firstGeneration.audio; // Audio is returned as base64, not URL
    } else {
      // Fallback for different response structures
      generation_id = responseData.generation_id || responseData.id;
      audioBase64 = responseData.audio;
    }
    
    console.log('Generation ID:', generation_id);
    console.log('Audio base64 length:', audioBase64?.length || 0);
    
    if (!audioBase64) {
      console.error('No audio base64 found in response:', responseData);
      throw new Error('Audio data not found in Hume API response');
    }

    // Audio is already in base64 format, no need to download
    console.log('Audio received as base64, length:', audioBase64.length);

    // If this is a new voice (not using savedVoiceId) and we have a sprintId, save the voice
    let newVoiceId = null;
    if (!isUsingExistingVoice && sprintId && generation_id) {
      try {
        console.log('Saving voice to library for sprint:', sprintId);
        const voiceName = `Sprint-${sprintId}-Voice`;
        
        const saveVoiceResponse = await fetch('https://api.hume.ai/v0/tts/voices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Hume-Api-Key': humeApiKey,
          },
          body: JSON.stringify({
            generation_id: generation_id,
            name: voiceName
          }),
        });

        if (saveVoiceResponse.ok) {
          const savedVoice = await saveVoiceResponse.json();
          newVoiceId = savedVoice.id;
          console.log('Voice saved successfully with ID:', newVoiceId);
        } else {
          const saveError = await saveVoiceResponse.text();
          console.warn('Failed to save voice:', saveError);
          // Continue anyway, don't fail the whole request
        }
      } catch (saveError) {
        console.warn('Error saving voice:', saveError);
        // Continue anyway, don't fail the whole request
      }
    }

    console.log('Audio generation successful, using Hume base64 data');

    return new Response(
      JSON.stringify({ 
        audioContent: audioBase64,
        contentType: 'audio/mp3', // Hume returns MP3 format
        voiceUsed: finalVoiceDescription,
        actingInstructions: finalActingInstructions,
        generationId: generation_id,
        newVoiceId: newVoiceId,
        isNewVoice: !isUsingExistingVoice
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