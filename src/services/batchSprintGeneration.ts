import { supabase } from "@/integrations/supabase/client";

export interface BatchGenerationProgress {
  progressId: string;
  sprintId: string;
  channelName: string;
  currentDay: number;
  totalDays: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface BatchGenerationOptions {
  formData: any;
  masterPlan: any;
  sprintId: string;
  channelName: string;
  batchSize?: number;
}

/**
 * Initialize batch generation by creating a progress record in the database
 */
export async function initializeBatchGeneration(options: BatchGenerationOptions): Promise<BatchGenerationProgress> {
  const { formData, masterPlan, sprintId, channelName, batchSize = 4 } = options;
  
  console.log('Initializing batch generation for sprint:', sprintId);
  
  // Create progress record
  const { data: progress, error } = await supabase
    .from('sprint_generation_progress')
    .insert({
      sprint_id: sprintId,
      channel_name: channelName,
      total_days: parseInt(formData.sprintDuration),
      current_day: 1,
      status: 'pending',
      form_data: formData,
      master_plan: masterPlan
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating progress record:', error);
    throw new Error(`Failed to initialize batch generation: ${error.message}`);
  }

  return {
    progressId: progress.id,
    sprintId: progress.sprint_id,
    channelName: progress.channel_name,
    currentDay: progress.current_day,
    totalDays: progress.total_days,
    status: progress.status as 'pending' | 'generating' | 'completed' | 'failed'
  };
}

/**
 * Process the next batch of content generation
 */
export async function processNextBatch(progressId: string, batchSize: number = 4): Promise<{
  success: boolean;
  isComplete: boolean;
  nextDay?: number;
  error?: string;
}> {
  try {
    console.log(`Processing batch for progress ID: ${progressId}`);
    
    const response = await supabase.functions.invoke('generate-sprint-batch', {
      body: {
        progressId,
        batchSize
      }
    });

    if (response.error) {
      console.error('Batch generation error:', response.error);
      return {
        success: false,
        isComplete: false,
        error: response.error.message || 'Unknown error occurred'
      };
    }

    const result = response.data;
    console.log('Batch generation result:', result);

    return {
      success: true,
      isComplete: result.isComplete,
      nextDay: result.nextDay
    };
  } catch (error) {
    console.error('Error processing batch:', error);
    return {
      success: false,
      isComplete: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get the current progress of batch generation
 */
export async function getBatchGenerationProgress(progressId: string): Promise<BatchGenerationProgress | null> {
  const { data: progress, error } = await supabase
    .from('sprint_generation_progress')
    .select('*')
    .eq('id', progressId)
    .single();

  if (error) {
    console.error('Error fetching progress:', error);
    return null;
  }

  return {
    progressId: progress.id,
    sprintId: progress.sprint_id,
    channelName: progress.channel_name,
    currentDay: progress.current_day,
    totalDays: progress.total_days,
    status: progress.status as 'pending' | 'generating' | 'completed' | 'failed'
  };
}

/**
 * Orchestrate the complete batch generation process
 */
export async function orchestrateBatchGeneration(
  options: BatchGenerationOptions,
  onProgress?: (progress: BatchGenerationProgress) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    // Initialize the batch generation
    const initialProgress = await initializeBatchGeneration(options);
    onProgress?.(initialProgress);

    let currentProgress = initialProgress;
    const batchSize = options.batchSize || 4;

    // Process batches until completion
    while (currentProgress.status !== 'completed' && currentProgress.status !== 'failed') {
      console.log(`Processing batch starting from day ${currentProgress.currentDay}`);
      
      // Process the next batch
      const result = await processNextBatch(currentProgress.progressId, batchSize);
      
      if (!result.success) {
        console.error('Batch processing failed:', result.error);
        return { success: false, error: result.error };
      }

      // Wait a moment before checking progress (allow database to update)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get updated progress
      const updatedProgress = await getBatchGenerationProgress(currentProgress.progressId);
      if (updatedProgress) {
        currentProgress = updatedProgress;
        onProgress?.(currentProgress);
      }

      if (result.isComplete) {
        console.log('Batch generation completed successfully');
        break;
      }

      // Small delay between batches to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return { success: true };
  } catch (error) {
    console.error('Error in batch generation orchestration:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}