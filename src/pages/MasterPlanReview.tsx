import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, GripVertical, Edit2, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { orchestrateBatchGeneration } from '@/services/batchSprintGeneration';

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
      console.log('Starting batch content generation with:', { sprintId, channelName });
      
      // Navigate to sprint preview to show progress
      navigate(`/sprint-preview?id=${sprintId}&channel=${channelName}`, {
        state: {
          sprintData: {
            sprintId,
            sprintTitle: formData.sprintTitle,
            sprintDescription: formData.sprintDescription,
            sprintDuration: formData.sprintDuration,
            sprintCategory: formData.sprintCategory,
            creatorInfo: {
              name: formData.creatorName,
              email: formData.creatorEmail,
              bio: formData.creatorBio
            },
            masterPlan: editedPlan,
            dailyLessons: [],
            emailSequence: []
          },
          isGenerating: true,
          channelName,
          startGeneration: true // Flag to trigger generation in preview page
        }
      });

    } catch (error) {
      console.error('Error starting content generation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to start content generation: ${errorMessage}`);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Review Master Plan
          </h1>
        </div>

        <Card className="bg-gradient-to-br from-gray-900/90 via-gray-800/50 to-gray-900/90 border border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Sprint Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-white">Progression Arc</h3>
                <p className="text-gray-300">{editedPlan.overallStructure.progressionArc}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-white">Phases</h3>
                <div className="grid gap-2">
                  {editedPlan.overallStructure.phases.map((phase, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-lg">
                      <span className="font-medium text-white">{phase.name}</span>
                      <span className="text-sm text-cyan-400">Days {phase.days}</span>
                      <span className="text-sm text-gray-300">{phase.focus}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Daily Plan ({editedPlan.dailyPlans.length} days)</h2>
            <p className="text-sm text-gray-400">Drag to reorder • Click to edit</p>
          </div>

          {editedPlan.dailyPlans.map((day, index) => (
            <Card 
              key={day.day} 
              className={`bg-gradient-to-br from-gray-900/90 via-gray-800/50 to-gray-900/90 border border-white/10 backdrop-blur-sm cursor-move transition-all hover:border-white/20 ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-cyan-400">Day {day.day}</span>
                      {editingDay === index ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={day.theme}
                            onChange={(e) => handleDayEdit(index, 'theme', e.target.value)}
                            className="h-8 font-semibold bg-gray-800/50 border-white/20 text-white"
                            placeholder="Lesson theme..."
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingDay(null)}
                            className="hover:bg-white/10 text-white"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">{day.theme}</h3>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingDay(index)}
                              className="hover:bg-white/10 text-white"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-300">{day.learningObjective}</p>
                          {day.keyTakeaways.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-gray-400">Key Points: </span>
                              <span className="text-xs text-gray-400">
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
                    <label className="text-sm font-medium text-white">Learning Objective</label>
                    <Textarea
                      value={day.learningObjective}
                      onChange={(e) => handleDayEdit(index, 'learningObjective', e.target.value)}
                      className="mt-1 bg-gray-800/50 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white">Key Takeaways (one per line)</label>
                    <Textarea
                      value={day.keyTakeaways.join('\n')}
                      onChange={(e) => handleDayEdit(index, 'keyTakeaways', e.target.value.split('\n'))}
                      className="mt-1 bg-gray-800/50 border-white/20 text-white"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between pt-6">
          <Button variant="outline" onClick={onBack} className="border-white/20 hover:bg-white/10 text-white">
            Back to Form
          </Button>
          <Button 
            onClick={handleApproveAndGenerate}
            disabled={isGenerating}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white disabled:opacity-50"
          >
            {isGenerating ? 'Starting Generation...' : 'Approve & Generate Content'}
          </Button>
        </div>
      </div>
    </div>
  );
}