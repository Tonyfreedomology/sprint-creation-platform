import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
  voiceSampleFile: File | null;
  writingStyleFile: File | null;
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
  console.log('Raw OpenAI response for email sequence:', response);
  
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse OpenAI response for email sequence:', response);
    console.error('Parse error:', error);
    throw new Error(`Invalid JSON response from OpenAI for daily email: ${error.message}`);
  }
}

serve(async (req) => {
  console.log('Edge function called with method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body received');
    const { formData } = requestBody;
    
    // Get the OpenAI API key from Supabase secrets
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API key available:', !!openaiApiKey);
    
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const sprintData = formData as SprintFormData;
    console.log('Sprint data received:', {
      title: sprintData.sprintTitle,
      duration: sprintData.sprintDuration,
      creatorName: sprintData.creatorName
    });
    
    const sprintId = `sprint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const duration = parseInt(sprintData.sprintDuration);
    console.log('Generating content for', duration, 'days');
    
    // Generate sample content for just 3 days to avoid timeout
    const sampleDays = Math.min(3, duration);
    const generatedContent: any = {
      sprintId,
      sprintTitle: sprintData.sprintTitle,
      sprintDescription: sprintData.sprintDescription,
      sprintDuration: sprintData.sprintDuration,
      sprintCategory: sprintData.sprintCategory,
      creatorInfo: {
        name: sprintData.creatorName,
        email: sprintData.creatorEmail,
        bio: sprintData.creatorBio
      },
      dailyLessons: [],
      emailSequence: [],
      totalDays: duration,
      sampleGenerated: true
    };

    const personalizationData = `Target Audience: ${sprintData.targetAudience}. Experience Level: ${sprintData.experience}. Content Types: ${sprintData.contentTypes.join(', ')}. Special Requirements: ${sprintData.specialRequirements}`;

    // Generate sample content for first few days only
    for (let day = 1; day <= sampleDays; day++) {
      console.log(`Starting generation for day ${day} of ${sampleDays} (sample)`);
      
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

        // Generate single daily email
        const dailyEmail = await generateDailyEmail(
          sprintData.sprintTitle,
          day,
          dailyScript,
          sprintData.toneStyle,
          sprintData.creatorName,
          openaiApiKey
        );

        console.log(`Completed generation for day ${day}`);
        generatedContent.dailyLessons.push(dailyScript);
        
        // Add single daily email
        generatedContent.emailSequence.push({
          day: day,
          subject: dailyEmail.subject,
          content: dailyEmail.content
        });
      } catch (error) {
        console.error(`Error generating content for day ${day}:`, error);
        // Continue with next day instead of failing completely
      }
    }

    // Add placeholder content for remaining days
    for (let day = sampleDays + 1; day <= duration; day++) {
      generatedContent.dailyLessons.push({
        day: day,
        title: `Day ${day}: [To be generated]`,
        content: `This lesson content will be generated when you complete the full sprint creation. This is a placeholder for day ${day} of your ${duration}-day sprint.`,
        exercise: `Exercise content for day ${day} will be generated with the full sprint.`,
        affirmation: `Your affirmation for day ${day} will be created with the complete sprint generation.`
      });

      // Add placeholder email
      generatedContent.emailSequence.push({
        day: day,
        subject: `Day ${day}: [To be generated]`,
        content: `This daily email content will be generated when you complete the full sprint creation.`
      });
    }
    
    console.log('Sample content generated successfully. Total lessons:', generatedContent.dailyLessons.length, 'Total emails:', generatedContent.emailSequence.length);

    return new Response(
      JSON.stringify({ generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sprint generation error details:', {
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