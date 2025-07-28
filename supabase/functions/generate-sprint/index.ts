import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data: OpenAIResponse = await response.json();
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

  const response = await generateCompletion(prompt, apiKey, 1500);
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse OpenAI response:', response);
    throw new Error('Invalid JSON response from OpenAI');
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

  const response = await generateCompletion(prompt, apiKey, 2000);
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse OpenAI response:', response);
    throw new Error('Invalid JSON response from OpenAI');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { formData } = await req.json()
    
    // Get the OpenAI API key from Supabase secrets
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const sprintData = formData as SprintFormData
    const sprintId = `sprint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
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
      emailSequence: []
    }

    const duration = parseInt(sprintData.sprintDuration)
    const personalizationData = `Target Audience: ${sprintData.targetAudience}. Experience Level: ${sprintData.experience}. Content Types: ${sprintData.contentTypes.join(', ')}. Special Requirements: ${sprintData.specialRequirements}`

    // Generate content for each day
    for (let day = 1; day <= duration; day++) {
      // Generate daily script
      const dailyScript = await generateDailyScript(
        sprintData.sprintTitle,
        day,
        duration,
        personalizationData,
        sprintData.goals,
        openaiApiKey
      )

      // Generate email sequence
      const emailSequence = await generateEmailSequence(
        sprintData.sprintTitle,
        day,
        dailyScript,
        sprintData.toneStyle,
        sprintData.creatorName,
        openaiApiKey
      )

      generatedContent.dailyLessons.push(dailyScript)
      
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
    }

    return new Response(
      JSON.stringify({ generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Sprint generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})