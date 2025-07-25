import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Brain, 
  FileText, 
  Mail, 
  CheckCircle, 
  Loader2,
  Zap,
  Users,
  Calendar
} from 'lucide-react';

interface LoadingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
}

const loadingSteps: LoadingStep[] = [
  {
    id: 'analyze',
    title: 'Analyzing Your Vision',
    description: 'Understanding your sprint goals and target audience',
    icon: <Brain className="w-6 h-6" />,
    duration: 8000
  },
  {
    id: 'structure',
    title: 'Creating Sprint Structure',
    description: 'Building the daily framework and lesson progression',
    icon: <Calendar className="w-6 h-6" />,
    duration: 12000
  },
  {
    id: 'content',
    title: 'Generating Daily Content',
    description: 'Writing lessons, exercises, and affirmations',
    icon: <FileText className="w-6 h-6" />,
    duration: 20000
  },
  {
    id: 'emails',
    title: 'Crafting Email Sequences',
    description: 'Creating engaging daily emails for participants',
    icon: <Mail className="w-6 h-6" />,
    duration: 10000
  },
  {
    id: 'personalize',
    title: 'Personalizing Your Voice',
    description: 'Adapting content to match your unique style',
    icon: <Sparkles className="w-6 h-6" />,
    duration: 8000
  },
  {
    id: 'finalize',
    title: 'Finalizing Your Sprint',
    description: 'Preparing everything for your review',
    icon: <CheckCircle className="w-6 h-6" />,
    duration: 2000
  }
];

interface SprintGenerationLoadingProps {
  sprintTitle: string;
  sprintDuration: string;
  creatorName: string;
  currentStep?: string;
  progress?: number;
}

export const SprintGenerationLoading: React.FC<SprintGenerationLoadingProps> = ({ 
  sprintTitle, 
  sprintDuration, 
  creatorName,
  currentStep: providedStep = '',
  progress: providedProgress = 0
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    // Use provided progress or simulate it
    if (providedProgress > 0) {
      setOverallProgress(providedProgress);
      const stepThreshold = 100 / loadingSteps.length;
      const newStepIndex = Math.min(
        Math.floor(providedProgress / stepThreshold),
        loadingSteps.length - 1
      );
      setCurrentStepIndex(newStepIndex);
      setCompletedSteps(prev => {
        const newCompleted = new Set(prev);
        for (let i = 0; i < newStepIndex; i++) {
          newCompleted.add(loadingSteps[i].id);
        }
        return newCompleted;
      });
    } else {
      // Fallback simulation
      const interval = setInterval(() => {
        setOverallProgress(prev => {
          const newProgress = Math.min(prev + 2, 95);
          
          const stepThreshold = 100 / loadingSteps.length;
          const newStepIndex = Math.min(
            Math.floor(newProgress / stepThreshold),
            loadingSteps.length - 1
          );
          
          if (newStepIndex !== currentStepIndex) {
            setCurrentStepIndex(newStepIndex);
            setCompletedSteps(prev => {
              const newCompleted = new Set(prev);
              if (currentStepIndex > 0) {
                newCompleted.add(loadingSteps[currentStepIndex - 1]?.id);
              }
              return newCompleted;
            });
          }
          
          return newProgress;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [currentStepIndex, loadingSteps.length, providedProgress]);

  const currentStepData = loadingSteps[currentStepIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-6 animate-glow">
              <Zap className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
              Creating Your Sprint
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              We're generating <strong>{sprintTitle}</strong> for you, {creatorName}
            </p>
            <p className="text-muted-foreground">
              This {sprintDuration}-day transformational experience is being crafted with AI
            </p>
          </div>

          {/* Progress */}
          <Card className="border-primary/20 shadow-elegant mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">Overall Progress</div>
                <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {Math.round(overallProgress)}%
                </div>
              </div>
              <Progress value={overallProgress} className="h-3 mb-6" />
              
              {/* Current Step */}
              <div className="flex items-center gap-4 p-4 bg-gradient-card rounded-lg border border-primary/10">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white animate-pulse">
                  {currentStepData?.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{currentStepData?.title}</h3>
                  <p className="text-muted-foreground">{currentStepData?.description}</p>
                </div>
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>

          {/* Steps Overview */}
          <Card className="border-primary/20 shadow-card">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Generation Process
              </h3>
              <div className="space-y-3">
                {loadingSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      completedSteps.has(step.id)
                        ? 'bg-green-50 border border-green-200'
                         : index === currentStepIndex
                        ? 'bg-gradient-card border border-primary/20'
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      completedSteps.has(step.id)
                        ? 'bg-green-500 text-white'
                        : index === currentStepIndex
                        ? 'bg-gradient-primary text-white animate-pulse'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {completedSteps.has(step.id) ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        completedSteps.has(step.id)
                          ? 'text-green-700'
                          : index === currentStepIndex
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {step.description}
                      </div>
                    </div>
                    {completedSteps.has(step.id) && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fun Facts */}
          <div className="mt-8 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI is analyzing thousands of successful sprints
              </div>
              <div className="flex items-center justify-center gap-2">
                <Brain className="w-4 h-4" />
                Tailoring content to your unique style
              </div>
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Generating {sprintDuration} days of transformational content
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};