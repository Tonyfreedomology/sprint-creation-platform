import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Edit3, 
  Eye, 
  CheckCircle, 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Users, 
  Brain,
  Save,
  Send,
  Video,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { VideoGenerationService } from '@/services/videoGeneration';

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

interface SprintReviewPageProps {
  generatedContent: GeneratedContent;
  onBack: () => void;
  onFinalize: (editedContent: GeneratedContent) => void;
}

export const SprintReviewPage: React.FC<SprintReviewPageProps> = ({
  generatedContent,
  onBack,
  onFinalize
}) => {
  const [editedContent, setEditedContent] = useState<GeneratedContent>(generatedContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [generatingVideo, setGeneratingVideo] = useState<Record<number, boolean>>({});
  const [videoService] = useState(() => new VideoGenerationService());

  const handleLessonChange = (dayIndex: number, field: string, value: string) => {
    setEditedContent(prev => ({
      ...prev,
      dailyLessons: prev.dailyLessons.map((lesson, index) => 
        index === dayIndex ? { ...lesson, [field]: value } : lesson
      )
    }));
  };

  const handleEmailChange = (dayIndex: number, field: string, value: string) => {
    setEditedContent(prev => ({
      ...prev,
      emailSequence: prev.emailSequence.map((email, index) => 
        index === dayIndex ? { ...email, [field]: value } : email
      )
    }));
  };

  const handleSprintInfoChange = (field: string, value: string) => {
    setEditedContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveDraft = () => {
    // Save to localStorage for now
    localStorage.setItem(`sprint-draft-${editedContent.sprintId}`, JSON.stringify(editedContent));
    toast({
      title: "Draft Saved",
      description: "Your changes have been saved locally.",
    });
  };

  const handleCreateVideo = async (dayIndex: number) => {
    const lesson = editedContent.dailyLessons[dayIndex];
    const dayNumber = lesson.day;

    // Set loading state for this specific day
    setGeneratingVideo(prev => ({ ...prev, [dayNumber]: true }));

    try {
      toast({
        title: "Creating Video",
        description: `Starting video generation for Day ${dayNumber}...`,
      });

      // Check if audio file exists for this lesson
      // In a real implementation, you'd get this from your sprint data
      const audioUrl = `https://example.com/audio/sprint-${editedContent.sprintId}/day-${dayNumber}.mp3`;
      
      // Create video using the VideoGenerationService
      const videoOptions = {
        sprintId: editedContent.sprintId,
        sprintTitle: editedContent.sprintTitle,
        dailyLessons: [lesson], // Single lesson
        audioFiles: { [dayNumber.toString()]: audioUrl },
        brandColors: {
          primary: '#22DFDC',   // Cyan
          secondary: '#22EDB6', // Jade  
          accent: '#242424'     // Dark grey
        }
      };

      console.log('Creating video for lesson:', {
        day: dayNumber,
        title: lesson.title,
        contentLength: lesson.content.length,
        videoOptions
      });

      // For now, simulate the video creation (replace with actual service call)
      // const videoUrl = await videoService.generateSprintVideos(videoOptions);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate longer process

      toast({
        title: "Video Created Successfully! 🎬",
        description: `Video for "${lesson.title}" is ready to view.`,
      });

    } catch (error) {
      console.error('Error creating video:', error);
      toast({
        title: "Video Creation Failed",
        description: `Failed to create video for Day ${dayNumber}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      // Clear loading state
      setGeneratingVideo(prev => ({ ...prev, [dayNumber]: false }));
    }
  };

  const handleFinalize = async () => {
    setIsSubmitting(true);
    try {
      await onFinalize(editedContent);
      toast({
        title: "Sprint Finalized! 🎉",
        description: "Your sprint has been created and is ready to launch.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to finalize sprint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={onBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Form
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
                  Review Your Sprint
                </h1>
                <p className="text-xl text-muted-foreground">
                  Edit the AI-generated content to match your vision perfectly
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleSaveDraft}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button 
                  variant="hero" 
                  onClick={handleFinalize}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Finalizing...' : 'Finalize Sprint'}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lessons">Daily Lessons</TabsTrigger>
              <TabsTrigger value="emails">Email Sequence</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="border-primary/20 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5" />
                    Sprint Information
                  </CardTitle>
                  <CardDescription>
                    Review and edit your sprint's basic details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Sprint Title</Label>
                    <Input
                      id="title"
                      value={editedContent.sprintTitle}
                      onChange={(e) => handleSprintInfoChange('sprintTitle', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editedContent.sprintDescription}
                      onChange={(e) => handleSprintInfoChange('sprintDescription', e.target.value)}
                      className="mt-1 min-h-[120px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Duration</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">
                          <Calendar className="w-4 h-4 mr-1" />
                          {editedContent.sprintDuration} Days
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Category</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">
                          <Brain className="w-4 h-4 mr-1" />
                          {editedContent.sprintCategory}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Daily Lessons Tab */}
            <TabsContent value="lessons" className="space-y-6">
              <Card className="border-primary/20 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5" />
                    Daily Lessons
                  </CardTitle>
                  <CardDescription>
                    Edit the content for each day of your sprint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {editedContent.dailyLessons.map((lesson, index) => (
                      <div key={index} className="border rounded-lg p-6 bg-gradient-card">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                            {lesson.day}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">Day {lesson.day}</h3>
                            <p className="text-muted-foreground">Daily content and exercise</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`lesson-title-${index}`}>Lesson Title</Label>
                            <Input
                              id={`lesson-title-${index}`}
                              value={lesson.title}
                              onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`lesson-content-${index}`}>Lesson Content</Label>
                            <Textarea
                              id={`lesson-content-${index}`}
                              value={lesson.content}
                              onChange={(e) => handleLessonChange(index, 'content', e.target.value)}
                              className="mt-1 min-h-[100px]"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`lesson-exercise-${index}`}>Daily Exercise</Label>
                            <Textarea
                              id={`lesson-exercise-${index}`}
                              value={lesson.exercise}
                              onChange={(e) => handleLessonChange(index, 'exercise', e.target.value)}
                              className="mt-1 min-h-[80px]"
                            />
                          </div>
                          
                          {lesson.affirmation && (
                            <div>
                              <Label htmlFor={`lesson-affirmation-${index}`}>Daily Affirmation</Label>
                              <Input
                                id={`lesson-affirmation-${index}`}
                                value={lesson.affirmation}
                                onChange={(e) => handleLessonChange(index, 'affirmation', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          )}
                          
                          {/* Video Generation Button */}
                          <div className="pt-4 border-t border-border/50">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateVideo(index)}
                              disabled={generatingVideo[lesson.day]}
                              className="w-full flex items-center gap-2"
                            >
                              {generatingVideo[lesson.day] ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Creating Video...
                                </>
                              ) : (
                                <>
                                  <Video className="w-4 h-4" />
                                  Create Video Lesson
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Sequence Tab */}
            <TabsContent value="emails" className="space-y-6">
              <Card className="border-primary/20 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5" />
                    Email Sequence
                  </CardTitle>
                  <CardDescription>
                    Review and edit the daily emails that will be sent to participants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {editedContent.emailSequence.map((email, index) => (
                      <div key={index} className="border rounded-lg p-6 bg-gradient-card">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center text-white font-bold">
                            {email.day}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">Day {email.day} Email</h3>
                            <p className="text-muted-foreground">Automated email content</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`email-subject-${index}`}>Subject Line</Label>
                            <Input
                              id={`email-subject-${index}`}
                              value={email.subject}
                              onChange={(e) => handleEmailChange(index, 'subject', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`email-content-${index}`}>Email Content</Label>
                            <Textarea
                              id={`email-content-${index}`}
                              value={email.content}
                              onChange={(e) => handleEmailChange(index, 'content', e.target.value)}
                              className="mt-1 min-h-[150px]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              <Card className="border-primary/20 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Sprint Preview
                  </CardTitle>
                  <CardDescription>
                    See how your sprint will look to participants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center p-8 bg-gradient-hero text-white rounded-lg">
                      <h1 className="text-3xl font-bold mb-4">{editedContent.sprintTitle}</h1>
                      <p className="text-xl opacity-90 mb-6">{editedContent.sprintDescription}</p>
                      <div className="flex justify-center gap-4">
                        <Badge className="bg-white/20 text-white">
                          <Calendar className="w-4 h-4 mr-1" />
                          {editedContent.sprintDuration} Days
                        </Badge>
                        <Badge className="bg-white/20 text-white">
                          <Users className="w-4 h-4 mr-1" />
                          {editedContent.sprintCategory}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Daily Journey</h3>
                      <div className="grid gap-4">
                        {editedContent.dailyLessons.slice(0, 3).map((lesson, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gradient-card">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {lesson.day}
                              </div>
                              <h4 className="font-semibold">{lesson.title}</h4>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {lesson.content.substring(0, 150)}...
                            </p>
                          </div>
                        ))}
                        {editedContent.dailyLessons.length > 3 && (
                          <div className="text-center py-4 text-muted-foreground">
                            + {editedContent.dailyLessons.length - 3} more days
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};