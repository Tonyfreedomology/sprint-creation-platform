import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  CheckCircle, 
  Clock, 
  FileText, 
  Mail,
  Users,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface GenerationBatch {
  batchId: string;
  days: number[];
  status: 'pending' | 'generating' | 'completed' | 'error';
  lessons?: any[];
  emails?: any[];
  progress: number;
}

interface GeneratedContent {
  sprintId: string;
  sprintTitle: string;
  sprintDescription: string;
  sprintDuration: string;
  sprintCategory: string;
  voiceId?: string;
  dailyLessons: any[];
  emailSequence: any[];
  creatorInfo: {
    name: string;
    email: string;
    bio: string;
  };
}

export const SprintGeneration: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<SprintFormData | null>(null);
  const [batches, setBatches] = useState<GenerationBatch[]>([]);
  const [currentBatch, setCurrentBatch] = useState<number>(0);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [generationStarted, setGenerationStarted] = useState(false);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (location.state?.formData) {
      const data = location.state.formData as SprintFormData;
      setFormData(data);
      initializeBatches(data);
    } else {
      navigate('/');
    }
  }, [location.state, navigate]);

  const initializeBatches = (data: SprintFormData) => {
    const totalDays = parseInt(data.sprintDuration);
    const batchSize = 5;
    const batchCount = Math.ceil(totalDays / batchSize);
    
    const initialBatches: GenerationBatch[] = [];
    
    for (let i = 0; i < batchCount; i++) {
      const startDay = i * batchSize + 1;
      const endDay = Math.min((i + 1) * batchSize, totalDays);
      const days = Array.from({ length: endDay - startDay + 1 }, (_, idx) => startDay + idx);
      
      initialBatches.push({
        batchId: `batch-${i + 1}`,
        days,
        status: 'pending',
        progress: 0
      });
    }
    
    setBatches(initialBatches);
    
    // Initialize generated content structure
    setGeneratedContent({
      sprintId: `sprint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sprintTitle: data.sprintTitle,
      sprintDescription: data.sprintDescription,
      sprintDuration: data.sprintDuration,
      sprintCategory: data.sprintCategory,
      voiceId: data.voiceId,
      dailyLessons: [],
      emailSequence: [],
      creatorInfo: {
        name: data.creatorName,
        email: data.creatorEmail,
        bio: data.creatorBio,
      },
    });
  };

  const startGeneration = async () => {
    if (!formData || generationStarted) return;
    
    setGenerationStarted(true);
    
    // Estimate total time (30 seconds per batch)
    const totalBatches = batches.length;
    const estimatedMinutes = Math.ceil((totalBatches * 30) / 60);
    setEstimatedTimeRemaining(`~${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''}`);
    
    for (let i = 0; i < batches.length; i++) {
      await processBatch(i);
    }
    
    setIsComplete(true);
    setOverallProgress(100);
    
    toast({
      title: "Sprint Generation Complete!",
      description: "Your sprint is ready for review and customization.",
    });
  };

  const processBatch = async (batchIndex: number) => {
    if (!formData || !generatedContent) return;
    
    setCurrentBatch(batchIndex);
    
    // Update batch status to generating
    setBatches(prev => prev.map((batch, idx) => 
      idx === batchIndex 
        ? { ...batch, status: 'generating', progress: 0 }
        : batch
    ));

    try {
      const batch = batches[batchIndex];
      
      const response = await supabase.functions.invoke('generate-sprint-batch', {
        body: {
          formData,
          batchDays: batch.days,
          sprintId: generatedContent.sprintId
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { batchLessons, batchEmails } = response.data;
      
      // Update generated content with new batch
      setGeneratedContent(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          dailyLessons: [...prev.dailyLessons, ...batchLessons],
          emailSequence: [...prev.emailSequence, ...batchEmails]
        };
      });

      // Update batch status to completed
      setBatches(prev => prev.map((batch, idx) => 
        idx === batchIndex 
          ? { 
              ...batch, 
              status: 'completed', 
              progress: 100,
              lessons: batchLessons,
              emails: batchEmails
            }
          : batch
      ));

      // Update overall progress
      const completedBatches = batchIndex + 1;
      const newProgress = (completedBatches / batches.length) * 100;
      setOverallProgress(newProgress);
      
      // Update time remaining
      const remainingBatches = batches.length - completedBatches;
      if (remainingBatches > 0) {
        const remainingMinutes = Math.ceil((remainingBatches * 30) / 60);
        setEstimatedTimeRemaining(`~${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} remaining`);
      }

    } catch (error) {
      console.error('Batch generation error:', error);
      
      setBatches(prev => prev.map((batch, idx) => 
        idx === batchIndex 
          ? { ...batch, status: 'error', progress: 0 }
          : batch
      ));

      toast({
        title: "Batch Generation Error",
        description: `Failed to generate batch ${batchIndex + 1}. Continuing with next batch...`,
        variant: "destructive",
      });
    }
  };

  const proceedToReview = () => {
    if (generatedContent) {
      navigate('/sprint-preview', { 
        state: { generatedContent },
        replace: true 
      });
    }
  };

  if (!formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-hero rounded-full mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
            Creating Your Sprint
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            "{formData.sprintTitle}"
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{formData.sprintDuration} Days</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{batches.length} Batches</span>
            </div>
            {estimatedTimeRemaining && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{estimatedTimeRemaining}</span>
              </div>
            )}
          </div>
        </div>

        {/* Overall Progress */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Batch Grid */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch, index) => (
              <Card 
                key={batch.batchId}
                className={`transition-all duration-500 ${
                  batch.status === 'generating' ? 'ring-2 ring-primary scale-105' :
                  batch.status === 'completed' ? 'bg-green-50 border-green-200' :
                  batch.status === 'error' ? 'bg-red-50 border-red-200' :
                  'opacity-60'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Batch {index + 1}</h3>
                    <Badge variant={
                      batch.status === 'completed' ? 'default' :
                      batch.status === 'generating' ? 'secondary' :
                      batch.status === 'error' ? 'destructive' :
                      'outline'
                    }>
                      {batch.status === 'pending' && 'Pending'}
                      {batch.status === 'generating' && 'Generating...'}
                      {batch.status === 'completed' && 'Complete'}
                      {batch.status === 'error' && 'Error'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    Days {Math.min(...batch.days)} - {Math.max(...batch.days)}
                  </div>
                  
                  {batch.status === 'generating' && (
                    <div className="space-y-2">
                      <Progress value={batch.progress} className="h-2" />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generating content...</span>
                      </div>
                    </div>
                  )}
                  
                  {batch.status === 'completed' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>{batch.lessons?.length || 0} lessons created</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Mail className="w-4 h-4" />
                        <span>{batch.emails?.length || 0} emails created</span>
                      </div>
                    </div>
                  )}
                  
                  {batch.status === 'pending' && (
                    <div className="text-sm text-muted-foreground">
                      Waiting to start...
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-2xl mx-auto text-center">
          {!generationStarted ? (
            <Button 
              onClick={startGeneration}
              size="lg"
              className="px-8 py-6 text-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Generation
            </Button>
          ) : isComplete ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-medium">Sprint Generation Complete!</span>
              </div>
              <Button 
                onClick={proceedToReview}
                size="lg"
                className="px-8 py-6 text-lg"
              >
                Review & Customize Sprint
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>Generation in progress...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};