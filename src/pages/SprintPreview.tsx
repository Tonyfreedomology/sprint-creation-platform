import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Edit3, 
  Play, 
  Save, 
  Download, 
  ArrowLeft, 
  Calendar,
  Mail,
  FileText,
  Volume2,
  Users,
  Loader2,
  Pause,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SprintPackageGenerator } from '@/services/sprintPackageGenerator';

interface GeneratedContent {
  sprintId: string;
  sprintTitle: string;
  sprintDescription: string;
  sprintDuration: string;
  sprintCategory: string;
  voiceStyle?: string;
  creatorInfo: {
    name: string;
    email: string;
    bio: string;
  };
  dailyLessons: Array<{
    day: number;
    title: string;
    content: string;
    exercise: string;
    affirmation: string;
  }>;
  emailSequence: Array<{
    day: number;
    subject: string;
    content: string;
    type?: string;
    send_time?: string;
  }>;
}

export const SprintPreview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sprintData, setSprintData] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalDays, setTotalDays] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [editingLesson, setEditingLesson] = useState<number | null>(null);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({});
  const [generatingAudio, setGeneratingAudio] = useState<Record<number, boolean>>({});
  const [playingAudio, setPlayingAudio] = useState<Record<number, boolean>>({});
  const [audioElements, setAudioElements] = useState<Record<number, HTMLAudioElement>>({});
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const [sprintVoiceId, setSprintVoiceId] = useState<string | null>(null);
  const [isGeneratingPackage, setIsGeneratingPackage] = useState(false);
  const [packageProgress, setPackageProgress] = useState(0);

  useEffect(() => {
    // Check for either sprintData or generatedContent (legacy)
    const contentData = location.state?.sprintData || location.state?.generatedContent;
    
    if (contentData) {
      setSprintData(contentData);
      setIsGenerating(location.state.isGenerating || false);
      
      // Set up real-time channel if provided
      if (location.state.channelName && location.state.isGenerating) {
        setupRealtimeChannel(location.state.channelName, contentData);
      }
    } else {
      // Check URL parameters for sprint ID and channel name
      const searchParams = new URLSearchParams(location.search);
      const sprintId = searchParams.get('id');
      const channelName = searchParams.get('channel');
      
      if (sprintId && channelName) {
        console.log('Setting up sprint preview from URL params:', { sprintId, channelName });
        
        // Create initial sprint data structure
        const initialData: GeneratedContent = {
          sprintId,
          sprintTitle: 'Loading Sprint...',
          sprintDescription: '',
          sprintDuration: '21',
          sprintCategory: '',
          creatorInfo: {
            name: '',
            email: '',
            bio: ''
          },
          dailyLessons: [],
          emailSequence: []
        };
        
        setSprintData(initialData);
        setIsGenerating(true);
        setupRealtimeChannel(channelName, initialData);
      } else {
        // Redirect back if no data and no URL params
        navigate('/');
      }
    }
  }, [location.state, location.search, navigate]);

  const setupRealtimeChannel = (channelName: string, contentData: GeneratedContent) => {
    console.log('Setting up real-time channel:', channelName);
    
    const channel = supabase.channel(channelName);
    
    channel
      .on('broadcast', { event: 'lesson-generated' }, (payload) => {
        console.log('Received new lesson:', payload);
        
        if (payload.payload?.lesson && payload.payload?.email) {
          const lesson = payload.payload.lesson;
          const email = payload.payload.email;
          const structure = payload.payload.structure;
          
          setSprintData(prevData => {
            if (!prevData) return prevData;
            
            const updatedData = { ...prevData };
            
            // Add lesson to dailyLessons array
            const existingLessonIndex = updatedData.dailyLessons.findIndex(l => l.day === lesson.day);
            if (existingLessonIndex >= 0) {
              updatedData.dailyLessons[existingLessonIndex] = lesson;
            } else {
              updatedData.dailyLessons.push(lesson);
              updatedData.dailyLessons.sort((a, b) => a.day - b.day);
            }
            
            // Add email to emailSequence array
            const existingEmailIndex = updatedData.emailSequence.findIndex(e => e.day === email.day);
            if (existingEmailIndex >= 0) {
              updatedData.emailSequence[existingEmailIndex] = email;
            } else {
              updatedData.emailSequence.push(email);
              updatedData.emailSequence.sort((a, b) => a.day - b.day);
            }
            
            return updatedData;
          });
          
          // Update progress and show toast AFTER state update
          const totalDays = parseInt(contentData.sprintDuration);
          setSprintData(prevData => {
            if (!prevData) return prevData;
            const completedDays = prevData.dailyLessons.length;
            const progress = Math.round((completedDays / totalDays) * 100);
            setGenerationProgress(progress);
            return prevData;
          });
          
          // Only show toast for days beyond the initial 3 (since those were ready when page loaded)
          if (lesson.day > 3) {
            const theme = structure?.theme || lesson.title;
            toast({
              title: `Day ${lesson.day} Generated`,
              description: theme,
            });
          }
        }
      })
      .on('broadcast', { event: 'generation-complete' }, (payload) => {
        console.log('Generation completed');
        setIsGenerating(false);
        setGenerationProgress(100);
        
        toast({
          title: "Generation Complete! 🎉",
          description: payload.payload?.message || "All lessons have been generated successfully.",
        });
      })
      .on('broadcast', { event: 'generation-error' }, (payload) => {
        console.log('Generation error:', payload);
        setIsGenerating(false);
        
        toast({
          title: "Generation Error",
          description: payload.payload?.message || "There was an error during generation.",
          variant: "destructive"
        });
      })
      .subscribe();
    
    setRealtimeChannel(channel);
  };

  // Cleanup real-time channel on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [realtimeChannel]);

  const handleLessonEdit = (dayIndex: number, field: string, value: string) => {
    if (!sprintData) return;
    
    const updatedData = { ...sprintData };
    updatedData.dailyLessons[dayIndex] = {
      ...updatedData.dailyLessons[dayIndex],
      [field]: value
    };
    setSprintData(updatedData);
  };

  const handleEmailEdit = (emailIndex: number, field: string, value: string) => {
    if (!sprintData) return;
    
    const updatedData = { ...sprintData };
    updatedData.emailSequence[emailIndex] = {
      ...updatedData.emailSequence[emailIndex],
      [field]: value
    };
    setSprintData(updatedData);
  };

  const continueGeneration = async (initialContent: GeneratedContent) => {
    if (!initialContent) return;
    
    const currentLessons = initialContent.dailyLessons.length;
    const remainingDays = totalDays - currentLessons;
    
    if (remainingDays <= 0) {
      setIsGenerating(false);
      return;
    }

    // Start real-time generation process
    const channelName = `sprint-generation-${initialContent.sprintId}`;
    const channel = supabase.channel(channelName);

    // Listen for lesson updates
    channel.on('broadcast', { event: 'lesson-generated' }, (payload) => {
      console.log('Received lesson update:', payload);
      const { lesson, email } = payload.payload;
      
      setSprintData(prev => {
        if (!prev) return prev;
        
        const updatedLessons = [...prev.dailyLessons];
        const updatedEmails = [...prev.emailSequence];
        
        // Replace placeholder with generated content
        const lessonIndex = updatedLessons.findIndex(l => l.day === lesson.day);
        if (lessonIndex >= 0) {
          updatedLessons[lessonIndex] = lesson;
        } else {
          updatedLessons.push(lesson);
          updatedLessons.sort((a, b) => a.day - b.day);
        }
        
        if (email) {
          const emailIndex = updatedEmails.findIndex(e => e.day === email.day);
          if (emailIndex >= 0) {
            updatedEmails[emailIndex] = email;
          } else {
            updatedEmails.push(email);
            updatedEmails.sort((a, b) => a.day - b.day);
          }
        }
        
        return {
          ...prev,
          dailyLessons: updatedLessons,
          emailSequence: updatedEmails
        };
      });
      
      // Update progress
      const newProgress = (lesson.day / totalDays) * 100;
      setGenerationProgress(newProgress);
      
      // Show toast for completed lesson
      toast({
        title: `Day ${lesson.day} Generated`,
        description: lesson.title,
      });
    });

    // Listen for completion
    channel.on('broadcast', { event: 'generation-complete' }, () => {
      console.log('Generation complete');
      setIsGenerating(false);
      setGenerationProgress(100);
      
      toast({
        title: "Generation Complete! 🎉",
        description: "All sprint content has been generated.",
      });
      
      // Clean up channel
      supabase.removeChannel(channel);
    });

    // Subscribe to channel
    await channel.subscribe();
    setRealtimeChannel(channel);

    // Start the generation process
    try {
      const { error } = await supabase.functions.invoke('generate-sprint-realtime', {
        body: {
          formData: location.state?.formData || {},
          sprintId: initialContent.sprintId,
          startDay: currentLessons + 1,
          totalDays: totalDays,
          channelName: channelName
        }
      });

      if (error) {
        console.error('Failed to start real-time generation:', error);
        // Fallback to basic batch approach
        setIsGenerating(false);
        toast({
          title: "Generation Error",
          description: "Failed to start background generation. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Real-time generation error:', error);
      setIsGenerating(false);
      toast({
        title: "Generation Error", 
        description: "Failed to start background generation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateAudio = async (text: string, lessonDay: number) => {
    try {
      setGeneratingAudio(prev => ({ ...prev, [lessonDay]: true }));
      
      toast({
        title: "Generating Audio",
        description: "Creating expressive audio with Hume AI...",
      });
      
      // Determine content type based on text content
      let contentType = 'lesson';
      if (text.includes('exercise') || text.includes('practice')) {
        contentType = 'exercise';
      } else if (text.includes('affirmation') || text.includes('Today, I')) {
        contentType = 'affirmation';
      }
      
      const { data, error } = await supabase.functions.invoke('generate-audio-hume', {
        body: { 
          text, 
          voiceStyle: sprintData?.voiceStyle || 'warm-coach', // Use sprint voice style
          contentType: contentType,
          sprintId: sprintData?.sprintId, // For voice consistency
          savedVoiceId: sprintVoiceId // Use existing voice if available
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // If this is a new voice, save the voice ID for consistency
      if (data.isNewVoice && data.newVoiceId) {
        setSprintVoiceId(data.newVoiceId);
        console.log('Saved new voice ID for sprint:', data.newVoiceId);
      }

      // Convert base64 audio to blob URL (Hume returns WAV format)
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))], 
        { type: 'audio/wav' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create audio element
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setPlayingAudio(prev => ({ ...prev, [lessonDay]: false }));
      };
      
      setAudioUrls(prev => ({ ...prev, [lessonDay]: audioUrl }));
      setAudioElements(prev => ({ ...prev, [lessonDay]: audio }));
      
      const voiceMessage = data.isNewVoice ? 
        `New voice created and will be reused for all lessons: ${data.voiceUsed}` :
        `Using consistent sprint voice: ${data.voiceUsed}`;
      
      toast({
        title: "Audio Generated",
        description: voiceMessage,
      });
      
    } catch (error) {
      console.error('Audio generation error:', error);
      toast({
        title: "Audio Generation Failed",
        description: error instanceof Error ? error.message : "There was an error generating the audio.",
        variant: "destructive",
      });
    } finally {
      setGeneratingAudio(prev => ({ ...prev, [lessonDay]: false }));
    }
  };

  const toggleAudio = (lessonDay: number) => {
    const audio = audioElements[lessonDay];
    const isPlaying = playingAudio[lessonDay];

    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setPlayingAudio(prev => ({ ...prev, [lessonDay]: false }));
    } else {
      // Pause all other audio
      Object.entries(audioElements).forEach(([day, audioEl]) => {
        if (parseInt(day) !== lessonDay) {
          audioEl.pause();
        }
      });
      setPlayingAudio(prev => 
        Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: parseInt(key) === lessonDay }), {})
      );
      
      audio.play();
      setPlayingAudio(prev => ({ ...prev, [lessonDay]: true }));
    }
  };

  const saveSprint = () => {
    if (!sprintData) return;
    
    // Create a comprehensive document for export
    const docContent = [
      `${sprintData.sprintTitle}\n`,
      `Created by: ${sprintData.creatorInfo.name}\n`,
      `Duration: ${sprintData.sprintDuration} days\n`,
      `Category: ${sprintData.sprintCategory}\n\n`,
      `Description:\n${sprintData.sprintDescription}\n\n`,
      '='.repeat(80) + '\nDAILY LESSONS\n' + '='.repeat(80) + '\n\n',
      ...sprintData.dailyLessons.map(lesson => 
        `Day ${lesson.day}: ${lesson.title}\n\n` +
        `Content:\n${lesson.content}\n\n` +
        `Exercise:\n${lesson.exercise}\n\n` +
        `Affirmation:\n${lesson.affirmation}\n\n` +
        '-'.repeat(40) + '\n\n'
      ),
      '='.repeat(80) + '\nEMAIL SEQUENCE\n' + '='.repeat(80) + '\n\n',
      ...sprintData.emailSequence.map(email => 
        `Day ${email.day}: ${email.subject}\n\n` +
        `${email.content}\n\n` +
        '-'.repeat(40) + '\n\n'
      )
    ].join('');
    
    const blob = new Blob([docContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sprintData.sprintTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_complete.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Sprint Saved",
      description: "Your complete sprint has been downloaded as a text document!",
    });
  };

  const downloadAllAudio = () => {
    if (!sprintData || Object.keys(audioUrls).length === 0) {
      toast({
        title: "No Audio Available",
        description: "Generate some audio files first before downloading.",
      });
      return;
    }
    
    // Create a zip file would be ideal, but for now download each audio file
    Object.entries(audioUrls).forEach(([day, url]) => {
      const lesson = sprintData.dailyLessons.find(l => l.day === parseInt(day));
      if (lesson && url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `Day_${day}_${lesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
        link.click();
      }
    });
    
    toast({
      title: "Audio Files Downloaded",
      description: `Downloaded ${Object.keys(audioUrls).length} audio files.`,
    });
  };

  const exportSprint = () => {
    if (!sprintData) return;
    
    const dataStr = JSON.stringify(sprintData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sprintData.sprintTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_data.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported",
      description: "Your sprint data has been downloaded as a JSON file.",
    });
  };

  const generatePackage = async () => {
    if (!sprintData) return;

    setIsGeneratingPackage(true);
    setPackageProgress(0);

    try {
      const packageGenerator = new SprintPackageGenerator();
      
      // Convert sprintData to the expected format
      const convertedData = {
        ...sprintData,
        voiceId: sprintVoiceId
      };

      const sprintPackage = await packageGenerator.generatePackage(
        convertedData,
        (step: string, progress: number) => {
          setPackageProgress(progress);
          toast({
            title: "Package Generation",
            description: step,
          });
        }
      );

      // Navigate to results page with package data
      const packageDataParam = encodeURIComponent(JSON.stringify(sprintPackage));
      navigate(`/package-results?packageData=${packageDataParam}`);

    } catch (error) {
      console.error('Package generation error:', error);
      toast({
        title: "Package Generation Failed",
        description: error instanceof Error ? error.message : "There was an error generating the package.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPackage(false);
      setPackageProgress(0);
    }
  };

  if (!sprintData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading sprint data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Generation Progress */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                {sprintData.sprintTitle}
              </h1>
              <p className="text-muted-foreground">
                {sprintData.sprintDuration}-day sprint • Created by {sprintData.creatorInfo.name}
              </p>
              {isGenerating && (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Generating remaining content... {Math.round(generationProgress)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={generatePackage} 
              disabled={isGeneratingPackage}
              className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary"
            >
              {isGeneratingPackage ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Package className="w-4 h-4 mr-2" />
              )}
              {isGeneratingPackage ? `Generating ${packageProgress}%` : 'Generate Package'}
            </Button>
            <Button variant="outline" onClick={saveSprint}>
              <Save className="w-4 h-4 mr-2" />
              Save as Document
            </Button>
            <Button variant="outline" onClick={downloadAllAudio} disabled={Object.keys(audioUrls).length === 0}>
              <Volume2 className="w-4 h-4 mr-2" />
              Download Audio
            </Button>
            <Button variant="outline" onClick={exportSprint}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Overview Card */}
        <Card className="mb-8 border-primary/20 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sprint Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                <Badge variant="secondary" className="mt-1">{sprintData.sprintCategory}</Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
                <p className="font-medium">{sprintData.sprintDuration} days</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Total Lessons</Label>
                <p className="font-medium">{sprintData.dailyLessons.length}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="mt-1 text-foreground">{sprintData.sprintDescription}</p>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="lessons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lessons" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Daily Lessons ({sprintData.dailyLessons.length})
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Sequences ({sprintData.emailSequence.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-6">
            {/* Generation Progress Indicator */}
            {isGenerating && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        Your lessons are being generated and will appear below one by one
                      </p>
                      <p className="text-xs text-blue-700">
                        This may take a few minutes to create the entire sprint. Feel free to edit or tweak any content as it appears, and generate audio versions by pressing the "Generate Audio" button on each lesson.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {sprintData.dailyLessons.filter(lesson => lesson && lesson.title).map((lesson, index) => (
              <Card key={lesson.day} className="border-primary/20 shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {lesson.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      {audioUrls[lesson.day] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAudio(lesson.day)}
                          disabled={generatingAudio[lesson.day]}
                        >
                          {playingAudio[lesson.day] ? (
                            <Pause className="w-4 h-4 mr-2" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          {playingAudio[lesson.day] ? 'Pause' : 'Play'} Audio
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateAudio(lesson.content, lesson.day)}
                        disabled={generatingAudio[lesson.day]}
                      >
                        {generatingAudio[lesson.day] ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Volume2 className="w-4 h-4 mr-2" />
                        )}
                        {generatingAudio[lesson.day] ? 'Generating...' : 'Generate Audio'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingLesson(editingLesson === index ? null : index)}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        {editingLesson === index ? 'Done' : 'Edit'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingLesson === index ? (
                    <>
                      <div>
                        <Label htmlFor={`title-${index}`}>Title</Label>
                        <Input
                          id={`title-${index}`}
                          value={lesson.title}
                          onChange={(e) => handleLessonEdit(index, 'title', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`content-${index}`}>Content</Label>
                        <Textarea
                          id={`content-${index}`}
                          value={lesson.content}
                          onChange={(e) => handleLessonEdit(index, 'content', e.target.value)}
                          rows={8}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`exercise-${index}`}>Exercise</Label>
                        <Textarea
                          id={`exercise-${index}`}
                          value={lesson.exercise}
                          onChange={(e) => handleLessonEdit(index, 'exercise', e.target.value)}
                          rows={4}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`affirmation-${index}`}>Affirmation</Label>
                        <Input
                          id={`affirmation-${index}`}
                          value={lesson.affirmation}
                          onChange={(e) => handleLessonEdit(index, 'affirmation', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h4 className="font-semibold mb-2">Content</h4>
                        <p className="text-foreground leading-relaxed">{lesson.content}</p>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Exercise</h4>
                        <p className="text-foreground">{lesson.exercise}</p>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Affirmation</h4>
                        <p className="text-foreground italic">"{lesson.affirmation}"</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            {Array.from(new Set(sprintData.emailSequence.map(email => email.day))).map(day => (
              <Card key={day} className="border-primary/20 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Day {day} Emails
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sprintData.emailSequence
                      .filter(email => email.day === day)
                      .map((email, emailIndex) => {
                        const globalIndex = sprintData.emailSequence.findIndex(
                          e => e.day === email.day && e.type === email.type
                        );
                        const isEditing = editingEmail === `${day}-${email.type}`;
                        
                        return (
                          <div key={`${day}-${email.type}`} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{email.type}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  Send at {email.send_time}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingEmail(isEditing ? null : `${day}-${email.type}`)}
                              >
                                <Edit3 className="w-4 h-4 mr-2" />
                                {isEditing ? 'Done' : 'Edit'}
                              </Button>
                            </div>
                            
                            {isEditing ? (
                              <div className="space-y-3">
                                <div>
                                  <Label>Subject</Label>
                                  <Input
                                    value={email.subject}
                                    onChange={(e) => handleEmailEdit(globalIndex, 'subject', e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label>Content</Label>
                                  <Textarea
                                    value={email.content}
                                    onChange={(e) => handleEmailEdit(globalIndex, 'content', e.target.value)}
                                    rows={6}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                <h5 className="font-semibold mb-2">Subject: {email.subject}</h5>
                                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                  {email.content}
                                </p>
                              </>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};