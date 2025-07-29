import { supabase } from '@/integrations/supabase/client';
import { SprintFormData, GeneratedContent } from './sprintGeneration';

export interface SprintPackage {
  sprint: GeneratedContent;
  portalUrl: string;
  audioFiles: Record<string, string>;
  emailTemplates: EmailTemplate[];
  qrCode: string;
}

export interface EmailTemplate {
  day: number;
  subject: string;
  content: string;
  ghlFormatted: string;
}

export class SprintPackageGenerator {
  async generatePackage(
    sprintData: GeneratedContent,
    onProgress?: (step: string, progress: number) => void
  ): Promise<SprintPackage> {
    onProgress?.('Creating sprint package...', 10);

    // 1. Save sprint to database
    const savedSprint = await this.saveSprint(sprintData);
    onProgress?.('Sprint saved to database...', 25);

    // 2. Generate and upload audio files
    const audioFiles = await this.generateAndUploadAudio(sprintData, onProgress);
    onProgress?.('Audio files generated...', 70);

    // 3. Update sprint with audio file URLs
    await this.updateSprintWithAudio(savedSprint.id, audioFiles);
    onProgress?.('Audio files linked...', 80);

    // 4. Generate email templates
    const emailTemplates = this.generateEmailTemplates(sprintData);
    onProgress?.('Email templates generated...', 90);

    // 5. Generate portal URL and QR code
    const portalUrl = `${window.location.origin}/sprint/${sprintData.sprintId}`;
    const qrCode = await this.generateQRCode(portalUrl);
    onProgress?.('Package complete!', 100);

    return {
      sprint: sprintData,
      portalUrl,
      audioFiles,
      emailTemplates,
      qrCode
    };
  }

  private async saveSprint(sprintData: GeneratedContent) {
    const { data, error } = await supabase
      .from('sprints')
      .insert({
        sprint_id: sprintData.sprintId,
        title: sprintData.sprintTitle,
        description: sprintData.sprintDescription,
        duration: parseInt(sprintData.sprintDuration),
        category: sprintData.sprintCategory,
        voice_id: sprintData.voiceId,
        creator_info: sprintData.creatorInfo,
        daily_lessons: sprintData.dailyLessons,
        email_sequence: sprintData.emailSequence,
        portal_url: `${window.location.origin}/sprint/${sprintData.sprintId}`
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async generateAndUploadAudio(
    sprintData: GeneratedContent,
    onProgress?: (step: string, progress: number) => void
  ): Promise<Record<string, string>> {
    const audioFiles: Record<string, string> = {};
    const sprintVoiceId = sprintData.voiceId;

    for (let i = 0; i < sprintData.dailyLessons.length; i++) {
      const lesson = sprintData.dailyLessons[i];
      const dayNumber = i + 1;
      
      const baseProgress = 25;
      const stepProgress = ((i + 1) / sprintData.dailyLessons.length) * 45;
      onProgress?.(`Generating audio for Day ${dayNumber}...`, baseProgress + stepProgress);

      try {
        // Generate audio using Hume
        const audioResponse = await supabase.functions.invoke('generate-audio-hume', {
          body: {
            text: lesson.content,
            sprintId: sprintData.sprintId,
            savedVoiceId: sprintVoiceId,
            contentType: 'lesson'
          }
        });

        if (audioResponse.error) {
          console.error(`Error generating audio for day ${dayNumber}:`, audioResponse.error);
          continue;
        }

        const audioData = audioResponse.data;
        if (!audioData.audioContent) {
          console.error(`No audio content received for day ${dayNumber}`);
          continue;
        }

        // Convert base64 to blob
        const audioBlob = this.base64ToBlob(audioData.audioContent, 'audio/wav');
        
        // Upload to Supabase storage
        const fileName = `${sprintData.sprintId}/day-${dayNumber}.wav`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('sprint-audio')
          .upload(fileName, audioBlob, {
            contentType: 'audio/wav',
            upsert: true
          });

        if (uploadError) {
          console.error(`Error uploading audio for day ${dayNumber}:`, uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('sprint-audio')
          .getPublicUrl(fileName);

        audioFiles[dayNumber.toString()] = urlData.publicUrl;

      } catch (error) {
        console.error(`Error processing audio for day ${dayNumber}:`, error);
      }
    }

    return audioFiles;
  }

  private async updateSprintWithAudio(sprintId: string, audioFiles: Record<string, string>) {
    const { error } = await supabase
      .from('sprints')
      .update({ audio_files: audioFiles })
      .eq('id', sprintId);

    if (error) throw error;
  }

  private generateEmailTemplates(sprintData: GeneratedContent): EmailTemplate[] {
    return sprintData.emailSequence.map((email, index) => {
      const dayNumber = index + 1;
      const portalDayUrl = `${window.location.origin}/sprint/${sprintData.sprintId}#day-${dayNumber}`;
      
      // Enhanced email content with mobile-friendly styling
      const enhancedContent = `
<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
  <h2 style="color: #333; margin-bottom: 20px;">Day ${dayNumber}: ${email.subject}</h2>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    ${email.content}
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${portalDayUrl}" 
       style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
      📱 Access Today's Lesson & Audio
    </a>
  </div>
  
  <p style="font-size: 14px; color: #666; text-align: center;">
    Best experienced on mobile • Tap the link above to listen on-the-go
  </p>
</div>
      `.trim();

      // GHL-compatible format
      const ghlFormatted = `
SUBJECT: Day ${dayNumber}: ${email.subject}

CONTENT:
${email.content}

🎧 Listen to today's audio lesson: ${portalDayUrl}

Best experienced on your phone - perfect for your morning commute!

---
Created with Sprint Creator Platform
      `.trim();

      return {
        day: dayNumber,
        subject: `Day ${dayNumber}: ${email.subject}`,
        content: enhancedContent,
        ghlFormatted
      };
    });
  }

  private async generateQRCode(url: string): Promise<string> {
    // For now, return a placeholder. In production, you'd use a QR code library
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}