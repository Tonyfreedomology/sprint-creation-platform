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
import { ArrowRight, ArrowLeft, Sparkles, Users, Brain, Heart, DollarSign, CheckCircle, Upload, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SprintGenerationLoading } from './SprintGenerationLoading';
import { SprintReviewPage } from './SprintReviewPage';
import { OpenAIKeyModal } from './OpenAIKeyModal';
import { VoiceRecorder } from './VoiceRecorder';
import StyledDropdown from './StyledDropdown';
import { SkeuToggle } from '@/components/ui/skeu-toggle';
import ConfettiButton from './ConfettiButton';
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
  voiceGender?: string;
  voiceSampleFile: File | null;
  voiceRecordingBlob: Blob | null;
  writingStyleFile: File | null;
  writingStyleAnalysis?: string;
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
  // Creator information - prefilled for testing
  creatorName: 'Tony',
  creatorEmail: 'tony@freedomology.com',
  creatorBio: "I'm a creator, coach, and co-founder at Freedomology—on a mission to help people build lives full of purpose, energy, and deep alignment. I've led teams, built brands, and walked with people through real transformation in their health, relationships, and mindset. I'm creating this sprint because I've seen firsthand how much power there is in structured momentum—and I'm all in on making change stick.",

  // Sprint details - prefilled for testing
  sprintTitle: 'Magnetic – 7 Days to Lead Your Marriage with Confidence & Desire',
  sprintDescription: 'This sprint is for married men who want to reignite desire, reclaim their masculine presence, and lead with confidence in the bedroom and beyond. Through daily challenges, reflections, and practices, you\'ll learn how to embody sexual leadership, deepen connection, and create a relationship that pulses with attraction and trust.',
  sprintDuration: '7',
  sprintCategory: 'relationships',
  
  // Target audience and content - prefilled for testing
  targetAudience: 'Married men, Christian husbands, dads in their 30s and 40s, recovering nice guys',
  contentGeneration: 'ai',
  contentTypes: ['written-lessons', 'audio-lessons', 'daily-emails', 'challenges'],
  toneStyle: '',
  experience: 'intermediate',
  goals: '• Build strong masculine frame\n• Lead sexually with clarity and confidence\n• Increase intimacy and sexual frequency\n• Rewire approval-seeking habits\n• Establish daily habits of touch, eye contact, and pursuit',
  specialRequirements: '',
  voiceStyle: 'warm-coach',
  voiceGender: 'female',
  voiceSampleFile: null,
  voiceRecordingBlob: null,
  writingStyleFile: null,
  writingStyleAnalysis: undefined,
  participantEmails: 'tony@freedomology.com',
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
  const [isAnalyzingWritingStyle, setIsAnalyzingWritingStyle] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isCreatingVoiceClone, setIsCreatingVoiceClone] = useState(false);

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

  const handleWritingStyleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, writingStyleFile: file }));
    
    if (file) {
      await analyzeWritingStyle(file);
    }
  };

  const handleVoiceRecordingComplete = (audioBlob: Blob) => {
    setFormData(prev => ({ ...prev, voiceRecordingBlob: audioBlob }));
    setShowVoiceRecorder(false);
    toast({
      title: "Voice recorded successfully",
      description: "Your voice sample has been saved",
    });
  };

  const analyzeWritingStyle = async (file: File) => {
    setIsAnalyzingWritingStyle(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data, error } = await supabase.functions.invoke('analyze-writing-style', {
        body: formData,
      });
      
      if (error) throw error;
      
      if (data?.success) {
        setFormData(prev => ({ 
          ...prev, 
          writingStyleAnalysis: data.styleAnalysis 
        }));
        
        toast({
          title: "Writing style analyzed",
          description: "Your writing style has been analyzed and will be used to personalize content",
        });
      } else {
        throw new Error(data?.error || 'Failed to analyze writing style');
      }
      
    } catch (error: any) {
      console.error('Writing style analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze writing style. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingWritingStyle(false);
    }
  };

  const createVoiceClone = async (formData: SprintFormData, sprintId: string): Promise<string | null> => {
    if (!formData.voiceRecordingBlob && !formData.voiceSampleFile) {
      return null;
    }

    setIsCreatingVoiceClone(true);
    
    try {
      const hasVoiceSample = formData.voiceSampleFile || formData.voiceRecordingBlob;
      if (!hasVoiceSample) return null;

      console.log('Creating custom voice for sprint:', sprintId);
      
      // Create voice clone using ElevenLabs with the uploaded audio
      const voiceName = `${formData.creatorName}_${sprintId}`;
      
      // Create form data for the audio file
      const formData_upload = new FormData();
      formData_upload.append('voiceName', voiceName);
      
      // Use the voice recording blob if available
      if (formData.voiceRecordingBlob && Object.keys(formData.voiceRecordingBlob).length > 0) {
        const audioBlob = formData.voiceRecordingBlob;
        formData_upload.append('audioFile', audioBlob, 'voice_sample.wav');
      } else if (formData.voiceSampleFile) {
        formData_upload.append('audioFile', formData.voiceSampleFile);
      } else {
        throw new Error('No audio file available for voice cloning');
      }
      
      const { data, error } = await supabase.functions.invoke('clone-voice-elevenlabs', {
        body: formData_upload,
      });
      
      if (error) {
        console.error('Voice creation error:', error);
        throw new Error(error.message || 'Failed to create custom voice');
      }
      
      if (data.success) {
        console.log('Custom voice created successfully:', data.voiceId);
        toast({
          title: "Custom voice created",
          description: `Successfully created voice: ${data.voiceName}`,
        });
        return data.voiceId;
      } else {
        throw new Error(data.error || 'Voice creation failed');
      }
      
    } catch (error: any) {
      console.error('Voice cloning error:', error);
      toast({
        title: "Voice cloning failed",
        description: error.message || "Failed to create voice clone. Using default voice instead.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreatingVoiceClone(false);
    }
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
       
       // Step 1: Create voice clone if voice sample is provided
       let clonedVoiceId: string | null = null;
       if (formData.voiceRecordingBlob || formData.voiceSampleFile) {
         setGenerationStep('Creating voice clone...');
         console.log('Voice sample detected, creating voice clone...');
         clonedVoiceId = await createVoiceClone(formData, newSprintId);
       }

       // Update form data with cloned voice ID
       const updatedFormData = {
         ...formData,
         voiceId: clonedVoiceId || undefined,
       };
       
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
           
           // Navigate to master plan review page with updated form data
           const masterPlanData = encodeURIComponent(JSON.stringify(payload.payload.structure));
           const formDataEncoded = encodeURIComponent(JSON.stringify(updatedFormData));
           navigate(`/master-plan-review?masterPlan=${masterPlanData}&formData=${formDataEncoded}&sprintId=${newSprintId}&channelName=${newChannelName}`);
         })
         .subscribe();
       
       // Start master plan generation only
       const { error: structuredError } = await supabase.functions.invoke('generate-sprint-structured', {
         body: {
           formData: updatedFormData,
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
                  className="mt-2 bg-[#1E1E1E]/70 backdrop-blur border border-white/10 rounded px-4 py-3 text-white placeholder:text-white/50 focus:border-[#22DFDC] outline-none transition"
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
                  className="mt-2 bg-[#1E1E1E]/70 backdrop-blur border border-white/10 rounded px-4 py-3 text-white placeholder:text-white/50 focus:border-[#22DFDC] outline-none transition"
                />
              </div>

              <div>
                <Label htmlFor="creatorBio" className="text-white text-sm font-medium">About You</Label>
                <Textarea
                  id="creatorBio"
                  placeholder="Tell us about your background, expertise, and what drives you to create this sprint..."
                  value={formData.creatorBio}
                  onChange={(e) => handleInputChange('creatorBio', e.target.value)}
                  className="mt-2 min-h-[100px] bg-[#1E1E1E]/70 backdrop-blur border border-white/10 rounded px-4 py-3 text-white placeholder:text-white/50 focus:border-[#22DFDC] outline-none transition"
                />
              </div>

              <div>
                <Label htmlFor="experience" className="text-white text-sm font-medium">Your Experience Level</Label>
                <StyledDropdown
                  options={[
                    { value: 'beginner', label: 'Beginner', description: 'New to creating content' },
                    { value: 'intermediate', label: 'Intermediate', description: 'Some experience with courses/content' },
                    { value: 'advanced', label: 'Advanced', description: 'Experienced creator/coach' },
                    { value: 'expert', label: 'Expert', description: 'Industry professional' },
                  ]}
                  value={formData.experience}
                  onChange={(value) => handleInputChange('experience', value)}
                  placeholder="Select your experience level"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sprintTitle" className="text-white text-sm font-medium">Sprint Title *</Label>
                <Input
                  id="sprintTitle"
                  placeholder="e.g., 'Enough.' - 21 Days to Unshakeable Self-Worth"
                  value={formData.sprintTitle}
                  onChange={(e) => handleInputChange('sprintTitle', e.target.value)}
                  className="mt-2 bg-[#1E1E1E]/70 backdrop-blur border border-white/10 rounded px-4 py-3 text-white placeholder:text-white/50 focus:border-[#22DFDC] outline-none transition"
                />
              </div>

              <div>
                <Label htmlFor="sprintDescription" className="text-white text-sm font-medium">Sprint Description *</Label>
                <Textarea
                  id="sprintDescription"
                  placeholder="Describe what participants will learn, experience, and achieve in this sprint..."
                  value={formData.sprintDescription}
                  onChange={(e) => handleInputChange('sprintDescription', e.target.value)}
                  className="mt-2 min-h-[120px] bg-[#1E1E1E]/70 backdrop-blur border border-white/10 rounded px-4 py-3 text-white placeholder:text-white/50 focus:border-[#22DFDC] outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sprintDuration" className="text-white text-sm font-medium">Duration</Label>
                  <StyledDropdown
                    options={[
                      { value: '7', label: '7 Days' },
                      { value: '14', label: '14 Days' },
                      { value: '21', label: '21 Days' },
                      { value: '30', label: '30 Days' },
                      { value: '40', label: '40 Days' },
                    ]}
                    value={formData.sprintDuration}
                    onChange={(value) => handleInputChange('sprintDuration', value)}
                    placeholder="Select duration"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="sprintCategory" className="text-white text-sm font-medium">Category</Label>
                  <StyledDropdown
                    options={[
                      { 
                        value: 'health', 
                        label: 'Health & Wellness',
                        icon: <Heart className="w-4 h-4" />
                      },
                      { 
                        value: 'wealth', 
                        label: 'Wealth & Finance',
                        icon: <DollarSign className="w-4 h-4" />
                      },
                      { 
                        value: 'relationships', 
                        label: 'Relationships',
                        icon: <Users className="w-4 h-4" />
                      },
                      { 
                        value: 'personal', 
                        label: 'Personal Development',
                        icon: <Brain className="w-4 h-4" />
                      },
                    ]}
                    value={formData.sprintCategory}
                    onChange={(value) => handleInputChange('sprintCategory', value)}
                    placeholder="Select category"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="targetAudience" className="text-white text-sm font-medium">Target Audience</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Working mothers, New entrepreneurs, College students..."
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  className="mt-2 bg-[#1E1E1E]/70 backdrop-blur border border-white/10 rounded px-4 py-3 text-white placeholder:text-white/50 focus:border-[#22DFDC] outline-none transition"
                />
              </div>

              <div>
                <Label htmlFor="goals" className="text-white text-sm font-medium">Primary Goals</Label>
                <Textarea
                  id="goals"
                  placeholder="What specific outcomes do you want participants to achieve?"
                  value={formData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  className="mt-2 bg-[#1E1E1E]/70 backdrop-blur border border-white/10 rounded px-4 py-3 text-white placeholder:text-white/50 focus:border-[#22DFDC] outline-none transition"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-6">
              <div>
                <Label className="text-white text-sm font-medium mb-3 block">Content Types</Label>
                <StyledDropdown
                  multiple
                  options={[
                    { 
                      value: 'written-lessons', 
                      label: 'Written Lessons',
                      description: 'Daily text-based content and exercises',
                      icon: <FileText className="w-4 h-4" />
                    },
                    { 
                      value: 'audio-lessons', 
                      label: 'Audio Lessons',
                      description: 'Voice-narrated content for on-the-go learning',
                      icon: <Brain className="w-4 h-4" />
                    },
                    { 
                      value: 'daily-emails', 
                      label: 'Daily Emails',
                      description: 'Motivational emails to keep participants engaged',
                      icon: <Heart className="w-4 h-4" />
                    },
                    { 
                      value: 'challenges', 
                      label: 'Daily Challenges',
                      description: 'Action-oriented tasks and exercises',
                      icon: <Sparkles className="w-4 h-4" />
                    },
                  ]}
                  values={formData.contentTypes}
                  onMultiChange={(values) => setFormData(prev => ({ ...prev, contentTypes: values }))}
                  placeholder="Select content types..."
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="toneStyle" className="text-white text-sm font-medium">Tone & Style</Label>
                <StyledDropdown
                  options={[
                    { value: 'encouraging', label: 'Encouraging & Supportive' },
                    { value: 'motivational', label: 'Motivational & Energetic' },
                    { value: 'gentle', label: 'Gentle & Nurturing' },
                    { value: 'professional', label: 'Professional & Informative' },
                    { value: 'conversational', label: 'Conversational & Friendly' },
                    { value: 'inspiring', label: 'Inspiring & Uplifting' },
                  ]}
                  value={formData.toneStyle}
                  onChange={(value) => handleInputChange('toneStyle', value)}
                  placeholder="Select tone & style"
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-white text-sm font-medium mb-3 block">Voice Options</Label>
                <div className="space-y-4">
                  {/* Voice Gender Selection */}
                  <div className="flex justify-center">
                    <SkeuToggle
                      value={formData.voiceGender || 'female'}
                      onChange={(value) => handleInputChange('voiceGender', value)}
                    />
                  </div>

                  {/* Voice Style */}
                  <div>
                    <Label htmlFor="voiceStyle" className="text-white text-xs font-medium uppercase tracking-wide opacity-70">Voice Personality</Label>
                    <StyledDropdown
                      options={[
                        { value: 'warm-coach', label: 'Warm Coach', description: 'Encouraging & Patient' },
                        { value: 'strong-mentor', label: 'Strong Mentor', description: 'Confident & Wise' },
                        { value: 'wise-guide', label: 'Wise Guide', description: 'Calm & Transformational' },
                        { value: 'motivational-speaker', label: 'Motivational Speaker', description: 'Dynamic & Inspiring' },
                        { value: 'trusted-friend', label: 'Trusted Friend', description: 'Warm & Relatable' },
                        { value: 'professional-trainer', label: 'Professional Trainer', description: 'Clear & Competent' },
                        { value: 'compassionate-counselor', label: 'Compassionate Counselor', description: 'Gentle & Safe' },
                      ]}
                      value={formData.voiceStyle}
                      onChange={(value) => handleInputChange('voiceStyle', value)}
                      placeholder="Select voice style"
                      className="mt-2"
                    />
                  </div>

                  <div className="text-center text-white/50 text-xs uppercase tracking-wider">— OR —</div>

                  {/* Voice Sample Upload */}
                  <div className="space-y-3">
                    <Label className="text-white text-xs font-medium uppercase tracking-wide opacity-70">Upload Voice Sample</Label>
                    <div className="flex gap-3">
                      <label htmlFor="voiceSample" className="flex-1 cursor-pointer">
                        <div className="border border-white/20 rounded-lg px-4 py-3 bg-[#1E1E1E]/30 hover:bg-[#1E1E1E]/50 transition-colors">
                          <span className="text-white/70 text-sm">
                            {formData.voiceSampleFile ? formData.voiceSampleFile.name : 'Choose audio file...'}
                          </span>
                        </div>
                        <Input
                          id="voiceSample"
                          type="file"
                          accept="audio/*,.mp3,.wav,.m4a"
                          onChange={handleVoiceFileChange}
                          className="hidden"
                        />
                      </label>
                      <Button
                        type="button"
                        onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                        className="bg-[#22DFDC] hover:bg-[#22DFDC]/80 text-white px-4 py-2 text-sm"
                      >
                        {showVoiceRecorder ? 'Cancel' : 'Record'}
                      </Button>
                    </div>
                    
                    {/* Voice Recorder Component */}
                    {showVoiceRecorder && (
                      <div className="mt-4 p-4 border border-white/10 rounded-lg bg-[#1E1E1E]/20">
                        <VoiceRecorder 
                          onRecordingComplete={handleVoiceRecordingComplete}
                          maxDuration={60}
                        />
                      </div>
                    )}
                    
                    <p className="text-xs text-white/50">
                      Upload or record 30-60 seconds of clear speech for voice cloning
                    </p>
                    
                    {(formData.voiceSampleFile || formData.voiceRecordingBlob) && (
                      <p className="text-sm text-green-400 mt-1">
                        ✓ Voice sample ready: {formData.voiceSampleFile?.name || 'Recording saved'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-white text-sm font-medium mb-3 block">
                  Writing Style Sample (Optional)
                  {isAnalyzingWritingStyle && (
                    <span className="ml-2 text-xs text-[#22DFDC]">Analyzing...</span>
                  )}
                </Label>
                <label htmlFor="writingStyle" className="cursor-pointer block">
                  <div className="border border-white/20 rounded-lg px-4 py-3 bg-[#1E1E1E]/30 hover:bg-[#1E1E1E]/50 transition-colors flex items-center gap-3">
                    <FileText className="w-4 h-4 text-white/50" />
                    <span className="text-white/70 text-sm flex-1">
                      {formData.writingStyleFile ? formData.writingStyleFile.name : 'Choose document...'}
                    </span>
                    {isAnalyzingWritingStyle && (
                      <div className="w-4 h-4 border-2 border-[#22DFDC] border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                  <Input
                    id="writingStyle"
                    type="file"
                    accept=".txt,.docx,.pdf"
                    onChange={handleWritingStyleFileChange}
                    className="hidden"
                    disabled={isAnalyzingWritingStyle}
                  />
                </label>
                <p className="text-xs text-white/50 mt-2">
                  Upload a .txt document for AI to analyze and learn your writing style
                </p>
                {formData.writingStyleAnalysis && (
                  <div className="mt-3 p-3 bg-[#22DFDC]/10 border border-[#22DFDC]/20 rounded-lg">
                    <p className="text-xs text-[#22DFDC] font-medium mb-1">Style Analysis Complete</p>
                    <p className="text-xs text-white/70 line-clamp-3">{formData.writingStyleAnalysis}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="specialRequirements" className="text-white text-sm font-medium">Special Requirements</Label>
                <Textarea
                  id="specialRequirements"
                  placeholder="Any specific requests, special considerations, or additional information..."
                  value={formData.specialRequirements}
                  onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                  className="mt-2 bg-[#1E1E1E]/70 backdrop-blur border border-white/10 rounded px-4 py-3 text-white placeholder:text-white/50 focus:border-[#22DFDC] outline-none transition"
                />
              </div>

              <div>
                <Label htmlFor="participantEmails" className="text-white text-sm font-medium">Participant Email List</Label>
                <Textarea
                  id="participantEmails"
                  placeholder="Enter participant emails separated by commas:&#10;example1@email.com, example2@email.com, example3@email.com"
                  value={formData.participantEmails}
                  onChange={(e) => handleInputChange('participantEmails', e.target.value)}
                  className="mt-2 min-h-[100px] bg-[#1E1E1E]/70 backdrop-blur border border-white/10 rounded px-4 py-3 text-white placeholder:text-white/50 focus:border-[#22DFDC] outline-none transition"
                />
                <p className="text-sm text-white/70 mt-1">
                  List all participant emails who will receive the daily sprint content
                </p>
              </div>

              <div className="bg-[#1E1E1E]/50 p-6 rounded-lg border border-white/10">
                <h3 className="font-semibold text-lg mb-3 text-white">Sprint Summary</h3>
                <div className="space-y-2 text-sm text-white/80">
                  <div><strong className="text-white">Title:</strong> {formData.sprintTitle || 'Not specified'}</div>
                  <div><strong className="text-white">Duration:</strong> {formData.sprintDuration} days</div>
                  <div><strong className="text-white">Category:</strong> {formData.sprintCategory || 'Not specified'}</div>
                  <div><strong className="text-white">Content Generation:</strong> {formData.contentGeneration}</div>
                  <div><strong className="text-white">Content Types:</strong> {formData.contentTypes.join(', ') || 'None selected'}</div>
                  <div><strong className="text-white">Tone:</strong> {formData.toneStyle}</div>
                  <div><strong className="text-white">Participants:</strong> {formData.participantEmails ? formData.participantEmails.split(',').length : 0} people</div>
                   <div><strong className="text-white">Voice Sample:</strong> {formData.voiceSampleFile || formData.voiceRecordingBlob ? 'Ready' : 'None'}</div>
                   <div><strong className="text-white">Writing Style:</strong> {formData.writingStyleFile ? 'Uploaded' : 'None'}</div>
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

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Tell us about yourself";
      case 2: return "Design Your Sprint";
      case 3: return "Content & Style";
      case 4: return "Final Details";
      default: return "";
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 1: return Users;
      case 2: return Sparkles;
      case 3: return Brain;
      case 4: return CheckCircle;
      default: return Users;
    }
  };

  // Show form by default
  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="max-w-4xl mx-auto">
          {/* Form Container */}
          <div className="max-w-[540px] mx-auto">
            {/* Card with radial gradients */}
            <div className="card-wrapper">
              <div className="card-content">
                
                {/* Step Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#22EDB6] flex items-center justify-center text-[#242424]">
                      {React.createElement(getStepIcon(), { className: "w-5 h-5" })}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">
                        {getStepTitle()}
                      </h3>
                      <p className="text-xs text-[#CFCFCF] uppercase tracking-wide mt-0.5">
                        STEP {currentStep} OF {totalSteps}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] bg-clip-text text-transparent">
                        {Math.round(progress)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Thin divider */}
                  <div className="h-px bg-[#22DFDC]/20 mt-6"></div>
                </div>

                {/* Form Content */}
                <div className="space-y-6">
                  {renderStep()}
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="text-[#CFCFCF] hover:text-white hover:bg-[#22DFDC]/10"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  {currentStep < totalSteps ? (
                    <Button
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] text-white hover:opacity-90"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <ConfettiButton
                      onClick={handleSubmit}
                      disabled={!canProceed() || isSubmitting}
                      className="bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] text-white hover:opacity-90"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Sprint'}
                      <Sparkles className="w-4 h-4 ml-2" />
                    </ConfettiButton>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Component */}
        {(isGenerating || isCreatingVoiceClone) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1E1E1E] border border-[#22DFDC]/20 rounded-2xl p-8 text-center">
              <div className="text-white text-xl mb-4">
                {isCreatingVoiceClone ? 'Creating voice clone...' : generationStep}
              </div>
              <div className="w-64 h-2 bg-[#22DFDC]/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              {isCreatingVoiceClone && (
                <p className="text-white/70 text-sm mt-3">
                  Processing your voice sample with Hume AI...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};