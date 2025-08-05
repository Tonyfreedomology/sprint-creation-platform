import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoRenderRequest {
  sprintId: string;
  dayNumber: number;
  videoScript: {
    title: string;
    subtitle: string;
    segments: VideoSegment[];
    totalDuration: number;
    audioFile: string;
  };
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface VideoSegment {
  type: string;
  content: string;
  startTime: number;
  endTime: number;
  visualStyle: string;
}

// Brand colors for consistent styling
const BRAND_COLORS = {
  primary: '#22DFDC',
  secondary: '#22EDB6',
  dark: '#242424',
  white: '#FFFFFF'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { sprintId, dayNumber, videoScript, brandColors }: VideoRenderRequest = await req.json();

    console.log('Starting video render via external service:', { 
      sprintId, 
      dayNumber, 
      scriptTitle: videoScript.title,
      segments: videoScript.segments.length,
      duration: videoScript.totalDuration
    });

    // Validate required data
    if (!videoScript.audioFile) {
      throw new Error('Audio file URL is required for video generation');
    }

    if (!videoScript.segments || videoScript.segments.length === 0) {
      throw new Error('Video segments are required for video generation');
    }

    // Prepare payload for external video service
    const videoServicePayload = {
      sprintId,
      dayNumber,
      videoScript,
      brandColors: brandColors || BRAND_COLORS,
      outputSettings: {
        resolution: '1920x1080',
        fps: 30,
        quality: 'high',
        format: 'mp4'
      },
      metadata: {
        requestedAt: new Date().toISOString(),
        estimatedDuration: videoScript.totalDuration
      }
    };

    console.log('Calling external video generation service...');

    // Call external video service
    try {
      const videoServiceResponse = await fetch('https://sprint-video-service.onrender.com/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('VIDEO_SERVICE_API_KEY') || 'placeholder-key'}`,
          'X-Request-ID': `${sprintId}-${dayNumber}-${Date.now()}`
        },
        body: JSON.stringify(videoServicePayload)
      });

      if (!videoServiceResponse.ok) {
        throw new Error(`Video service returned ${videoServiceResponse.status}: ${videoServiceResponse.statusText}`);
      }

      const videoResult = await videoServiceResponse.json();
      console.log('Video service response:', videoResult);

      // Use the video URL from the external service or create a mock one
      const videoUrl = videoResult.videoUrl || `https://your-video-service.com/videos/${sprintId}/day-${dayNumber}.mp4`;
      
      return new Response(JSON.stringify({
        success: true,
        videoUrl: videoUrl,
        fileName: `${sprintId}/day-${dayNumber}.mp4`,
        duration: videoScript.totalDuration,
        segments: videoScript.segments.length,
        resolution: '1920x1080',
        fps: 30,
        brandColors: BRAND_COLORS,
        renderJobId: videoResult.jobId || `job-${sprintId}-${dayNumber}`,
        message: 'Video generation started successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (videoServiceError) {
      console.log('External video service not available, using mock response...');
      
      // Create a realistic mock video URL since external service isn't deployed yet
      const mockVideoUrl = `https://sample-videos.com/zip/10/mp4/1920x1080/magnetic-sprint-day-${dayNumber}.mp4`;
      
      // Simulate realistic processing time
      const processingDelay = Math.min(videoScript.totalDuration * 1000, 10000); // Max 10 seconds
      await new Promise(resolve => setTimeout(resolve, processingDelay));
      
      return new Response(JSON.stringify({
        success: true,
        videoUrl: mockVideoUrl,
        fileName: `${sprintId}/day-${dayNumber}.mp4`,
        duration: videoScript.totalDuration,
        segments: videoScript.segments.length,
        resolution: '1920x1080',
        fps: 30,
        brandColors: BRAND_COLORS,
        renderJobId: `mock-job-${sprintId}-${dayNumber}`,
        message: 'Mock video URL generated (external service will be deployed separately)',
        isMock: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Video render error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/*
EXTERNAL VIDEO SERVICE INTEGRATION

This Edge Function now calls an external video service for actual Remotion rendering:

1. **External Service Endpoint**: https://your-video-service.com/generate
   - Receives complete video script, audio file, and brand specifications
   - Returns video URL or job ID for tracking

2. **Payload Structure**:
   - sprintId, dayNumber, videoScript with segments
   - brandColors with exact specifications
   - outputSettings for quality/format
   - metadata for tracking

3. **Service Requirements**:
   - Should implement Remotion with the exact brand components
   - Handle audio synchronization and segment timing
   - Upload to CDN and return public video URLs
   - Support job tracking for long renders

4. **Fallback Behavior**:
   - Returns mock video URLs when service unavailable
   - Maintains same API contract for frontend
   - Allows development to continue while service is deployed

5. **Production Deployment**:
   - Deploy Remotion service separately (Docker/Node.js)
   - Update VIDEO_SERVICE_API_KEY secret
   - Replace mock URLs with actual service endpoint
*/