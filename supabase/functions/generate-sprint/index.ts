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
  const prompt = `You are an expert life coach and content creator. Generate a daily lesson script for day ${day} of ${duration} of a sprint called "${sprintTheme}".

Context:
- Sprint Theme: ${sprintTheme}
- Day: ${day} of ${duration}
- Teaching Goals: ${teachingGoals}
- Personalization: ${personalizationData}

Create a compelling, transformative daily lesson that includes:
1. A powerful title for the day
2. Main lesson content (inspiring, actionable, personal)
3. A practical exercise or challenge
4. An affirmation for the day

Output as JSON in this exact format:
{
  "day": ${day},
  "title": "Day ${day}: [Compelling Title]",
  "content": "[Main lesson content - inspiring and transformative]",
  "exercise": "[Practical exercise or challenge]",
  "affirmation": "[Powerful affirmation]"
}`;

  console.log(`Generating daily script for day ${day}`);
  const response = await generateCompletion(prompt, apiKey, 1500);
  console.log('Raw OpenAI response for daily script:', response);
  
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse OpenAI response for daily script:', response);
    console.error('Parse error:', error);
    throw new Error(`Invalid JSON response from OpenAI for daily script: ${error.message}`);
  }
}

async function generateEmailSequence(
  sprintTheme: string,
  day: number,
  dailyScript: any,
  emailStyle: string,
  creatorName: string,
  apiKey: string
): Promise<any> {
  const prompt = `You are an expert email marketing specialist. Create an email sequence for day ${day} of the "${sprintTheme}" sprint.

Context:
- Sprint Theme: ${sprintTheme}
- Day: ${day}
- Email Style: ${emailStyle}
- Creator Name: ${creatorName}
- Daily Lesson: ${JSON.stringify(dailyScript)}

Create 3 emails for this day:
1. Reminder email (sent in morning)
2. Lesson email (sent with the main content)
3. Follow-up email (sent in evening)

Output as JSON in this exact format:
{
  "day": ${day},
  "emails": [
    {
      "type": "reminder",
      "subject": "[Engaging subject line]",
      "content": "[Brief, encouraging reminder content]",
      "send_time": "09:00"
    },
    {
      "type": "lesson",
      "subject": "[Main lesson subject line]",
      "content": "[Full lesson email content including the daily lesson]",
      "send_time": "12:00"
    },
    {
      "type": "followup",
      "subject": "[Follow-up subject line]",
      "content": "[Reflection and encouragement content]",
      "send_time": "18:00"
    }
  ]
}`;

  console.log(`Generating email sequence for day ${day}`);
  const response = await generateCompletion(prompt, apiKey, 2000);
  console.log('Raw OpenAI response for email sequence:', response);
  
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse OpenAI response for email sequence:', response);
    console.error('Parse error:', error);
    throw new Error(`Invalid JSON response from OpenAI for email sequence: ${error.message}`);
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

        // Generate email sequence
        const emailSequence = await generateEmailSequence(
          sprintData.sprintTitle,
          day,
          dailyScript,
          sprintData.toneStyle,
          sprintData.creatorName,
          openaiApiKey
        );

        console.log(`Completed generation for day ${day}`);
        generatedContent.dailyLessons.push(dailyScript);
        
        // Transform email sequence to match expected format
        if (emailSequence.emails) {
          emailSequence.emails.forEach((email: any) => {
            generatedContent.emailSequence.push({
              day: day,
              subject: email.subject,
              content: email.content,
              type: email.type,
              send_time: email.send_time
            });
          });
        }
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

      // Add placeholder emails
      ['reminder', 'lesson', 'followup'].forEach((type, index) => {
        generatedContent.emailSequence.push({
          day: day,
          subject: `Day ${day} ${type} - [To be generated]`,
          content: `This ${type} email content will be generated when you complete the full sprint creation.`,
          type: type,
          send_time: ['09:00', '12:00', '18:00'][index]
        });
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