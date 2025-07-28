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
    const { 
      text, 
      voiceDescription, 
      actingInstructions, 
      context, 
      numGenerations = 1,
      streaming = false,
      voiceStyle = 'warm-coach',
      contentType = 'lesson'
    }: HumeAudioRequest & { voiceStyle?: string; contentType?: string } = await req.json();
    
    if (!text) {
      throw new Error('Text is required for audio generation');
    }

    // Get the Hume API key from Supabase secrets
    const humeApiKey = Deno.env.get('HUME_API_KEY');
    if (!humeApiKey) {
      throw new Error('Hume API key not configured');
    }

    console.log('Generating audio with Hume Octave TTS for text length:', text.length);
    console.log('Voice description:', voiceDescription);
    console.log('Acting instructions:', actingInstructions);

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

    // Prepare the request body for Hume API
    const requestBody = {
      utterances: [{
        text: text,
        description: finalVoiceDescription || "Warm, professional coach with encouraging confidence"
      }],
      ...(context && { context: { generationId: context } }),
      numGenerations: Math.min(numGenerations, 5), // Hume allows max 5 generations
      format: 'wav' // Default to WAV format
    };

    console.log('Hume request body:', JSON.stringify(requestBody, null, 2));

    // Call Hume TTS API
    const response = await fetch('https://api.hume.ai/v1/tts/synthesize/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Hume-Api-Key': humeApiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hume API error details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        errorBody: errorText,
        requestUrl: 'https://api.hume.ai/v1/tts/synthesize/json',
        requestHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Hume-Api-Key': humeApiKey ? '[PRESENT]' : '[MISSING]',
        },
        requestBody: requestBody
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

    const result = await response.json();
    console.log('Hume API response received');

    // Extract the first generation's audio (base64 encoded)
    if (!result.generations || result.generations.length === 0) {
      throw new Error('No audio generations returned from Hume API');
    }

    const audioContent = result.generations[0].audio;
    const generationId = result.generations[0].generationId;

    console.log('Audio generation successful, generation ID:', generationId);

    return new Response(
      JSON.stringify({ 
        audioContent: audioContent,
        generationId: generationId,
        contentType: 'audio/wav',
        voiceUsed: finalVoiceDescription,
        actingInstructions: finalActingInstructions,
        generations: result.generations.length
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