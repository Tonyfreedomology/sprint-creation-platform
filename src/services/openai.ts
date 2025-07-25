interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateCompletion(prompt: string, maxTokens: number = 2000): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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

  async generateDailyScript(
    sprintTheme: string,
    day: number,
    duration: number,
    personalizationData: string,
    teachingGoals: string
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

    const response = await this.generateCompletion(prompt, 1500);
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', response);
      throw new Error('Invalid JSON response from OpenAI');
    }
  }

  async generateEmailSequence(
    sprintTheme: string,
    day: number,
    dailyScript: any,
    emailStyle: string,
    creatorName: string
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

    const response = await this.generateCompletion(prompt, 2000);
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', response);
      throw new Error('Invalid JSON response from OpenAI');
    }
  }
}