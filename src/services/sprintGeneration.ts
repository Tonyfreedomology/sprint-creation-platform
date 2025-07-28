import { OpenAIService } from './openai';

export interface SprintFormData {
  creatorName: string;
  creatorEmail: string;
  creatorBio: string;
  sprintTitle: string;
  sprintDescription: string;
  sprintDuration: string;
  sprintCategory: string;
  targetAudience: string;
  contentGeneration: 'ai' | 'manual' | 'hybrid';
  contentTypes: string[];
  toneStyle: string;
  experience: string;
  goals: string;
  specialRequirements: string;
  participantEmails: string;
  voiceId?: string;
}

export interface GeneratedContent {
  sprintId: string;
  sprintTitle: string;
  sprintDescription: string;
  sprintDuration: string;
  sprintCategory: string;
  voiceId?: string;
  dailyLessons: Array<{
    day: number;
    title: string;
    content: string;
    exercise: string;
    affirmation?: string;
  }>;
  emailSequence: Array<{
    day: number;
    subject: string;
    content: string;
  }>;
  creatorInfo: {
    name: string;
    email: string;
    bio: string;
  };
}

export class SprintGenerationService {
  private openaiService: OpenAIService;

  constructor(apiKey: string) {
    this.openaiService = new OpenAIService(apiKey);
  }

  async generateSprint(
    formData: SprintFormData,
    onProgress?: (step: string, progress: number) => void
  ): Promise<GeneratedContent> {
    const duration = parseInt(formData.sprintDuration);
    const sprintId = `sprint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const dailyLessons: any[] = [];
    const emailSequences: any[] = [];

    const personalizationData = `Target Audience: ${formData.targetAudience}. Experience Level: ${formData.experience}. Content Types: ${formData.contentTypes.join(', ')}. Special Requirements: ${formData.specialRequirements}`;

    onProgress?.('Initializing generation...', 0);

    // Generate content for each day
    for (let day = 1; day <= duration; day++) {
      const progress = ((day - 1) / duration) * 90; // 90% for generation, 10% for final processing
      
      onProgress?.(`Generating Day ${day} content...`, progress);

      // Generate daily script
      const dailyScript = await this.openaiService.generateDailyScript(
        formData.sprintTitle,
        day,
        duration,
        personalizationData,
        formData.goals
      );

      dailyLessons.push(dailyScript);

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

      onProgress?.(`Generating Day ${day} emails...`, progress + (45 / duration));

      // Generate email sequence
      const emailSequence = await this.openaiService.generateEmailSequence(
        formData.sprintTitle,
        day,
        dailyScript,
        formData.toneStyle,
        formData.creatorName
      );

      // Transform email sequence to match expected format
      if (emailSequence.emails) {
        emailSequence.emails.forEach((email: any) => {
          emailSequences.push({
            day: day,
            subject: email.subject,
            content: email.content,
            type: email.type,
            send_time: email.send_time
          });
        });
      }

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    onProgress?.('Finalizing sprint...', 95);

    const generatedContent: GeneratedContent = {
      sprintId,
      sprintTitle: formData.sprintTitle,
      sprintDescription: formData.sprintDescription,
      sprintDuration: formData.sprintDuration,
      sprintCategory: formData.sprintCategory,
      voiceId: formData.voiceId,
      dailyLessons,
      emailSequence: emailSequences,
      creatorInfo: {
        name: formData.creatorName,
        email: formData.creatorEmail,
        bio: formData.creatorBio,
      },
    };

    onProgress?.('Complete!', 100);

    return generatedContent;
  }
}