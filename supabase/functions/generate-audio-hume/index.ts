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

interface HumeVoicePersonality {
  foundation: string;        // Days 1-7
  leadership: string;        // Days 8-14
  mastery: string;          // Days 15-21
}

// Define voice personalities for different phases of the coaching journey
const VOICE_PERSONALITIES: HumeVoicePersonality = {
  foundation: "Warm, encouraging coach with steady confidence and patience. Speaks with gentle authority and supportive energy.",
  leadership: "Strong, assertive mentor with deep conviction and quiet strength. Delivers wisdom with confident presence.",
  mastery: "Wise, experienced guide with calm authority and profound understanding. Speaks with grounded confidence and transformational power."
};

// Define acting instructions for different content types
const ACTING_INSTRUCTIONS = {
  lesson: "Clear and instructional with patient guidance, building understanding step by step",
  exercise: "Motivational and engaging, with encouraging energy that inspires action",
  affirmation: "Deeply confident and empowering, with conviction that builds inner strength",
  email: "Personal and conversational, like a trusted mentor speaking directly to you",
  challenge: "Motivational with gentle intensity, inspiring courage and growth"
};

function getVoiceForDay(day: number): string {
  if (day <= 7) return VOICE_PERSONALITIES.foundation;
  if (day <= 14) return VOICE_PERSONALITIES.leadership;
  return VOICE_PERSONALITIES.mastery;
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
      day,
      contentType = 'lesson'
    }: HumeAudioRequest & { day?: number; contentType?: string } = await req.json();
    
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

    // Determine voice personality based on day or use custom description
    let finalVoiceDescription = voiceDescription;
    if (!finalVoiceDescription && day) {
      finalVoiceDescription = getVoiceForDay(day);
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
        description: finalVoiceDescription || "Warm, professional coach with encouraging confidence",
        ...(finalActingInstructions && { actingInstructions: finalActingInstructions })
      }],
      ...(context && { context: { generationId: context } }),
      numGenerations: Math.min(numGenerations, 5), // Hume allows max 5 generations
      format: 'wav' // Default to WAV format
    };

    console.log('Hume request body:', JSON.stringify(requestBody, null, 2));

    // Call Hume TTS API
    const response = await fetch('https://api.hume.ai/v0/tts/synthesize', {
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
      console.error('Hume API error:', response.status, response.statusText, errorText);
      
      let errorMessage = `Hume API error: ${response.status} ${response.statusText}`;
      
      // Parse error details if available
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage = `Hume error: ${errorData.error}`;
        } else if (errorData.message) {
          errorMessage = `Hume error: ${errorData.message}`;
        }
      } catch (parseError) {
        // If we can't parse the error, use the raw text
        errorMessage += `: ${errorText}`;
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