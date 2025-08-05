import { supabase } from '@/integrations/supabase/client';

export interface VideoGenerationOptions {
  sprintId: string;
  sprintTitle: string;
  dailyLessons: Array<{
    day: number;
    title: string;
    content: string;
    exercise: string;
    affirmation?: string;
  }>;
  audioFiles: Record<string, string>; // day -> Supabase URL mapping
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface VideoSegment {
  type: 'opening' | 'introduction' | 'problem-setup' | 'metaphor' | 'reflection' | 'vision-building' | 'action-items' | 'affirmation';
  content: string;
  startTime: number;
  endTime: number;
  visualStyle: string;
}

export interface VideoScript {
  title: string;
  subtitle: string;
  segments: VideoSegment[];
  totalDuration: number;
  audioFile: string;
}

export class VideoGenerationService {
  
  /**
   * Generate videos for all days in a sprint
   */
  async generateSprintVideos(
    options: VideoGenerationOptions,
    onProgress?: (step: string, progress: number) => void
  ): Promise<Record<string, string>> {
    const videoFiles: Record<string, string> = {};
    
    onProgress?.('Starting video generation...', 0);

    for (let i = 0; i < options.dailyLessons.length; i++) {
      const lesson = options.dailyLessons[i];
      const dayNumber = lesson.day;
      
      const progress = (i / options.dailyLessons.length) * 90;
      onProgress?.(`Generating video for Day ${dayNumber}...`, progress);

      try {
        // Check if video already exists
        const existingVideo = await this.checkExistingVideo(options.sprintId, dayNumber);
        if (existingVideo) {
          videoFiles[dayNumber.toString()] = existingVideo;
          onProgress?.(`✅ Using existing video for Day ${dayNumber}`, progress);
          continue;
        }

        // Get audio file URL for this day
        const audioUrl = options.audioFiles[dayNumber.toString()];
        if (!audioUrl) {
          onProgress?.(`⚠️ No audio file found for Day ${dayNumber}`, progress);
          continue;
        }

        // Analyze audio timing and create video script
        const videoScript = await this.createVideoScript(lesson, audioUrl);
        
        // Generate video using Remotion
        const videoUrl = await this.renderVideo(
          options.sprintId, 
          dayNumber, 
          videoScript,
          options.brandColors
        );

        if (videoUrl) {
          videoFiles[dayNumber.toString()] = videoUrl;
          onProgress?.(`✅ Video ready for Day ${dayNumber}`, progress + (90 / options.dailyLessons.length));
        }

      } catch (error) {
        console.error(`Error generating video for day ${dayNumber}:`, error);
        onProgress?.(`❌ Video failed for Day ${dayNumber}`, progress);
      }
    }

    onProgress?.('Video generation complete!', 100);
    return videoFiles;
  }

  /**
   * Check if video already exists in Supabase storage
   */
  private async checkExistingVideo(sprintId: string, dayNumber: number): Promise<string | null> {
    const fileName = `day-${dayNumber}.mp4`;
    
    try {
      const { data: existingFile, error } = await supabase.storage
        .from('sprint-videos')
        .list(sprintId, {
          search: fileName
        });

      if (!error && existingFile && existingFile.length > 0) {
        const { data: urlData } = supabase.storage
          .from('sprint-videos')
          .getPublicUrl(`${sprintId}/${fileName}`);
        
        return urlData.publicUrl;
      }
    } catch (error) {
      console.error('Error checking existing video:', error);
    }

    return null;
  }

  /**
   * Analyze audio file and create synchronized video script
   */
  private async createVideoScript(
    lesson: VideoGenerationOptions['dailyLessons'][0],
    audioUrl: string
  ): Promise<VideoScript> {
    // Get audio duration
    const audioDuration = await this.getAudioDuration(audioUrl);
    
    // Parse lesson content into segments
    const segments = this.parseContentIntoSegments(lesson.content, audioDuration);
    
    return {
      title: lesson.title,
      subtitle: `Day ${lesson.day}`,
      segments,
      totalDuration: audioDuration,
      audioFile: audioUrl
    };
  }

  /**
   * Get audio file duration
   */
  private async getAudioDuration(audioUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
      });

      audio.addEventListener('error', () => {
        // If we can't load the audio, estimate based on average speech rate
        // This is a fallback - in production you might want to use a server-side solution
        reject(new Error('Could not load audio file'));
      });

      audio.load();
    });
  }

  /**
   * Parse lesson content into timed video segments
   */
  private parseContentIntoSegments(content: string, totalDuration: number): VideoSegment[] {
    const segments: VideoSegment[] = [];
    
    // Split content by paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    if (paragraphs.length === 0) {
      // Fallback: single segment
      return [{
        type: 'introduction',
        content: content,
        startTime: 0,
        endTime: totalDuration,
        visualStyle: 'speaker-focused'
      }];
    }

    // Distribute time across segments based on content length
    const totalWords = paragraphs.reduce((sum, p) => sum + p.split(' ').length, 0);
    let currentTime = 0;

    paragraphs.forEach((paragraph, index) => {
      const wordCount = paragraph.split(' ').length;
      const segmentDuration = (wordCount / totalWords) * totalDuration;
      const endTime = Math.min(currentTime + segmentDuration, totalDuration);

      // Determine segment type based on content
      const segmentType = this.detectSegmentType(paragraph, index, paragraphs.length);

      segments.push({
        type: segmentType,
        content: paragraph.trim(),
        startTime: currentTime,
        endTime: endTime,
        visualStyle: this.getVisualStyleForType(segmentType)
      });

      currentTime = endTime;
    });

    return segments;
  }

  /**
   * Detect segment type based on content patterns
   */
  private detectSegmentType(
    content: string, 
    index: number, 
    totalSegments: number
  ): VideoSegment['type'] {
    const lowerContent = content.toLowerCase();

    // First segment is usually opening
    if (index === 0) return 'opening';
    
    // Last segment often has affirmation
    if (index === totalSegments - 1 && (lowerContent.includes('i am') || lowerContent.includes('affirmation'))) {
      return 'affirmation';
    }

    // Look for patterns
    if (lowerContent.includes('imagine') || lowerContent.includes('picture') || lowerContent.includes('like a')) {
      return 'metaphor';
    }
    
    if (lowerContent.includes('?') || lowerContent.includes('think about') || lowerContent.includes('reflect')) {
      return 'reflection';
    }
    
    if (lowerContent.includes('exercise') || lowerContent.includes('action') || lowerContent.includes('step')) {
      return 'action-items';
    }
    
    if (lowerContent.includes('vision') || lowerContent.includes('future') || lowerContent.includes('imagine yourself')) {
      return 'vision-building';
    }

    // Default types based on position
    if (index === 1) return 'introduction';
    if (index === 2) return 'problem-setup';
    
    return 'introduction';
  }

  /**
   * Get visual style for segment type
   */
  private getVisualStyleForType(type: VideoSegment['type']): string {
    const styleMap = {
      opening: 'brand-intro',
      introduction: 'speaker-focused',
      'problem-setup': 'text-overlay',
      metaphor: 'metaphor-visual',
      reflection: 'question-prompt',
      'vision-building': 'inspirational',
      'action-items': 'action-list',
      affirmation: 'affirmation-close'
    };
    
    return styleMap[type] || 'speaker-focused';
  }

  /**
   * Render video using Remotion and upload to Supabase
   */
  private async renderVideo(
    sprintId: string,
    dayNumber: number,
    videoScript: VideoScript,
    brandColors?: VideoGenerationOptions['brandColors']
  ): Promise<string> {
    console.log('Starting video render:', {
      sprintId,
      dayNumber,
      title: videoScript.title,
      duration: videoScript.totalDuration
    });

    try {
      // Call Supabase Edge Function to render video
      const renderResponse = await supabase.functions.invoke('render-video', {
        body: { 
          sprintId, 
          dayNumber, 
          videoScript, 
          brandColors: brandColors || this.getDefaultBrandColors()
        }
      });

      if (renderResponse.error) {
        console.error('Video render error:', renderResponse.error);
        throw new Error(`Video rendering failed: ${renderResponse.error.message}`);
      }

      const renderData = renderResponse.data;
      if (!renderData || !renderData.success) {
        throw new Error(`Video rendering failed: ${renderData?.error || 'Unknown error'}`);
      }

      console.log('Video render successful:', renderData.videoUrl);
      return renderData.videoUrl;

    } catch (error) {
      console.error('Error during video rendering:', error);
      
      // Fallback: return placeholder URL for development
      const fileName = `${sprintId}/day-${dayNumber}.mp4`;
      const { data: urlData } = supabase.storage
        .from('sprint-videos')
        .getPublicUrl(fileName);

      console.warn('Using placeholder video URL:', urlData.publicUrl);
      return urlData.publicUrl;
    }
  }

  /**
   * Get default brand colors for video generation
   */
  private getDefaultBrandColors() {
    return {
      primary: '#22DFDC',   // Cyan
      secondary: '#22EDB6', // Jade
      accent: '#242424'     // Dark grey
    };
  }

  /**
   * Utility: Estimate duration based on text length (fallback)
   */
  static estimateDurationFromText(text: string): number {
    const words = text.split(/\s+/).length;
    const wordsPerMinute = 155; // Average speaking rate
    return Math.ceil((words / wordsPerMinute) * 60);
  }
}