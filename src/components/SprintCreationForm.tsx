import React, { useState } from 'react';
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
  webhookUrl: string;
}

const initialFormData: SprintFormData = {
  creatorName: '',
  creatorEmail: '',
  creatorBio: '',
  sprintTitle: '',
  sprintDescription: '',
  sprintDuration: '21',
  sprintCategory: '',
  targetAudience: '',
  contentGeneration: 'ai',
  contentTypes: [],
  toneStyle: 'encouraging',
  experience: '',
  goals: '',
  specialRequirements: '',
  webhookUrl: '',
};

export const SprintCreationForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SprintFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
    
    try {
      const webhookUrl = formData.webhookUrl || 'https://your-n8n-webhook-url.com/webhook/sprint-creation';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
          source: 'freedomology-sprint-creator'
        }),
      });

      if (response.ok) {
        toast({
          title: "Sprint Creation Initiated! 🎉",
          description: "Your sprint is being processed. You'll receive an email with next steps shortly.",
        });
        
        // Reset form
        setFormData(initialFormData);
        setCurrentStep(1);
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                    { id: 'video', label: 'Video Lessons' },
                    { id: 'audio', label: 'Audio Messages' },
                    { id: 'text', label: 'Written Content' },
                    { id: 'exercises', label: 'Daily Exercises' },
                    { id: 'worksheets', label: 'Worksheets' },
                    { id: 'affirmations', label: 'Affirmations' },
                    { id: 'meditations', label: 'Guided Meditations' },
                    { id: 'challenges', label: 'Daily Challenges' },
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
                <Label htmlFor="webhookUrl">N8N Webhook URL (Optional)</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://your-n8n-instance.com/webhook/sprint-creation"
                  value={formData.webhookUrl}
                  onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty to use the default processing endpoint
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
        return formData.creatorName && formData.creatorEmail;
      case 2:
        return formData.sprintTitle && formData.sprintDescription && formData.sprintCategory;
      case 3:
        return formData.contentGeneration && formData.contentTypes.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

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