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
    <div className="page-wrapper">
      <div className="page-content">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="centered-header">
              <h1 className="text-2xl font-semibold gradient-text">
                Review Master Plan
              </h1>
              <p className="text-white/60 text-sm mt-1">Turn your expertise into a powerful, community-driven experience that creates lasting change</p>
            </div>
          </div>

        <div className="card-wrapper">
          <div className="card-content">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] flex items-center justify-center">
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Sprint Overview</h2>
                <p className="text-white/60 text-sm">Progression Arc</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-white/60 leading-relaxed max-w-prose">{editedPlan.overallStructure.progressionArc}</p>
              </div>
              
              <div>
                <h3 className="text-[#22EDB6] font-medium mb-4">Phases</h3>
                <div className="space-y-3">
                  {editedPlan.overallStructure.phases.map((phase, index) => (
                    <div key={index} className="flex items-start gap-4 py-4 border-t border-white/8 first:border-t-0">
                      <div className="w-6 h-6 rounded-full bg-[#22EDB6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-[#22EDB6]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{phase.name}</h4>
                        <p className="text-[#22DFDC] text-sm">Day {phase.days}</p>
                        <p className="text-white/60 text-sm mt-1 leading-relaxed max-w-prose">{phase.focus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Daily Plan ({editedPlan.dailyPlans.length} days)</h2>
            <p className="text-sm text-white/40">Drag to reorder • Click to edit</p>
          </div>

          <div className="card-wrapper">
            <div className="card-content">
              <div className="space-y-0">
                {editedPlan.dailyPlans.map((day, index) => (
                  <div
                    key={day.day}
                    className={`group flex items-start gap-4 py-6 border-t border-white/8 hover:bg-white/2 transition cursor-move ${
                      index === 0 ? 'border-t-0' : ''
                    } ${draggedIndex === index ? 'opacity-50' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <svg className="h-4 w-4 text-white/40 cursor-grab mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8m-8 4h8" />
                    </svg>
                    
                    <div className="flex-1 min-w-0">
                      {editingDay === index ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[#22DFDC] text-sm font-medium">Day {day.day}</span>
                            <Input
                              value={day.theme}
                              onChange={(e) => handleDayEdit(index, 'theme', e.target.value)}
                              className="h-8 font-semibold bg-black/50 border-white/20 text-white flex-1"
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
                          <div>
                            <label className="text-sm font-medium text-white">Learning Objective</label>
                            <Textarea
                              value={day.learningObjective}
                              onChange={(e) => handleDayEdit(index, 'learningObjective', e.target.value)}
                              className="mt-1 bg-black/50 border-white/20 text-white"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-white">Key Takeaways (one per line)</label>
                            <Textarea
                              value={day.keyTakeaways.join('\n')}
                              onChange={(e) => handleDayEdit(index, 'keyTakeaways', e.target.value.split('\n'))}
                              className="mt-1 bg-black/50 border-white/20 text-white"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[#22DFDC] text-sm font-medium">Day {day.day}</span>
                            <h3 className="text-2xl font-semibold text-white">{day.theme}</h3>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingDay(index)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 text-white ml-auto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-white/80 mb-3 leading-relaxed max-w-prose">{day.learningObjective}</p>
                          {day.keyTakeaways.length > 0 && (
                            <p className="text-sm text-white/60 leading-relaxed max-w-prose">
                              Key Points: {day.keyTakeaways.join(' • ')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="text-white hover:bg-white/10 border-white/20"
          >
            Back to Form
          </Button>
          <Button 
            onClick={handleApproveAndGenerate}
            disabled={isGenerating}
            className="px-8 py-4 text-lg rounded-xl font-medium text-white transition-all hover:scale-105 disabled:opacity-50"
            style={{ 
              background: 'linear-gradient(135deg, #22DFDC, #22EDB6)',
              border: 'none'
            }}
          >
            {isGenerating ? 'Starting Generation...' : 'Approve & Generate Content'}
          </Button>
        </div>
      </div>
    </div>
    </div>
  );
}