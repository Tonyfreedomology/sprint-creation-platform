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

interface DayStructure {
  day: number;
  theme: string;
  learningObjective: string;
  keyTakeaways: string[];
  buildingBlocks: string;
  connectionToPrevious: string;
  connectionToNext: string;
}

interface MasterPlan {
  overallStructure: {
    phases: Array<{
      name: string;
      days: string;
      focus: string;
    }>;
    progressionArc: string;
  };
  dailyPlans: DayStructure[];
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
      model: 'gpt-4.1-2025-04-14',
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

async function generateMasterPlan(formData: SprintFormData, apiKey: string): Promise<MasterPlan> {
  const prompt = `You are an expert curriculum designer and life coach. Create a comprehensive master plan for a ${formData.sprintDuration}-day sprint titled "${formData.sprintTitle}".

Sprint Details:
- Title: ${formData.sprintTitle}
- Description: ${formData.sprintDescription}
- Duration: ${formData.sprintDuration} days
- Category: ${formData.sprintCategory}
- Target Audience: ${formData.targetAudience}
- Experience Level: ${formData.experience}
- Primary Goals: ${formData.goals}
- Tone/Style: ${formData.toneStyle}
- Special Requirements: ${formData.specialRequirements}

Create a logical progression that:
1. Builds foundational concepts first
2. Introduces advanced concepts gradually
3. Ensures each day connects to the previous and prepares for the next
4. Avoids redundancy and ensures unique value each day
5. Creates a cohesive transformation journey

Return a JSON object with this exact structure:
{
  "overallStructure": {
    "phases": [
      {
        "name": "Foundation Phase",
        "days": "1-7", 
        "focus": "Building awareness and initial habits"
      }
    ],
    "progressionArc": "Description of how the sprint progresses from day 1 to ${formData.sprintDuration}"
  },
  "dailyPlans": [
    {
      "day": 1,
      "theme": "Clear, compelling day theme",
      "learningObjective": "What participants will learn",
      "keyTakeaways": ["takeaway1", "takeaway2", "takeaway3"],
      "buildingBlocks": "How this builds on previous days",
      "connectionToPrevious": "How this connects to yesterday",
      "connectionToNext": "How this prepares for tomorrow"
    }
  ]
}

Make sure each day has a unique focus that builds toward the overall goals. No two days should be repetitive.`;

  console.log('Generating master plan...');
  const response = await generateCompletion(prompt, apiKey, 4000);
  console.log('Raw master plan response length:', response.length);
  
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse master plan response:', response);
    console.error('Parse error:', error);
    throw new Error(`Invalid JSON response for master plan: ${error.message}`);
  }
}

async function generateDailyScriptWithStructure(
  sprintData: SprintFormData,
  dayStructure: DayStructure,
  allDayStructures: DayStructure[],
  apiKey: string
): Promise<any> {
  const { day, theme, learningObjective, keyTakeaways, buildingBlocks, connectionToPrevious, connectionToNext } = dayStructure;
  
  const prompt = `You are an expert life coach and content creator. Generate a comprehensive, flowing audio lesson script for day ${day} of ${sprintData.sprintDuration} of the sprint "${sprintData.sprintTitle}".

SPRINT CONTEXT:
- Overall Goal: ${sprintData.goals}
- Target Audience: ${sprintData.targetAudience}
- Experience Level: ${sprintData.experience}
- Duration: ${sprintData.sprintDuration} days

DAY ${day} STRUCTURE:
- Theme: ${theme}
- Learning Objective: ${learningObjective}
- Key Takeaways: ${keyTakeaways.join(', ')}
- Building Blocks: ${buildingBlocks}
- Connection to Previous: ${connectionToPrevious}
- Connection to Next: ${connectionToNext}

OVERALL SPRINT PROGRESSION:
${allDayStructures.map(d => `Day ${d.day}: ${d.theme} - ${d.learningObjective}`).join('\n')}

Create a cohesive 4-5 minute audio script that:
1. Opens with warm welcome and positions today within the overall journey
2. References previous day's work (if applicable) and builds upon it
3. Delivers the core lesson aligned with today's theme and learning objective
4. Includes specific stories, examples, and practical insights
5. Seamlessly introduces today's exercise that reinforces the learning objective
6. Concludes with an affirmation that solidifies the day's key takeaway
7. Previews how today's work prepares them for tomorrow (if applicable)

The script should flow as one continuous narrative for audio delivery, making clear connections to the overall transformation journey.

Output as JSON in this exact format:
{
  "day": ${day},
  "title": "Day ${day}: ${theme}",
  "content": "[Complete flowing audio script that weaves together all elements naturally for audio delivery]",
  "exercise": "[Specific exercise that reinforces today's learning objective]",
  "affirmation": "[Affirmation that solidifies today's key takeaway]"
}`;

  console.log(`Generating structured script for day ${day}: ${theme}`);
  const response = await generateCompletion(prompt, apiKey, 3500);
  console.log(`Raw script response for day ${day} length:`, response.length);
  
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error(`Failed to parse script response for day ${day}:`, response);
    console.error('Parse error:', error);
    throw new Error(`Invalid JSON response for day ${day} script: ${error.message}`);
  }
}

async function generateDailyEmailWithStructure(
  sprintData: SprintFormData,
  dayStructure: DayStructure,
  dailyScript: any,
  apiKey: string
): Promise<any> {
  const { day, theme, learningObjective, keyTakeaways } = dayStructure;
  
  const prompt = `You are an expert email marketing specialist. Create an engaging email for day ${day} of the "${sprintData.sprintTitle}" sprint.

CONTEXT:
- Sprint: ${sprintData.sprintTitle}
- Day ${day} Theme: ${theme}
- Learning Objective: ${learningObjective}
- Key Takeaways: ${keyTakeaways.join(', ')}
- Creator: ${sprintData.creatorName}
- Tone: ${sprintData.toneStyle}
- Daily Lesson: ${JSON.stringify(dailyScript)}

Create one comprehensive email that:
- Welcomes them to day ${day} with enthusiasm
- Connects to their overall transformation journey
- Delivers the key insights aligned with today's theme
- Guides them through the exercise with clear, actionable steps
- Includes the affirmation in a meaningful way
- Motivates them for action and reflection
- Builds excitement for tomorrow's continuation

The email should feel personal, engaging, and clearly advance their progress toward the sprint goals.

Output as JSON in this exact format:
{
  "subject": "Day ${day}: ${theme}",
  "content": "[Full email content that delivers value and drives action]"
}`;

  console.log(`Generating email for day ${day}: ${theme}`);
  const response = await generateCompletion(prompt, apiKey, 1500);
  console.log(`Raw email response for day ${day} length:`, response.length);
  
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error(`Failed to parse email response for day ${day}:`, response);
    console.error('Parse error:', error);
    throw new Error(`Invalid JSON response for day ${day} email: ${error.message}`);
  }
}

async function handleMasterPlanOnlyPhase(supabase: any, formData: SprintFormData, channelName: string, openaiApiKey: string) {
  console.log('Phase: Master plan only');
  
  // Send initial status
  await supabase.channel(channelName).send({
    type: 'broadcast',
    event: 'structure-generation-started',
    payload: { status: 'starting' }
  });

  // Generate master plan
  const masterPlan = await generateMasterPlan(formData, openaiApiKey);
  console.log('Master plan generated with', masterPlan.dailyPlans.length, 'days');
  
  // Send master plan to frontend
  await supabase.channel(channelName).send({
    type: 'broadcast',
    event: 'structure-generated',
    payload: { 
      structure: masterPlan,
      message: 'Master plan created!'
    }
  });

  return new Response(
    JSON.stringify({ 
      message: 'Master plan generated successfully',
      masterPlan,
      phase: 'master-plan-only'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleContentGenerationPhase(
  supabase: any, 
  formData: SprintFormData, 
  sprintId: string, 
  channelName: string, 
  masterPlan: MasterPlan, 
  openaiApiKey: string
) {
  console.log('Phase: Content generation with approved plan');
  
  // Start background content generation process
  EdgeRuntime.waitUntil((async () => {
    try {
      const channel = supabase.channel(channelName);
      
      // Generate detailed content for each day using the approved master plan
      for (let i = 0; i < masterPlan.dailyPlans.length; i++) {
        const dayStructure = masterPlan.dailyPlans[i];
        console.log(`Generating detailed content for day ${dayStructure.day}: ${dayStructure.theme}`);
        
        try {
          // Generate script with full context
          const dailyScript = await generateDailyScriptWithStructure(
            formData,
            dayStructure,
            masterPlan.dailyPlans,
            openaiApiKey
          );

          // Small delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

          // Generate email with structure context
          const dailyEmail = await generateDailyEmailWithStructure(
            formData,
            dayStructure,
            dailyScript,
            openaiApiKey
          );

          const email = {
            day: dayStructure.day,
            subject: dailyEmail.subject,
            content: dailyEmail.content
          };

          // Broadcast the lesson update in real-time
          await channel.send({
            type: 'broadcast',
            event: 'lesson-generated',
            payload: {
              lesson: dailyScript,
              email: email,
              structure: dayStructure
            }
          });

          console.log(`Completed and broadcasted day ${dayStructure.day}: ${dayStructure.theme}`);

          // Delay between generations
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error generating content for day ${dayStructure.day}:`, error);
          
          // Still broadcast a placeholder so the UI updates
          await channel.send({
            type: 'broadcast',
            event: 'lesson-generated',
            payload: {
              lesson: {
                day: dayStructure.day,
                title: `Day ${dayStructure.day}: ${dayStructure.theme}`,
                content: `There was an error generating content for day ${dayStructure.day}. Please try regenerating this lesson.`,
                exercise: `Exercise for day ${dayStructure.day} will be available after regeneration.`,
                affirmation: `Affirmation for day ${dayStructure.day} will be available after regeneration.`
              },
              email: {
                day: dayStructure.day,
                subject: `Day ${dayStructure.day}: Content Generation Failed`,
                content: `There was an error generating the email for day ${dayStructure.day}. Please try regenerating this content.`
              },
              structure: dayStructure
            }
          });
        }
      }
      
      // Broadcast completion
      await channel.send({
        type: 'broadcast',
        event: 'generation-complete',
        payload: { 
          sprintId,
          message: 'All content generated successfully!'
        }
      });
      
      console.log('All content generation completed');
    } catch (error) {
      console.error('Content generation process failed:', error);
      
      // Broadcast error
      const channel = supabase.channel(channelName);
      await channel.send({
        type: 'broadcast',
        event: 'generation-error',
        payload: { 
          error: error.message,
          message: 'Generation failed. Please try again.'
        }
      });
    }
  })());

  return new Response(
    JSON.stringify({ 
      message: 'Content generation started',
      sprintId,
      channelName,
      phase: 'content-generation'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

serve(async (req) => {
  console.log('Structured sprint generation function called with method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body received for structured generation');
    const { formData, sprintId, channelName, phase, masterPlan } = requestBody;
    
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
    console.log('Processing structured generation for sprint:', sprintData.sprintTitle, 'Phase:', phase);
    
    // Handle different phases
    if (phase === 'master-plan-only') {
      return await handleMasterPlanOnlyPhase(supabase, sprintData, channelName, openaiApiKey);
    } else if (phase === 'content-generation') {
      return await handleContentGenerationPhase(supabase, sprintData, sprintId, channelName, masterPlan, openaiApiKey);
    }
    
    // Default response for unknown phase
    return new Response(
      JSON.stringify({ 
        error: 'Invalid phase specified. Use "master-plan-only" or "content-generation"'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Structured sprint generation error details:', {
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