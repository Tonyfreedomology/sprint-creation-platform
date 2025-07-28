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
  creatorName: 'Tony',
  creatorEmail: 'tony@freedomology.com',
  creatorBio: 'I\'m a creator, coach, and co-founder at Freedomology—on a mission to help people build lives full of purpose, energy, and deep alignment. I\'ve led teams, built brands, and walked with people through real transformation in their health, relationships, and mindset. I\'m creating this sprint because I\'ve seen firsthand how much power there is in structured momentum—and I\'m all in on making change stick.',
  sprintTitle: 'Magnetic – 21 Days to Lead Your Marriage with Confidence & Desire',
  sprintDescription: 'This sprint is for married men who want to reignite desire, reclaim their masculine presence, and lead with confidence in the bedroom and beyond. Through daily challenges, reflections, and practices, you\'ll learn how to embody sexual leadership, deepen connection, and create a relationship that pulses with attraction and trust.',
  sprintDuration: '21',
  sprintCategory: 'relationships',
  targetAudience: 'Married men, Christian husbands, dads in their 30s and 40s, recovering nice guys',
  contentGeneration: 'ai',
  contentTypes: [],
  toneStyle: 'encouraging',
  experience: 'intermediate',
  goals: '• Build strong masculine frame\n• Lead sexually with clarity and confidence\n• Increase intimacy and sexual frequency\n• Rewire approval-seeking habits\n• Establish daily habits of touch, eye contact, and pursuit',
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
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Tell us about yourself
              </h2>
              <p className="text-muted-foreground mt-2">
                Let's get to know the amazing person behind this sprint
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="creatorName">Your Name *</Label>
                <Input
                  id="creatorName"
                  placeholder="Enter your full name"
                  value={formData.creatorName}
                  onChange={(e) => handleInputChange('creatorName', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="creatorEmail">Email Address *</Label>
                <Input
                  id="creatorEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.creatorEmail}
                  onChange={(e) => handleInputChange('creatorEmail', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="creatorBio">About You</Label>
                <Textarea
                  id="creatorBio"
                  placeholder="Tell us about your background, expertise, and what drives you to create this sprint..."
                  value={formData.creatorBio}
                  onChange={(e) => handleInputChange('creatorBio', e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="experience">Your Experience Level</Label>
                <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - New to creating content</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Some experience with courses/content</SelectItem>
                    <SelectItem value="advanced">Advanced - Experienced creator/coach</SelectItem>
                    <SelectItem value="expert">Expert - Industry professional</SelectItem>
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
    <div className="max-w-2xl mx-auto">
      <Card className="border-primary/20 shadow-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Create Your Sprint</CardTitle>
              <CardDescription>
                Step {currentStep} of {totalSteps}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Progress</div>
              <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {Math.round(progress)}%
              </div>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        
        <CardContent>
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                variant="hero"
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="hero"
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? 'Creating...' : 'Create Sprint'}
                <Sparkles className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};