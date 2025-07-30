import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SprintFormData {
  creatorName: string;
  creatorEmail: string;
  creatorBio: string;
  sprintTitle: string;
  sprintDescription: string;
  sprintDuration: string;
  sprintCategory: string;
  targetAudience: string;
  contentGeneration: string;
  contentTypes: string[];
  toneStyle: string;
  experience: string;
  goals: string;
  specialRequirements: string;
  voiceId: string;
  participantEmails: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

function cleanAndParseJSON(response: string): any {
  // Check for truncation first - if response doesn't end with } it's likely truncated
  const trimmed = response.trim();
  if (!trimmed.endsWith('}')) {
    console.log('Response appears truncated, does not end with }');
    throw new Error(`Response appears truncated: ${trimmed.substring(trimmed.length - 100)}`);
  }

  // Strategy 1: Try direct parsing first
  try {
    return JSON.parse(response);
  } catch (e) {
    console.log('Direct JSON parse failed, trying cleanup strategies');
  }

  // Strategy 2: Remove markdown code blocks and extra formatting
  let cleaned = response
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .replace(/^\s*[\r\n]/gm, '') // Remove empty lines
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('Cleaned JSON parse failed, trying regex extraction');
  }

  // Strategy 3: Extract JSON using regex
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.log('Regex extracted JSON parse failed');
    }
  }

  // Strategy 4: More aggressive cleaning
  const aggressiveCleaned = response
    .replace(/[^\x20-\x7E\s]/g, '') // Remove non-printable chars
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .trim();
    
  const aggressiveMatch = aggressiveCleaned.match(/\{[\s\S]*\}/);
  if (aggressiveMatch) {
    try {
      return JSON.parse(aggressiveMatch[0]);
    } catch (e) {
      console.log('Aggressive cleaning failed');
    }
  }

  throw new Error(`Failed to parse JSON after all strategies. Response: ${response.substring(0, 500)}...`);
}

async function generateCompletion(prompt: string, apiKey: string, maxTokens: number = 2000): Promise<string> {
  console.log('Making OpenAI request with prompt length:', prompt.length);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a content generation expert. CRITICAL: Your response must be valid JSON only, no markdown formatting, no code blocks, no extra text. Return only the JSON object exactly as specified.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, response.statusText, errorText);
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: OpenAIResponse = await response.json();
  console.log('OpenAI response received, content length:', data.choices[0]?.message?.content?.length || 0);
  return data.choices[0]?.message?.content || '';
}

async function generateDailyScript(
  sprintTheme: string,
  day: number,
  duration: number,
  personalizationData: string,
  teachingGoals: string,
  apiKey: string,
  masterPlan?: any
): Promise<any> {
  const dayPlan = masterPlan?.dailyPlans?.find((plan: any) => plan.day === day);
  const previousDayPlan = masterPlan?.dailyPlans?.find((plan: any) => plan.day === day - 1);
  const nextDayPlan = masterPlan?.dailyPlans?.find((plan: any) => plan.day === day + 1);

  const prompt = `You are an expert life coach and content creator. Generate a comprehensive, flowing audio lesson script for day ${day} of ${duration} of a sprint called "${sprintTheme}".

Context:
- Sprint Theme: ${sprintTheme}
- Day: ${day} of ${duration}
- Teaching Goals: ${teachingGoals}
- Personalization: ${personalizationData}
${dayPlan ? `- Today's Theme: ${dayPlan.theme}
- Learning Objective: ${dayPlan.learningObjective}
- Key Takeaways: ${dayPlan.keyTakeaways?.join(', ')}
- Connection to Previous Day: ${dayPlan.connectionToPrevious}
- Connection to Next Day: ${dayPlan.connectionToNext}` : ''}

CRITICAL: Ensure this lesson is completely unique and non-repetitive. Each day must offer distinctly different insights, examples, and exercises. Reference the connections to other days to maintain flow while ensuring content uniqueness.

Create a cohesive 4-5 minute audio script that naturally weaves together:
- Opening welcome and context setting for the day (reference where this fits in the journey)
- Core lesson content with fresh stories, unique examples, and specific practical insights (4-5 detailed paragraphs)
- Seamlessly introduce the daily challenge: "Your exercise for today is..."
- Naturally conclude with the affirmation: "I want you to repeat this powerful affirmation..." or "Today's affirmation is..."

The script should flow as one continuous narrative for audio delivery, not separate sections. Make it conversational, engaging, and actionable. Include specific real-world examples and practical steps that are unique to this day's theme.

Output as JSON in this exact format:
{
  "day": ${day},
  "title": "Day ${day}: [Compelling Title based on today's unique theme]",
  "content": "[Complete flowing audio script that includes lesson, exercise introduction, and affirmation guidance - all woven together naturally for audio delivery]",
  "exercise": "[The specific exercise/challenge mentioned in the script]",
  "affirmation": "[The affirmation statement mentioned in the script]"
}`;

  console.log(`Generating daily script for day ${day}`);
  const response = await generateCompletion(prompt, apiKey, 4000);
  console.log('Raw OpenAI response for daily script:', response);
  
  try {
    return cleanAndParseJSON(response);
  } catch (error) {
    console.error('Failed to parse OpenAI response for daily script:', response);
    console.error('Parse error:', error);
    throw new Error(`Invalid JSON response from OpenAI for daily script: ${error.message}`);
  }
}

async function generateDailyEmail(
  sprintTheme: string,
  day: number,
  dailyScript: any,
  emailStyle: string,
  creatorName: string,
  apiKey: string
): Promise<any> {
  const prompt = `You are an expert email copywriter in the style of Jeff Walker - personal, casual, and compelling. Create a short, engaging email for day ${day} of the "${sprintTheme}" sprint.

Context:
- Sprint Theme: ${sprintTheme}
- Day: ${day}
- Creator Name: ${creatorName}
- Daily Lesson: ${JSON.stringify(dailyScript)}

Email Requirements:
- Start with "Hey {{contact.firstname}}," 
- Keep it SHORT - like a mini version of today's lesson
- Write in Jeff Walker style: personal, casual, story-driven copywriting
- Create a subject line optimized for high open rates (curious, benefit-driven, not sensational)
- First sentence must be compelling enough to keep them reading (without being sensational)
- Include today's key insight in a conversational way
- Include today's challenge/exercise
- Include today's affirmation
- End with a clear call-to-action: "Click here to listen to today's lesson" with a link placeholder
- Use proper markdown formatting (**bold** for emphasis, not asterisks)
- Keep total length under 150 words

Subject Line Guidelines:
- Curiosity-driven without being clickbait
- Benefit-focused
- Personal and conversational
- 6-8 words max
- Examples: "The thing nobody tells you...", "Your Day ${day} breakthrough", "This changes everything..."

Output as JSON in this exact format:
{
  "subject": "[Compelling subject line optimized for CTR - 6-8 words max]",
  "content": "[Short, personal email starting with Hey {{contact.firstname}}, including key insight, exercise, affirmation, and CTA link - under 150 words total with proper markdown formatting]"
}`;

  console.log(`Generating daily email for day ${day}`);
  const response = await generateCompletion(prompt, apiKey, 1200);
  console.log('Raw OpenAI response for daily email:', response);
  
  try {
    return cleanAndParseJSON(response);
  } catch (error) {
    console.error('Failed to parse OpenAI response for daily email:', response);
    console.error('Parse error:', error);
    throw new Error(`Invalid JSON response from OpenAI for daily email: ${error.message}`);
  }
}

async function handleRegeneration(regenerateDay: number, formData: SprintFormData, masterPlan: any, channelName: string) {
  console.log(`Handling regeneration for day ${regenerateDay}`);
  
  // Get API keys from environment
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!openaiApiKey || !supabaseUrl || !supabaseServiceKey) {
    throw new Error('Required API keys not configured');
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const duration = parseInt(formData.sprintDuration);
  const personalizationData = `Target Audience: ${formData.targetAudience}. Experience Level: ${formData.experience}. Content Types: ${formData.contentTypes.join(', ')}. Special Requirements: ${formData.specialRequirements}`;

  try {
    // Generate daily script
    const dailyScript = await generateDailyScript(
      formData.sprintTitle,
      regenerateDay,
      duration,
      personalizationData,
      formData.goals,
      openaiApiKey,
      masterPlan
    );

    // Small delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate daily email
    const dailyEmail = await generateDailyEmail(
      formData.sprintTitle,
      regenerateDay,
      dailyScript,
      formData.toneStyle,
      formData.creatorName,
      openaiApiKey
    );

    const email = {
      day: regenerateDay,
      subject: dailyEmail.subject,
      content: dailyEmail.content
    };

    // Broadcast the regenerated lesson
    const channel = supabase.channel(channelName);
    await channel.send({
      type: 'broadcast',
      event: 'lesson-generated',
      payload: {
        lesson: dailyScript,
        email: email
      }
    });

    console.log(`Regenerated and broadcasted day ${regenerateDay} at ${new Date().toISOString()}`);

    return new Response(
      JSON.stringify({ 
        message: 'Regeneration completed',
        day: regenerateDay,
        lesson: dailyScript,
        email: email
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`CRITICAL ERROR regenerating content for day ${regenerateDay}:`, error);
    throw error;
  }
}

serve(async (req) => {
  console.log('Batch sprint generation function called with method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body received');
    const { progressId, batchSize = 4, regenerateDay, formData, masterPlan, channelName } = requestBody;
    
    // Handle regeneration request differently
    if (regenerateDay && formData && masterPlan) {
      return await handleRegeneration(regenerateDay, formData, masterPlan, channelName);
    }
    
    // Get API keys from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('API keys available:', {
      openai: !!openaiApiKey,
      supabase: !!supabaseUrl && !!supabaseServiceKey
    });
    
    if (!openaiApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Required API keys not configured');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get generation progress from database
    const { data: progress, error: progressError } = await supabase
      .from('sprint_generation_progress')
      .select('*')
      .eq('id', progressId)
      .single();

    if (progressError) {
      console.error('Error fetching progress:', progressError);
      throw new Error(`Failed to fetch progress: ${progressError.message}`);
    }

    if (!progress) {
      throw new Error('Progress record not found');
    }

    console.log(`Processing batch generation for sprint: ${progress.sprint_id}, starting from day ${progress.current_day}`);

    const sprintData = progress.form_data as SprintFormData;
    const duration = parseInt(sprintData.sprintDuration);
    const personalizationData = `Target Audience: ${sprintData.targetAudience}. Experience Level: ${sprintData.experience}. Content Types: ${sprintData.contentTypes.join(', ')}. Special Requirements: ${sprintData.specialRequirements}`;

    // Update status to generating
    await supabase
      .from('sprint_generation_progress')
      .update({ status: 'generating' })
      .eq('id', progressId);

    // Calculate batch range
    const startDay = progress.current_day;
    const endDay = Math.min(startDay + batchSize - 1, progress.total_days);
    const generatedLessons = [];

    console.log(`Generating batch: days ${startDay} to ${endDay}`);

    // Generate content for this batch
    for (let day = startDay; day <= endDay; day++) {
      console.log(`Starting generation for day ${day} at ${new Date().toISOString()}`);
      
      try {
        // Generate daily script
        const dailyScript = await generateDailyScript(
          sprintData.sprintTitle,
          day,
          duration,
          personalizationData,
          sprintData.goals,
          openaiApiKey,
          progress.master_plan
        );

        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate daily email
        const dailyEmail = await generateDailyEmail(
          sprintData.sprintTitle,
          day,
          dailyScript,
          sprintData.toneStyle,
          sprintData.creatorName,
          openaiApiKey
        );

        const email = {
          day: day,
          subject: dailyEmail.subject,
          content: dailyEmail.content
        };

        generatedLessons.push({
          lesson: dailyScript,
          email: email
        });

        // Broadcast the lesson update in real-time
        const channel = supabase.channel(progress.channel_name);
        await channel.send({
          type: 'broadcast',
          event: 'lesson-generated',
          payload: {
            lesson: dailyScript,
            email: email
          }
        });

        console.log(`Completed and broadcasted day ${day} at ${new Date().toISOString()}`);

        // Small delay between generations within batch
        if (day < endDay) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`CRITICAL ERROR generating content for day ${day} at ${new Date().toISOString()}:`, error);
        
        // Update status to failed and stop batch processing
        await supabase
          .from('sprint_generation_progress')
          .update({ 
            status: 'failed',
            current_day: day  // Don't advance past the failed day
          })
          .eq('id', progressId);
        
        // Broadcast the error so UI can handle it
        const channel = supabase.channel(progress.channel_name);
        await channel.send({
          type: 'broadcast',
          event: 'generation-error',
          payload: {
            day: day,
            error: error.message,
            sprintId: progress.sprint_id
          }
        });
        
        throw error; // Stop the batch processing
      }
    }

    // Update progress in database
    const nextDay = endDay + 1;
    const isComplete = endDay >= progress.total_days;
    
    await supabase
      .from('sprint_generation_progress')
      .update({ 
        current_day: nextDay,
        status: isComplete ? 'completed' : 'pending'
      })
      .eq('id', progressId);

    if (isComplete) {
      // Broadcast completion
      const channel = supabase.channel(progress.channel_name);
      await channel.send({
        type: 'broadcast',
        event: 'generation-complete',
        payload: { sprintId: progress.sprint_id }
      });
      console.log(`All content generation completed at ${new Date().toISOString()}`);
    }

    // Return batch results
    return new Response(
      JSON.stringify({ 
        message: 'Batch generation completed',
        batchCompleted: true,
        daysGenerated: `${startDay}-${endDay}`,
        nextDay: isComplete ? null : nextDay,
        isComplete,
        generatedCount: generatedLessons.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Batch sprint generation error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});