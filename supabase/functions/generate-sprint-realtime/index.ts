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
  apiKey: string
): Promise<any> {
  const prompt = `You are an expert life coach and content creator. Generate a comprehensive, flowing audio lesson script for day ${day} of ${duration} of a sprint called "${sprintTheme}".

Context:
- Sprint Theme: ${sprintTheme}
- Day: ${day} of ${duration}
- Teaching Goals: ${teachingGoals}
- Personalization: ${personalizationData}

Create a cohesive 4-5 minute audio script that naturally weaves together:
- Opening welcome and context setting for the day
- Core lesson content with stories, examples, and practical insights (4-5 detailed paragraphs)
- Seamlessly introduce the daily challenge: "Your exercise for today is..."
- Naturally conclude with the affirmation: "I want you to repeat this powerful affirmation..." or "Today's affirmation is..."

The script should flow as one continuous narrative for audio delivery, not separate sections. Make it conversational, engaging, and actionable. Include specific real-world examples and practical steps.

Output as JSON in this exact format:
{
  "day": ${day},
  "title": "Day ${day}: [Compelling Title]",
  "content": "[Complete flowing audio script that includes lesson, exercise introduction, and affirmation guidance - all woven together naturally for audio delivery]",
  "exercise": "[The specific exercise/challenge mentioned in the script]",
  "affirmation": "[The affirmation statement mentioned in the script]"
}`;

  console.log(`Generating daily script for day ${day}`);
  const response = await generateCompletion(prompt, apiKey, 3000);
  console.log('Raw OpenAI response for daily script:', response);
  
  try {
    return JSON.parse(response);
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
  const prompt = `You are an expert email marketing specialist. Create a single engaging email for day ${day} of the "${sprintTheme}" sprint.

Context:
- Sprint Theme: ${sprintTheme}
- Day: ${day}
- Email Style: ${emailStyle}
- Creator Name: ${creatorName}
- Daily Lesson: ${JSON.stringify(dailyScript)}

Create one comprehensive email that:
- Welcomes them to the day with enthusiasm
- Delivers the key lesson insights and takeaways
- Guides them through the exercise with clear instructions
- Includes the affirmation in a meaningful way
- Motivates them for action and reflection

The email should feel personal, engaging, and actionable.

Output as JSON in this exact format:
{
  "subject": "Day ${day}: [Compelling subject line]",
  "content": "[Full email content with lesson insights, exercise guidance, and affirmation woven together naturally]"
}`;

  console.log(`Generating daily email for day ${day}`);
  const response = await generateCompletion(prompt, apiKey, 1200);
  console.log('Raw OpenAI response for daily email:', response);
  
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse OpenAI response for daily email:', response);
    console.error('Parse error:', error);
    throw new Error(`Invalid JSON response from OpenAI for daily email: ${error.message}`);
  }
}

serve(async (req) => {
  console.log('Real-time sprint generation function called with method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body received');
    const { formData, sprintId, startDay, totalDays, channelName } = requestBody;
    
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

    // Create Supabase client for real-time broadcasting
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const sprintData = formData as SprintFormData;
    console.log('Processing real-time generation for sprint:', sprintData.sprintTitle);
    console.log('Generating days:', startDay, 'to', totalDays);
    
    const duration = parseInt(sprintData.sprintDuration);
    const personalizationData = `Target Audience: ${sprintData.targetAudience}. Experience Level: ${sprintData.experience}. Content Types: ${sprintData.contentTypes.join(', ')}. Special Requirements: ${sprintData.specialRequirements}`;

    // Start background generation process with heartbeat
    EdgeRuntime.waitUntil((async () => {
      try {
        console.log(`Starting generation batch: days ${startDay}-${totalDays}`);
        
        for (let day = startDay; day <= totalDays; day++) {
          console.log(`Starting generation for day ${day} (${new Date().toISOString()})`);
          
          // Add heartbeat to prevent timeout
          const heartbeatInterval = setInterval(() => {
            console.log(`Heartbeat: Still generating day ${day}`);
          }, 30000); // Every 30 seconds
          
          try {
            // Generate daily script
            const dailyScript = await generateDailyScript(
              sprintData.sprintTitle,
              day,
              duration,
              personalizationData,
              sprintData.goals,
              openaiApiKey
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

            // Broadcast the lesson update in real-time
            const channel = supabase.channel(channelName);
            await channel.send({
              type: 'broadcast',
              event: 'lesson-generated',
              payload: {
                lesson: dailyScript,
                email: email
              }
            });

            console.log(`Completed and broadcasted day ${day} at ${new Date().toISOString()}`);
            clearInterval(heartbeatInterval);

            // Progressive delay to prevent rate limiting
            const delay = day > 10 ? 3000 : 1500; // Longer delays after day 10
            console.log(`Waiting ${delay}ms before next generation`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } catch (error) {
            clearInterval(heartbeatInterval);
            console.error(`CRITICAL ERROR generating content for day ${day} at ${new Date().toISOString()}:`, error);
            console.error(`Detailed error for day ${day}:`, {
              name: error.name,
              message: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString()
            });
            
            // Still broadcast a placeholder so the UI updates
            const channel = supabase.channel(channelName);
            await channel.send({
              type: 'broadcast',
              event: 'lesson-generated',
              payload: {
                lesson: {
                  day: day,
                  title: `Day ${day}: Content Generation Failed`,
                  content: `There was an error generating content for day ${day}. Error: ${error.message}. Please try regenerating this lesson.`,
                  exercise: `Exercise for day ${day} will be available after regeneration.`,
                  affirmation: `Affirmation for day ${day} will be available after regeneration.`
                },
                email: {
                  day: day,
                  subject: `Day ${day}: Content Generation Failed`,
                  content: `There was an error generating the email for day ${day}. Please try regenerating this content.`
                }
              }
            });
            
            // Add a longer delay after errors to prevent cascading failures
            console.log(`Error recovery: waiting 5 seconds before continuing`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
        
        // Broadcast completion
        const channel = supabase.channel(channelName);
        await channel.send({
          type: 'broadcast',
          event: 'generation-complete',
          payload: { sprintId }
        });
        
        console.log(`All content generation completed at ${new Date().toISOString()}`);
      } catch (error) {
        console.error(`FATAL: Background generation process failed at ${new Date().toISOString()}:`, error);
        console.error('Fatal error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      }
    })());

    // Return immediate response
    return new Response(
      JSON.stringify({ 
        message: 'Real-time generation started',
        sprintId,
        channelName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Real-time sprint generation error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
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