import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, GripVertical, Edit2, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DayPlan {
  day: number;
  theme: string;
  learningObjective: string;
  keyTakeaways: string[];
  buildingBlocks: string;
  connectionToPrevious: string;
  connectionToNext: string;
}

interface MasterPlan {
  overallStructure: {
    phases: Array<{
      name: string;
      days: string;
      focus: string;
    }>;
    progressionArc: string;
  };
  dailyPlans: DayPlan[];
}

interface MasterPlanReviewProps {
  masterPlan: MasterPlan;
  formData: any;
  sprintId: string;
  channelName: string;
  onBack: () => void;
}

export default function MasterPlanReview({ masterPlan, formData, sprintId, channelName, onBack }: MasterPlanReviewProps) {
  const [editedPlan, setEditedPlan] = useState<MasterPlan>(masterPlan);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const handleDayEdit = (dayIndex: number, field: keyof DayPlan, value: string | string[]) => {
    const updatedPlans = [...editedPlan.dailyPlans];
    updatedPlans[dayIndex] = { ...updatedPlans[dayIndex], [field]: value };
    setEditedPlan({ ...editedPlan, dailyPlans: updatedPlans });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedPlans = [...editedPlan.dailyPlans];
    const draggedItem = updatedPlans[draggedIndex];
    updatedPlans.splice(draggedIndex, 1);
    updatedPlans.splice(index, 0, draggedItem);

    // Update day numbers to match new positions
    updatedPlans.forEach((plan, idx) => {
      plan.day = idx + 1;
    });

    setEditedPlan({ ...editedPlan, dailyPlans: updatedPlans });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleApproveAndGenerate = async () => {
    setIsGenerating(true);
    
    console.log('About to start content generation');
    console.log('Sprint ID:', sprintId);
    console.log('Channel Name:', channelName);
    
    if (!sprintId || !channelName) {
      console.error('Missing sprintId or channelName!', { sprintId, channelName });
      toast.error('Missing sprint information. Please try again.');
      setIsGenerating(false);
      return;
    }
    
    try {
      console.log('Starting content generation with:', { sprintId, channelName, phase: 'content-generation' });
      
      const response = await supabase.functions.invoke('generate-sprint-structured', {
        body: {
          formData,
          sprintId,
          channelName,
          masterPlan: editedPlan,
          phase: 'content-generation'
        }
      });

      console.log('Function response:', response);

      if (response.error) {
        console.error('Function returned error:', response.error);
        throw new Error(response.error.message || 'Unknown error from function');
      }

      console.log('About to navigate to sprint preview with URL:', `/sprint-preview?id=${sprintId}&channel=${channelName}`);
      
      // Navigate immediately to the preview page
      window.location.href = `/sprint-preview?id=${sprintId}&channel=${channelName}`;

    } catch (error) {
      console.error('Error starting content generation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to start content generation: ${errorMessage}`);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Review Master Plan
          </h1>
        </div>

        <Card className="border-primary/20 shadow-card">
          <CardHeader>
            <CardTitle>Sprint Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Progression Arc</h3>
                <p className="text-muted-foreground">{editedPlan.overallStructure.progressionArc}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Phases</h3>
                <div className="grid gap-2">
                  {editedPlan.overallStructure.phases.map((phase, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">{phase.name}</span>
                      <span className="text-sm text-muted-foreground">Days {phase.days}</span>
                      <span className="text-sm">{phase.focus}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Daily Plan ({editedPlan.dailyPlans.length} days)</h2>
            <p className="text-sm text-muted-foreground">Drag to reorder • Click to edit</p>
          </div>

          {editedPlan.dailyPlans.map((day, index) => (
            <Card 
              key={day.day} 
              className={`border-primary/20 shadow-card cursor-move transition-all ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">Day {day.day}</span>
                      {editingDay === index ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={day.theme}
                            onChange={(e) => handleDayEdit(index, 'theme', e.target.value)}
                            className="h-8 font-semibold"
                            placeholder="Lesson theme..."
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingDay(null)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{day.theme}</h3>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingDay(index)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">{day.learningObjective}</p>
                          {day.keyTakeaways.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-muted-foreground">Key Points: </span>
                              <span className="text-xs text-muted-foreground">
                                {day.keyTakeaways.slice(0, 2).join(' • ')}{day.keyTakeaways.length > 2 ? '...' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {editingDay === index && (
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Learning Objective</label>
                    <Textarea
                      value={day.learningObjective}
                      onChange={(e) => handleDayEdit(index, 'learningObjective', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Key Takeaways (one per line)</label>
                    <Textarea
                      value={day.keyTakeaways.join('\n')}
                      onChange={(e) => handleDayEdit(index, 'keyTakeaways', e.target.value.split('\n'))}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between pt-6">
          <Button variant="outline" onClick={onBack}>
            Back to Form
          </Button>
          <Button 
            onClick={handleApproveAndGenerate}
            disabled={isGenerating}
            className="bg-gradient-to-r from-primary to-primary-glow"
          >
            {isGenerating ? 'Starting Generation...' : 'Approve & Generate Content'}
          </Button>
        </div>
      </div>
    </div>
  );
}