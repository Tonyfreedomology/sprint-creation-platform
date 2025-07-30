import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, ArrowLeft, Sparkles, Users, Brain, Heart, DollarSign, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SprintGenerationLoading } from './SprintGenerationLoading';
import { SprintReviewPage } from './SprintReviewPage';
import { OpenAIKeyModal } from './OpenAIKeyModal';
import { supabase } from '@/integrations/supabase/client';
import MasterPlanReview from '@/pages/MasterPlanReview';

interface SprintFormData {
  // Creator Info
  creatorName: string;
  creatorEmail: string;
  creatorBio: string;
  
  // Sprint Details
  sprintTitle: string;
  sprintDescription: string;
  sprintDuration: string;
  sprintCategory: string;
  targetAudience: string;
  
  // Content Preferences
  contentGeneration: 'ai' | 'manual' | 'hybrid';
  contentTypes: string[];
  toneStyle: string;
  
  // Additional Info
  experience: string;
  goals: string;
  specialRequirements: string;
  
  // Voice and delivery options
  voiceStyle: string;
  voiceSampleFile: File | null;
  writingStyleFile: File | null;
  participantEmails: string;
}

interface GeneratedContent {
  sprintId: string;
  sprintTitle: string;
  sprintDescription: string;
  sprintDuration: string;
  sprintCategory: string;
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

const initialFormData: SprintFormData = {
  creatorName: '',
  creatorEmail: '',
  creatorBio: '',
  sprintTitle: '',
  sprintDescription: '',
  sprintDuration: '',
  sprintCategory: '',
  targetAudience: '',
  contentGeneration: 'ai',
  contentTypes: [],
  toneStyle: '',
  experience: '',
  goals: '',
  specialRequirements: '',
  voiceStyle: 'warm-coach', // Default voice style
  voiceSampleFile: null,
  writingStyleFile: null,
  participantEmails: '',
};

export const SprintCreationForm: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SprintFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');
  const [masterPlan, setMasterPlan] = useState<any>(null);
  const [showMasterPlanReview, setShowMasterPlanReview] = useState(false);
  const [sprintId, setSprintId] = useState('');
  const [channelName, setChannelName] = useState('');

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof SprintFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContentTypeChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      contentTypes: checked 
        ? [...prev.contentTypes, type]
        : prev.contentTypes.filter(t => t !== type)
    }));
  };

  const handleVoiceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, voiceSampleFile: file }));
  };

  const handleWritingStyleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, writingStyleFile: file }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    await generateSprintWithApiKey();
  };

  const generateSprintWithApiKey = async () => {
    setIsSubmitting(true);
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStep('Creating master plan...');
    
    try {
      // Create unique identifiers
      const newSprintId = `sprint_${Date.now()}`;
      const newChannelName = `sprint-generation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSprintId(newSprintId);
      setChannelName(newChannelName);
      
      // Set up channel to listen for master plan completion
      const channel = supabase.channel(newChannelName);
      
      channel
        .on('broadcast', { event: 'structure-generation-started' }, () => {
          setGenerationStep('Creating master plan...');
        })
        .on('broadcast', { event: 'structure-generated' }, (payload) => {
          console.log('Master plan generated:', payload.payload);
          setIsGenerating(false);
          supabase.removeChannel(channel);
          
          // Navigate to master plan review page
          const masterPlanData = encodeURIComponent(JSON.stringify(payload.payload.structure));
          const formDataEncoded = encodeURIComponent(JSON.stringify(formData));
          navigate(`/master-plan-review?masterPlan=${masterPlanData}&formData=${formDataEncoded}&sprintId=${newSprintId}&channelName=${newChannelName}`);
        })
        .subscribe();
      
      // Start master plan generation only
      const { error: structuredError } = await supabase.functions.invoke('generate-sprint-structured', {
        body: {
          formData: formData,
          sprintId: newSprintId,
          channelName: newChannelName,
          phase: 'master-plan-only'
        }
      });
      
      if (structuredError) {
        throw new Error(structuredError.message || 'Failed to start master plan generation');
      }
      
    } catch (error) {
      console.error('Master plan generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate master plan.",
        variant: "destructive",
      });
      setIsGenerating(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async (editedContent: GeneratedContent) => {
    try {
      // Save to localStorage for now - in production you'd send to your backend
      localStorage.setItem(`sprint_${editedContent.sprintId}`, JSON.stringify(editedContent));
      
      toast({
        title: "Sprint Finalized Successfully! 🎉",
        description: "Your sprint has been saved and is ready to use.",
      });

      // Reset form after successful finalization
      setFormData(initialFormData);
      setCurrentStep(1);
      setGeneratedContent(null);
      setShowReviewPage(false);
    } catch (error) {
      console.error('Sprint finalization error:', error);
      toast({
        title: "Finalization Failed",
        description: "There was an error saving your sprint. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleBackToForm = () => {
    setShowReviewPage(false);
    setIsGenerating(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="creatorName" className="text-white text-sm font-medium">Your Name *</Label>
                <Input
                  id="creatorName"
                  placeholder="Enter your full name"
                  value={formData.creatorName}
                  onChange={(e) => handleInputChange('creatorName', e.target.value)}
                  className="mt-2 bg-[#2a2a2a] border-[#22DFDC]/30 text-white placeholder:text-[#CFCFCF]/50 focus:border-[#22DFDC] focus:ring-[#22DFDC]/20"
                />
              </div>

              <div>
                <Label htmlFor="creatorEmail" className="text-white text-sm font-medium">Email Address *</Label>
                <Input
                  id="creatorEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.creatorEmail}
                  onChange={(e) => handleInputChange('creatorEmail', e.target.value)}
                  className="mt-2 bg-[#2a2a2a] border-[#22DFDC]/30 text-white placeholder:text-[#CFCFCF]/50 focus:border-[#22DFDC] focus:ring-[#22DFDC]/20"
                />
              </div>

              <div>
                <Label htmlFor="creatorBio" className="text-white text-sm font-medium">About You</Label>
                <Textarea
                  id="creatorBio"
                  placeholder="Tell us about your background, expertise, and what drives you to create this sprint..."
                  value={formData.creatorBio}
                  onChange={(e) => handleInputChange('creatorBio', e.target.value)}
                  className="mt-2 min-h-[100px] bg-[#2a2a2a] border-[#22DFDC]/30 text-white placeholder:text-[#CFCFCF]/50 focus:border-[#22DFDC] focus:ring-[#22DFDC]/20"
                />
              </div>

              <div>
                <Label htmlFor="experience" className="text-white text-sm font-medium">Your Experience Level</Label>
                <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                  <SelectTrigger className="mt-2 bg-[#2a2a2a] border-[#22DFDC]/30 text-white focus:border-[#22DFDC] focus:ring-[#22DFDC]/20">
                    <SelectValue placeholder="Select your experience level" className="text-[#CFCFCF]/50" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a2a] border-[#22DFDC]/30">
                    <SelectItem value="beginner" className="text-white hover:bg-[#22DFDC]/10">Beginner - New to creating content</SelectItem>
                    <SelectItem value="intermediate" className="text-white hover:bg-[#22DFDC]/10">Intermediate - Some experience with courses/content</SelectItem>
                    <SelectItem value="advanced" className="text-white hover:bg-[#22DFDC]/10">Advanced - Experienced creator/coach</SelectItem>
                    <SelectItem value="expert" className="text-white hover:bg-[#22DFDC]/10">Expert - Industry professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-secondary bg-clip-text text-transparent">
                Design Your Sprint
              </h2>
              <p className="text-muted-foreground mt-2">
                Shape the core of your transformational experience
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="sprintTitle">Sprint Title *</Label>
                <Input
                  id="sprintTitle"
                  placeholder="e.g., 'Enough.' - 21 Days to Unshakeable Self-Worth"
                  value={formData.sprintTitle}
                  onChange={(e) => handleInputChange('sprintTitle', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sprintDescription">Sprint Description *</Label>
                <Textarea
                  id="sprintDescription"
                  placeholder="Describe what participants will learn, experience, and achieve in this sprint..."
                  value={formData.sprintDescription}
                  onChange={(e) => handleInputChange('sprintDescription', e.target.value)}
                  className="mt-1 min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sprintDuration">Duration</Label>
                  <Select value={formData.sprintDuration} onValueChange={(value) => handleInputChange('sprintDuration', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="14">14 Days</SelectItem>
                      <SelectItem value="21">21 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="40">40 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sprintCategory">Category</Label>
                  <Select value={formData.sprintCategory} onValueChange={(value) => handleInputChange('sprintCategory', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          Health & Wellness
                        </div>
                      </SelectItem>
                      <SelectItem value="wealth">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Wealth & Finance
                        </div>
                      </SelectItem>
                      <SelectItem value="relationships">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Relationships
                        </div>
                      </SelectItem>
                      <SelectItem value="personal">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4" />
                          Personal Development
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Working mothers, New entrepreneurs, College students..."
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="goals">Primary Goals</Label>
                <Textarea
                  id="goals"
                  placeholder="What specific outcomes do you want participants to achieve?"
                  value={formData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Content & Style
              </h2>
              <p className="text-muted-foreground mt-2">
                How do you want to create and deliver your content?
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">Content Generation Preference</Label>
                <RadioGroup 
                  value={formData.contentGeneration} 
                  onValueChange={(value) => handleInputChange('contentGeneration', value)}
                  className="mt-3"
                >
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="ai" id="ai" />
                    <Label htmlFor="ai" className="flex-1 cursor-pointer">
                      <div className="font-medium">AI-Powered Creation</div>
                      <div className="text-sm text-muted-foreground">Let AI write scripts and content based on your input, then customize</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="hybrid" id="hybrid" />
                    <Label htmlFor="hybrid" className="flex-1 cursor-pointer">
                      <div className="font-medium">Hybrid Approach</div>
                      <div className="text-sm text-muted-foreground">AI helps with outlines and drafts, you write the final content</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="manual" id="manual" />
                    <Label htmlFor="manual" className="flex-1 cursor-pointer">
                      <div className="font-medium">Manual Creation</div>
                      <div className="text-sm text-muted-foreground">You'll write all content yourself with template guidance</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-semibold">Content Types (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {[
                    { id: 'text', label: 'Written Lessons' },
                     { id: 'challenges', label: 'Daily Challenges' },
                     { id: 'affirmations', label: 'Affirmations' },
                     { id: 'exercises', label: 'Practical Exercises' },
                  ].map((type) => (
                    <div key={type.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={type.id}
                        checked={formData.contentTypes.includes(type.id)}
                        onCheckedChange={(checked) => handleContentTypeChange(type.id, checked as boolean)}
                      />
                      <Label htmlFor={type.id} className="text-sm cursor-pointer">{type.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="toneStyle">Tone & Style</Label>
                <Select value={formData.toneStyle} onValueChange={(value) => handleInputChange('toneStyle', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="encouraging">Encouraging & Supportive</SelectItem>
                    <SelectItem value="motivational">Motivational & Energetic</SelectItem>
                    <SelectItem value="gentle">Gentle & Nurturing</SelectItem>
                    <SelectItem value="professional">Professional & Informative</SelectItem>
                    <SelectItem value="conversational">Conversational & Friendly</SelectItem>
                    <SelectItem value="inspiring">Inspiring & Uplifting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="voiceStyle">Voice Style for Audio Generation</Label>
                <Select value={formData.voiceStyle} onValueChange={(value) => handleInputChange('voiceStyle', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    <SelectItem value="warm-coach">Warm Coach - Encouraging & Patient</SelectItem>
                    <SelectItem value="strong-mentor">Strong Mentor - Confident & Wise</SelectItem>
                    <SelectItem value="wise-guide">Wise Guide - Calm & Transformational</SelectItem>
                    <SelectItem value="motivational-speaker">Motivational Speaker - Dynamic & Inspiring</SelectItem>
                    <SelectItem value="trusted-friend">Trusted Friend - Warm & Relatable</SelectItem>
                    <SelectItem value="professional-trainer">Professional Trainer - Clear & Competent</SelectItem>
                    <SelectItem value="compassionate-counselor">Compassionate Counselor - Gentle & Safe</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose the voice personality that will narrate your entire sprint consistently
                </p>
              </div>

              <div>
                <Label htmlFor="voiceSample">Voice Sample for Cloning (Optional)</Label>
                <Input
                  id="voiceSample"
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a"
                  onChange={handleVoiceFileChange}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a clear 30-60 second audio sample for AI voice cloning (optional)
                </p>
                 {formData.voiceSampleFile && (
                   <p className="text-sm text-green-600 mt-1">
                     ✓ File selected: {formData.voiceSampleFile.name}
                   </p>
                 )}
               </div>

               <div>
                 <Label htmlFor="writingStyle">Writing Style Sample (Optional)</Label>
                 <Input
                   id="writingStyle"
                   type="file"
                   accept=".txt,.docx,.pdf"
                   onChange={handleWritingStyleFileChange}
                   className="mt-1"
                 />
                 <p className="text-sm text-muted-foreground mt-1">
                   Upload a document example of your writing style for AI to mimic (optional)
                 </p>
                 {formData.writingStyleFile && (
                   <p className="text-sm text-green-600 mt-1">
                     ✓ File selected: {formData.writingStyleFile.name}
                   </p>
                 )}
               </div>
             </div>
           </div>
         );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Final Details
              </h2>
              <p className="text-muted-foreground mt-2">
                Any special requirements or webhook URL for processing
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="specialRequirements">Special Requirements</Label>
                <Textarea
                  id="specialRequirements"
                  placeholder="Any specific requests, special considerations, or additional information..."
                  value={formData.specialRequirements}
                  onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="participantEmails">Participant Email List</Label>
                <Textarea
                  id="participantEmails"
                  placeholder="Enter participant emails separated by commas:\nexample1@email.com, example2@email.com, example3@email.com"
                  value={formData.participantEmails}
                  onChange={(e) => handleInputChange('participantEmails', e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  List all participant emails who will receive the daily sprint content
                </p>
              </div>


              <div className="bg-gradient-card p-6 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-lg mb-3">Sprint Summary</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Title:</strong> {formData.sprintTitle || 'Not specified'}</div>
                  <div><strong>Duration:</strong> {formData.sprintDuration} days</div>
                  <div><strong>Category:</strong> {formData.sprintCategory || 'Not specified'}</div>
                  <div><strong>Content Generation:</strong> {formData.contentGeneration}</div>
                  <div><strong>Content Types:</strong> {formData.contentTypes.join(', ') || 'None selected'}</div>
                  <div><strong>Tone:</strong> {formData.toneStyle}</div>
                  <div><strong>Participants:</strong> {formData.participantEmails ? formData.participantEmails.split(',').length : 0} people</div>
                   <div><strong>Voice Sample:</strong> {formData.voiceSampleFile ? 'Uploaded' : 'None'}</div>
                   <div><strong>Writing Style:</strong> {formData.writingStyleFile ? 'Uploaded' : 'None'}</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.creatorName.trim() && formData.creatorEmail.trim() && formData.creatorEmail.includes('@');
      case 2:
        return formData.sprintTitle.trim() && formData.sprintDescription.trim() && formData.sprintCategory;
      case 3:
        return formData.contentGeneration && formData.contentTypes.length > 0;
      case 4:
        return formData.participantEmails.trim(); // Require at least some participant emails
      default:
        return false;
    }
  };

  // Show loading screen during generation
  if (isGenerating && !showReviewPage) {
    return (
      <SprintGenerationLoading
        sprintTitle={formData.sprintTitle}
        sprintDuration={formData.sprintDuration}
        creatorName={formData.creatorName}
        currentStep={generationStep}
        progress={generationProgress}
      />
    );
  }

  // Show review page after generation
  if (showReviewPage && generatedContent) {
    return (
      <SprintReviewPage
        generatedContent={generatedContent}
        onBack={handleBackToForm}
        onFinalize={handleFinalize}
      />
    );
  }

  // Show master plan review
  if (showMasterPlanReview && masterPlan) {
    return (
      <MasterPlanReview
        masterPlan={masterPlan}
        formData={formData}
        sprintId={sprintId}
        channelName={channelName}
        onBack={() => setShowMasterPlanReview(false)}
      />
    );
  }

  // Show form by default
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Gradient Border Container */}
      <div className="relative before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-tr before:from-[#22DFDC] before:to-[#22EDB6] before:p-[2px]">
        <div className="relative bg-[#111111] backdrop-blur-md border border-[#22DFDC]/20 rounded-3xl p-8">
          
          {/* Header with Back Button */}
          <div className="mb-8">
            <button 
              onClick={() => window.history.back()}
              className="text-[#22DFDC] hover:text-[#22EDB6] transition-colors mb-6 flex items-center gap-2"
            >
              ← Back to Overview
            </button>
            
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Create Your
              </h1>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] bg-clip-text text-transparent">
                Transformational Sprint
              </h2>
              <p className="text-[#CFCFCF] mt-4 opacity-70">
                Turn your expertise into a powerful, community-driven experience that creates lasting change
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr,60px] gap-8">
            {/* Main Content */}
            <div>
              {/* Inner Card */}
              <div className="bg-[#1E1E1E]/70 backdrop-blur-md border border-[#22DFDC]/20 rounded-2xl p-6">
                
                {/* Step Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #22DFDC, #22EDB6)' }}
                    >
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        Create Your Sprint
                      </h3>
                      <p className="text-[#CFCFCF] text-sm">
                        Step {currentStep} of {totalSteps}
                      </p>
                    </div>
                  </div>
                  
                  {/* Step Content Title */}
                  <div className="border-b border-[#22DFDC]/20 pb-4 mb-6">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #22DFDC, #22EDB6)' }}>
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] bg-clip-text text-transparent text-center">
                      Tell us about yourself
                    </h4>
                    <p className="text-[#CFCFCF] text-center mt-2 opacity-70">
                      Let's get to know the amazing person behind this sprint
                    </p>
                  </div>
                </div>

                {/* Form Content */}
                <div className="space-y-6">
                  {renderStep()}
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-[#22DFDC]/20">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 text-[#CFCFCF] hover:text-white hover:bg-[#22DFDC]/10"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  
                  {currentStep < totalSteps ? (
                    <Button
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="flex items-center gap-2 text-white"
                      style={{ 
                        background: 'linear-gradient(135deg, #22DFDC, #22EDB6)',
                        border: 'none'
                      }}
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!canProceed() || isSubmitting}
                      className="flex items-center gap-2 text-white"
                      style={{ 
                        background: 'linear-gradient(135deg, #22DFDC, #22EDB6)',
                        border: 'none'
                      }}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Sprint'}
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Vertical Progress Bar */}
            <div className="hidden lg:flex flex-col items-center">
              <div className="text-sm text-[#CFCFCF] mb-2">Progress</div>
              <div className="text-lg font-bold bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] bg-clip-text text-transparent mb-4">
                {Math.round(progress)}%
              </div>
              
              {/* Vertical Progress Container */}
              <div className="relative h-48 w-1 bg-[#22DFDC]/20 rounded-full overflow-hidden">
                <div
                  className="absolute bottom-0 w-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    height: `${progress}%`,
                    background: 'linear-gradient(to top, #22DFDC, #22EDB6)'
                  }}
                />
              </div>
              
              {/* Step Indicators */}
              <div className="flex flex-col gap-4 mt-4">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i + 1}
                    className={`w-3 h-3 rounded-full border-2 transition-all ${
                      i + 1 <= currentStep
                        ? 'bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] border-transparent'
                        : 'border-[#22DFDC]/40 bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Component */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1E1E1E] border border-[#22DFDC]/20 rounded-2xl p-8 text-center">
            <div className="text-white text-xl mb-4">{generationStep}</div>
            <div className="w-64 h-2 bg-[#22DFDC]/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};