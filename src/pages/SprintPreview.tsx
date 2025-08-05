import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
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
  Package,
  RefreshCw,
  Video,
  Film
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PillSwitcher } from '@/components/ui/pill-switcher';
import { AudioPlayer } from '@/components/ui/audio-player';
import { supabase } from '@/integrations/supabase/client';
import { orchestrateBatchGeneration, type BatchGenerationProgress } from "@/services/batchSprintGeneration";
import { SprintPackageGenerator } from '@/services/sprintPackageGenerator';
import { VideoGenerationService } from '@/services/videoGeneration';
import { VideoModal } from '@/components/VideoModal';

interface GeneratedContent {
  sprintId: string;
  sprintTitle: string;
  sprintDescription: string;
  sprintDuration: string;
  sprintCategory: string;
  voiceStyle?: string;
  voiceId?: string; // Add voice ID for cloned voices
  writingStyleAnalysis?: string; // Add writing style analysis
  masterPlan?: any; // Add masterPlan property
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
  const [regeneratingLessons, setRegeneratingLessons] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("lessons");
  const [generatingVideo, setGeneratingVideo] = useState<Record<number, boolean>>({});
  const [videoUrls, setVideoUrls] = useState<Record<number, string>>({});
  const [videoService] = useState(() => new VideoGenerationService());
  const [selectedVideo, setSelectedVideo] = useState<{ lessonDay: number; videoUrl: string; lessonTitle: string } | null>(null);

  // Enhanced text formatter for better readability
  const formatText = (text: string) => {
    if (!text) return '';
    
    // Split into paragraphs based on double line breaks or periods followed by capital letters
    let paragraphs = text
      .split(/\n\s*\n/)  // Split on double line breaks
      .filter(p => p.trim().length > 0);
    
    // If no double line breaks, try to split on sentences that likely start new paragraphs
    if (paragraphs.length === 1) {
      paragraphs = text
        .split(/\. (?=[A-Z][a-z]|So,|But |And |When |If |Here's|Let's|Today|Tomorrow|Now|First|Second|Third|Finally|In |This |That |Your |You |I )/g)
        .filter(p => p.trim().length > 20) // Only split if resulting paragraph is substantial
        .map((p, index, array) => {
          // Add back the period except for the last paragraph
          return index < array.length - 1 && !p.trim().endsWith('.') ? p.trim() + '.' : p.trim();
        });
    }
    
    return paragraphs
      .map(paragraph => {
        return paragraph
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br>');
      })
      .join('</p><p class="mb-4 text-white/80 leading-relaxed">');
  };

  // Simple markdown renderer for emails
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  // State persistence functions
  const saveStateToStorage = (data: any) => {
    try {
      const stateKey = `sprint-preview-${sprintData?.sprintId}`;
      const stateData = {
        sprintData: data,
        audioUrls,
        videoUrls,
        timestamp: Date.now()
      };
      localStorage.setItem(stateKey, JSON.stringify(stateData));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  const loadStateFromStorage = (sprintId: string) => {
    try {
      const stateKey = `sprint-preview-${sprintId}`;
      const saved = localStorage.getItem(stateKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only load if saved within last 24 hours
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading state:', error);
    }
    return null;
  };

  useEffect(() => {
    const contentData = location.state?.sprintData || location.state?.generatedContent;
    
    if (contentData) {
      setSprintData(contentData);
      setIsGenerating(location.state.isGenerating || false);
      
      // Set up real-time channel if provided
      if (location.state.channelName && location.state.isGenerating) {
        setupRealtimeChannel(location.state.channelName, contentData);
      }
      
      // Start batch generation if flagged
      if (location.state.startGeneration) {
        startBatchGeneration(contentData, location.state.channelName);
      }
    } else {
      // Check URL parameters for sprint ID and channel name
      const searchParams = new URLSearchParams(location.search);
      const sprintId = searchParams.get('id');
      const channelName = searchParams.get('channel');
      const formDataString = searchParams.get('formData');
      
      // Extract voice ID from form data if available
      let extractedVoiceId = null;
      if (formDataString) {
        try {
          const formData = JSON.parse(decodeURIComponent(formDataString));
          extractedVoiceId = formData.voiceId;
          console.log('Extracted voice ID from URL:', extractedVoiceId);
        } catch (error) {
          console.error('Error parsing form data from URL:', error);
        }
      }
      
      if (sprintId && channelName) {
        console.log('Setting up sprint preview from URL params:', { sprintId, channelName, voiceId: extractedVoiceId });
        
        // Try to load saved state first
        const savedState = loadStateFromStorage(sprintId);
        if (savedState) {
          setSprintData(savedState.sprintData);
          setAudioUrls(savedState.audioUrls || {});
          setVideoUrls(savedState.videoUrls || {});
          console.log('Loaded saved state for sprint:', sprintId);
          return;
        }
        
        // Try to get voice ID from localStorage first
        const storedVoiceId = localStorage.getItem(`sprint_voice_${sprintId}`);
        const voiceIdToUse = extractedVoiceId || storedVoiceId;
        
        // Set the voice ID immediately if available
        if (voiceIdToUse) {
          setSprintVoiceId(voiceIdToUse);
          console.log('Using voice ID:', voiceIdToUse);
        } else {
          console.log('No voice ID found for sprint:', sprintId);
        }
        
        // Create initial sprint data structure
        const initialData: GeneratedContent = {
          sprintId,
          sprintTitle: 'Loading Sprint...',
          sprintDescription: '',
          sprintDuration: '21',
          sprintCategory: '',
          voiceId: extractedVoiceId, // Include voice ID
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
          
          // Remove from regenerating set if it was being regenerated
          setRegeneratingLessons(prev => {
            const newSet = new Set(prev);
            newSet.delete(lesson.day - 1);
            return newSet;
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

  // Save state when data changes
  useEffect(() => {
    if (sprintData) {
      saveStateToStorage(sprintData);
    }
  }, [sprintData, audioUrls, videoUrls]);

  // Cleanup real-time channel on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [realtimeChannel]);

  const startBatchGeneration = async (sprintData: GeneratedContent, channelName: string) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      console.log('Starting batch content generation');
      
      // Extract form data from sprint data for batch generation
      const formData = {
        creatorName: sprintData.creatorInfo.name,
        creatorEmail: sprintData.creatorInfo.email,
        creatorBio: sprintData.creatorInfo.bio,
        sprintTitle: sprintData.sprintTitle,
        sprintDescription: sprintData.sprintDescription,
        sprintDuration: sprintData.sprintDuration,
        sprintCategory: sprintData.sprintCategory,
        // Add default values for missing fields
        targetAudience: 'Married men, Christian husbands, dads in their 30s and 40s, recovering nice guys',
        contentGeneration: 'ai',
        contentTypes: ['text', 'affirmations', 'exercises', 'challenges'],
        toneStyle: 'encouraging',
        // CRITICAL: Include writing style analysis if available
        writingStyleAnalysis: sprintData.writingStyleAnalysis,
        experience: 'intermediate',
        goals: '• Build strong masculine frame\n• Lead sexually with clarity and confidence\n• Increase intimacy and sexual frequency\n• Rewire approval-seeking habits\n• Establish daily habits of touch, eye contact, and pursuit',
        specialRequirements: '',
        voiceStyle: 'warm-coach',
        voiceSampleFile: null,
        writingStyleFile: null,
        participantEmails: sprintData.creatorInfo.email
      };
      
      // Use the batch generation system
      const result = await orchestrateBatchGeneration(
        {
          formData,
          masterPlan: sprintData.masterPlan,
          sprintId: sprintData.sprintId,
          channelName,
          batchSize: 4
        },
        (progress) => {
          console.log('Batch progress:', progress);
          const progressPercentage = Math.round((progress.currentDay / progress.totalDays) * 100);
          setGenerationProgress(progressPercentage);
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Batch generation failed');
      }

      console.log('Batch generation completed successfully');
      setIsGenerating(false);
      setGenerationProgress(100);
      
      toast({
        title: "Generation Complete! 🎉",
        description: `All ${sprintData.sprintDuration} lessons have been generated successfully.`,
      });
      
    } catch (error) {
      console.error('Error in batch content generation:', error);
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to complete content generation",
        variant: "destructive"
      });
    }
  };

  const regenerateLesson = async (dayIndex: number) => {
    if (!sprintData) return;
    
    const day = dayIndex + 1;
    console.log(`Regenerating lesson for day ${day}`);
    
    // Add this lesson to the regenerating set
    setRegeneratingLessons(prev => new Set([...prev, dayIndex]));
    
    try {
      const response = await supabase.functions.invoke('generate-sprint-batch', {
        body: {
          formData: {
            creatorName: sprintData.creatorInfo.name,
            creatorEmail: sprintData.creatorInfo.email,
            creatorBio: sprintData.creatorInfo.bio,
            sprintTitle: sprintData.sprintTitle,
            sprintDescription: sprintData.sprintDescription,
            sprintDuration: sprintData.sprintDuration,
            sprintCategory: sprintData.sprintCategory,
            targetAudience: 'Married men, Christian husbands, dads in their 30s and 40s, recovering nice guys',
            contentGeneration: 'ai',
            contentTypes: ['text', 'affirmations', 'exercises', 'challenges'],
            toneStyle: 'encouraging',
            // CRITICAL: Include writing style analysis if available
            writingStyleAnalysis: sprintData.writingStyleAnalysis,
            experience: 'intermediate',
            goals: '• Build strong masculine frame\n• Lead sexually with clarity and confidence\n• Increase intimacy and sexual frequency\n• Rewire approval-seeking habits\n• Establish daily habits of touch, eye contact, and pursuit',
            specialRequirements: '',
            voiceStyle: 'warm-coach',
            participantEmails: sprintData.creatorInfo.email
          },
          masterPlan: sprintData.masterPlan,
          regenerateDay: day,
          channelName: location.state?.channelName || `sprint-generation-${sprintData.sprintId}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Regenerating Lesson",
        description: `Regenerating content for Day ${day}...`,
      });
      
    } catch (error) {
      console.error(`Error regenerating day ${day}:`, error);
      toast({
        title: "Regeneration Failed",
        description: error instanceof Error ? error.message : "Failed to regenerate lesson",
        variant: "destructive"
      });
    } finally {
      // Remove this lesson from the regenerating set
      setRegeneratingLessons(prev => {
        const newSet = new Set(prev);
        newSet.delete(dayIndex);
        return newSet;
      });
    }
  };

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

    setIsGenerating(true);
    setGenerationProgress(0);
    
    const toastRef = toast({
      title: "Generating Sprint Content",
      description: "Starting robust batch generation process...",
      duration: 0,
    });

    try {
      console.log("Starting batch content generation");
      console.log("Current lessons:", currentLessons, "Remaining days:", remainingDays);
      
      // Set up real-time channel for progress updates
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
        
        // Update toast for progress
        toast({
          title: "Generating Sprint Content",
          description: `Generated Day ${lesson.day}: ${lesson.title}`,
        });
      });

      // Listen for completion
      channel.on('broadcast', { event: 'generation-complete' }, () => {
        console.log('Generation complete');
        setIsGenerating(false);
        setGenerationProgress(100);
        
        toast({
          title: "Generation Complete! 🎉",
          description: "All sprint content has been generated successfully!",
        });
        
        // Clean up channel
        supabase.removeChannel(channel);
      });

      // Listen for generation errors
      channel.on('broadcast', { event: 'generation-error' }, (payload: any) => {
        console.error('Generation error received:', payload);
        setIsGenerating(false);
        
        toast({
          title: "Generation Failed",
          description: `Error generating Day ${payload.payload.day}: ${payload.payload.error}`,
          variant: "destructive",
        });
        
        // Clean up channel
        supabase.removeChannel(channel);
      });

      // Subscribe to channel
      await channel.subscribe();
      setRealtimeChannel(channel);

      const result = await orchestrateBatchGeneration({
        formData: location.state?.formData || {},
        masterPlan: initialContent.masterPlan,
        sprintId: initialContent.sprintId,
        channelName: channelName,
        batchSize: 4 // Generate 4 days at a time for optimal performance
      }, (progress: BatchGenerationProgress) => {
        console.log('Batch generation progress:', progress);
        const progressPercent = Math.round((progress.currentDay / progress.totalDays) * 100);
        setGenerationProgress(progressPercent);
      });

      if (!result.success) {
        console.error("Batch generation failed:", result.error);
        setIsGenerating(false);
        
        toast({
          title: "Generation Failed",
          description: result.error || "An error occurred during content generation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in batch generation:", error);
      setIsGenerating(false);
      
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const generateAudio = async (text: string, lessonDay: number) => {
    try {
      setGeneratingAudio(prev => ({ ...prev, [lessonDay]: true }));
      
      toast({
        title: "Generating Audio",
        description: "Creating expressive audio with ElevenLabs...",
      });
      
      // Determine content type based on text content
      let contentType = 'lesson';
      if (text.includes('exercise') || text.includes('practice')) {
        contentType = 'exercise';
      } else if (text.includes('affirmation') || text.includes('Today, I')) {
        contentType = 'affirmation';
      }
      
      // Use cloned voice if available, otherwise use voice style
      const voiceToUse = sprintVoiceId || sprintData?.voiceId;
      console.log('Audio generation - using voice ID:', voiceToUse, 'sprintVoiceId:', sprintVoiceId, 'sprintData.voiceId:', sprintData?.voiceId);
      
      const { data, error } = await supabase.functions.invoke('generate-audio-elevenlabs', {
        body: { 
          text, 
          voiceStyle: sprintData?.voiceStyle || 'warm-coach', // Use sprint voice style
          contentType: contentType,
          sprintId: sprintData?.sprintId, // For voice consistency
          voiceId: voiceToUse // Use cloned voice first, then fall back to voice style
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Save the voice ID for consistency
      if (data.voiceId && !sprintVoiceId) {
        setSprintVoiceId(data.voiceId);
        console.log('Saved new voice ID for sprint:', data.newVoiceId);
      }

      // Convert base64 audio to blob URL (ElevenLabs returns MP3 format)
      // Handle large base64 strings safely by processing in chunks to avoid atob limitations
      function base64ToArrayBuffer(base64: string): ArrayBuffer {
        const chunkSize = 32768; // Process in 32KB chunks
        const chunks: Uint8Array[] = [];
        
        for (let i = 0; i < base64.length; i += chunkSize) {
          const chunk = base64.slice(i, i + chunkSize);
          const binaryString = atob(chunk);
          const bytes = new Uint8Array(binaryString.length);
          
          for (let j = 0; j < binaryString.length; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }
          chunks.push(bytes);
        }
        
        // Combine all chunks
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        
        return result.buffer;
      }
      
      const audioBuffer = base64ToArrayBuffer(data.audioContent);
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
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

  const generateVideo = async (lessonDay: number) => {
    if (!sprintData) return;
    
    const lesson = sprintData.dailyLessons.find(l => l.day === lessonDay);
    if (!lesson) return;
    
    // Check if audio exists for this lesson
    if (!audioUrls[lessonDay]) {
      toast({
        title: "Audio Required",
        description: "Please generate audio for this lesson first before creating a video.",
        variant: "destructive"
      });
      return;
    }

    try {
      setGeneratingVideo(prev => ({ ...prev, [lessonDay]: true }));
      
      toast({
        title: "Creating Video",
        description: `Starting video generation for Day ${lessonDay}...`,
      });

      // Create video using the VideoGenerationService
      const videoOptions = {
        sprintId: sprintData.sprintId,
        sprintTitle: sprintData.sprintTitle,
        dailyLessons: [lesson], // Single lesson
        audioFiles: { [lessonDay.toString()]: audioUrls[lessonDay] }, // Pass the audio URL
        brandColors: {
          primary: '#22DFDC',   // Cyan
          secondary: '#2D3748', // Dark gray
          accent: '#ED64A6',    // Pink
        }
      };

      // Call the actual video generation service
      const videoResults = await videoService.generateSprintVideos(
        videoOptions,
        (step: string, progress: number) => {
          toast({
            title: "Video Generation Progress",
            description: `${step} (${Math.round(progress)}%)`,
          });
        }
      );
      
      // Get the generated video URL
      const videoUrl = videoResults[lessonDay.toString()];
      if (videoUrl) {
        setVideoUrls(prev => ({ ...prev, [lessonDay]: videoUrl }));
      } else {
        throw new Error('Video generation failed - no URL returned');
      }

      toast({
        title: "Video Created Successfully! 🎬",
        description: `Video for "${lesson.title}" is ready to view.`,
      });

    } catch (error) {
      console.error('Error creating video:', error);
      toast({
        title: "Video Creation Failed",
        description: error instanceof Error ? error.message : "There was an error creating the video.",
        variant: "destructive"
      });
    } finally {
      setGeneratingVideo(prev => ({ ...prev, [lessonDay]: false }));
    }
  };

  const openVideoModal = (lessonDay: number) => {
    const videoUrl = videoUrls[lessonDay];
    const lesson = sprintData?.dailyLessons.find(l => l.day === lessonDay);
    
    if (videoUrl && lesson) {
      setSelectedVideo({
        lessonDay,
        videoUrl,
        lessonTitle: lesson.title
      });
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
      <div className="page-wrapper">
        <div className="page-content">
          <div className="max-w-4xl mx-auto">
            <div className="card-wrapper">
              <div className="card-content">
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                    <p className="text-white/70">Loading sprint data...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div className="centered-header">
              <h1 className="text-2xl font-semibold gradient-text">
                {sprintData.sprintTitle}
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {sprintData.sprintDuration}-day sprint • Created by {sprintData.creatorInfo.name}
              </p>
              {isGenerating && (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-sm text-white/60">
                    Generating remaining content... {Math.round(generationProgress)}%
                  </span>
                </div>
              )}
            </div>
          </div>

        {/* Overview Card */}
        <div className="relative">
          {/* Gradient border container */}
          <div className="p-[0.5px] rounded-xl bg-gradient-to-r from-[#22DFDC] to-[#22EDB6]">
            {/* Inner container with darker background to match lesson cards */}
            <div className="rounded-xl bg-neutral-950/90 backdrop-blur-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] flex items-center justify-center">
                    <Users className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Sprint Overview</h2>
                    <p className="text-white/60 text-sm">Key details about your sprint</p>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button 
                    onClick={generatePackage} 
                    disabled={isGeneratingPackage || isGenerating || sprintData.dailyLessons.length < parseInt(sprintData.sprintDuration)}
                    size="sm"
                    className="bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] text-black hover:from-[#22EDB6] hover:to-[#22DFDC]"
                    title={isGeneratingPackage 
                      ? `Publishing ${Math.round(packageProgress)}%` 
                      : sprintData.dailyLessons.length < parseInt(sprintData.sprintDuration)
                        ? `Finalizing Sprint (${sprintData.dailyLessons.length}/${sprintData.sprintDuration})`
                        : 'Publish Sprint'
                    }
                  >
                    {isGeneratingPackage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={saveSprint}
                    className="text-white hover:bg-white/10"
                    title="Save as Document"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={downloadAllAudio} 
                    disabled={Object.keys(audioUrls).length === 0}
                    className="text-white hover:bg-white/10"
                    title="Download Audio"
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={exportSprint}
                    className="text-white hover:bg-white/10"
                    title="Export Data"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Stats grid with individual cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-neutral-900/50 backdrop-blur-sm rounded-lg p-6 text-center border border-neutral-800/50">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#22DFDC]/20 to-[#22EDB6]/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-[#22DFDC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="text-white/60 text-sm font-medium mb-1">Category</div>
                  <div className="text-[#22DFDC] text-xl font-semibold">{sprintData.sprintCategory}</div>
                </div>
                <div className="bg-neutral-900/50 backdrop-blur-sm rounded-lg p-6 text-center border border-neutral-800/50">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#22DFDC]/20 to-[#22EDB6]/20 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-[#22DFDC]" />
                  </div>
                  <div className="text-white/60 text-sm font-medium mb-1">Duration</div>
                  <div className="text-[#22DFDC] text-xl font-semibold">{sprintData.sprintDuration} days</div>
                </div>
                <div className="bg-neutral-900/50 backdrop-blur-sm rounded-lg p-6 text-center border border-neutral-800/50">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#22DFDC]/20 to-[#22EDB6]/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-[#22DFDC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <div className="text-white/60 text-sm font-medium mb-1">Total Lessons</div>
                  <div className="text-[#22DFDC] text-xl font-semibold">{sprintData.dailyLessons.length}</div>
                </div>
              </div>
              
              {/* Gradient glowing line */}
              <div className="relative mb-8">
                <div className="h-[1px] bg-gradient-to-r from-transparent via-[#22DFDC] to-transparent opacity-60"></div>
                <div className="absolute inset-0 h-[1px] bg-gradient-to-r from-transparent via-[#22DFDC] to-transparent blur-sm opacity-40"></div>
              </div>
              
               {/* Description */}
               <div className="pt-6">
                 <div className="text-white/60 text-sm font-medium mb-3">Description</div>
                 <p className="text-white/80 leading-relaxed">{sprintData.sprintDescription}</p>
               </div>
            </div>
          </div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#22DFDC]/20 to-[#22EDB6]/20 blur-sm -z-10" />
        </div>

        {/* Content Tabs */}
        <div className="space-y-8">
          <PillSwitcher 
            activeTab={activeTab}
            onChange={setActiveTab}
            lessonCount={sprintData.dailyLessons.length}
            emailCount={sprintData.emailSequence.length}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

          <TabsContent value="lessons" className="space-y-6">
            {/* Generation Progress Indicator */}
            {isGenerating && (
              <div className="card-wrapper">
                <div className="card-content">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        Your lessons are being generated and will appear below one by one
                      </p>
                      <p className="text-xs text-white/60">
                        This may take a few minutes to create the entire sprint. Feel free to edit or tweak any content as it appears, and generate audio versions by pressing the "Generate Audio" button on each lesson.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {sprintData.dailyLessons.filter(lesson => lesson && lesson.title).map((lesson, index) => (
              <div key={lesson.day} className="card-wrapper">
                <div className="card-content">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-black" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">{lesson.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      {audioUrls[lesson.day] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAudio(lesson.day)}
                          disabled={generatingAudio[lesson.day]}
                          className="text-white hover:bg-white/10"
                          title={playingAudio[lesson.day] ? 'Pause Audio' : 'Play Audio'}
                        >
                          {playingAudio[lesson.day] ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generateAudio(lesson.content, lesson.day)}
                        disabled={generatingAudio[lesson.day]}
                        className="text-white hover:bg-white/10"
                        title={generatingAudio[lesson.day] ? 'Generating Audio...' : 'Generate Audio'}
                      >
                        {generatingAudio[lesson.day] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (videoUrls[lesson.day]) {
                            openVideoModal(lesson.day);
                          } else {
                            generateVideo(lesson.day);
                          }
                        }}
                        disabled={generatingVideo[lesson.day] || !audioUrls[lesson.day]}
                        className={`text-white hover:bg-white/10 ${!audioUrls[lesson.day] ? 'opacity-50 cursor-not-allowed' : ''} ${videoUrls[lesson.day] ? 'bg-green-600/20' : ''}`}
                        title={
                          !audioUrls[lesson.day] 
                            ? 'Generate audio first to create video' 
                            : generatingVideo[lesson.day] 
                              ? 'Creating Video...' 
                              : videoUrls[lesson.day]
                                ? 'View Video'
                                : 'Create Video Lesson'
                        }
                      >
                        {generatingVideo[lesson.day] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Film className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => regenerateLesson(index)}
                        disabled={regeneratingLessons.has(index)}
                        className="text-white hover:bg-white/10"
                        title={regeneratingLessons.has(index) ? 'Regenerating...' : 'Regenerate Lesson'}
                      >
                        {regeneratingLessons.has(index) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingLesson(editingLesson === index ? null : index)}
                        className="text-white hover:bg-white/10"
                        title={editingLesson === index ? 'Done Editing' : 'Edit Lesson'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4 mt-4">
                    {editingLesson === index ? (
                      <>
                        <div>
                          <Label htmlFor={`title-${index}`} className="text-white/60">Title</Label>
                          <Input
                            id={`title-${index}`}
                            value={lesson.title}
                            onChange={(e) => handleLessonEdit(index, 'title', e.target.value)}
                            className="mt-1 bg-black/50 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`content-${index}`} className="text-white/60">Content</Label>
                          <Textarea
                            id={`content-${index}`}
                            value={lesson.content}
                            onChange={(e) => handleLessonEdit(index, 'content', e.target.value)}
                            rows={8}
                            className="mt-1 bg-black/50 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`exercise-${index}`} className="text-white/60">Exercise</Label>
                          <Textarea
                            id={`exercise-${index}`}
                            value={lesson.exercise}
                            onChange={(e) => handleLessonEdit(index, 'exercise', e.target.value)}
                            rows={4}
                            className="mt-1 bg-black/50 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`affirmation-${index}`} className="text-white/60">Affirmation</Label>
                          <Input
                            id={`affirmation-${index}`}
                            value={lesson.affirmation}
                            onChange={(e) => handleLessonEdit(index, 'affirmation', e.target.value)}
                            className="mt-1 bg-black/50 border-white/20 text-white"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <h4 className="font-semibold mb-2 text-white/80">Content</h4>
                          <div 
                            className="mb-4 text-white/80 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: `<p class="mb-4 text-white/80 leading-relaxed">${formatText(lesson.content)}</p>` }}
                          />
                        </div>
                        <div className="border-t border-white/10 pt-4">
                          <h4 className="font-semibold mb-2 text-white/80">Exercise</h4>
                          <p className="text-white/80">{lesson.exercise}</p>
                        </div>
                        <div className="border-t border-white/10 pt-4">
                          <h4 className="font-semibold mb-2 text-white/80">Affirmation</h4>
                          <p className="text-white/80 italic">"{lesson.affirmation}"</p>
                        </div>
                      </>
                    )}
                    
                    {/* Audio Player */}
                    {audioUrls[lesson.day] && (
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <AudioPlayer
                          audioUrl={audioUrls[lesson.day]}
                          title={`Day ${lesson.day} Audio`}
                          isPlaying={playingAudio[lesson.day]}
                          onPlayToggle={() => toggleAudio(lesson.day)}
                          externalAudio={audioElements[lesson.day]}
                          onDownload={() => {
                            const link = document.createElement('a');
                            link.href = audioUrls[lesson.day];
                            link.download = `Day_${lesson.day}_${lesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
                            link.click();
                          }}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            {Array.from(new Set(sprintData.emailSequence.map(email => email.day))).map(day => (
              <div key={day} className="card-wrapper">
                <div className="card-content">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] flex items-center justify-center">
                        <Mail className="w-3 h-3 text-black" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Day {day} Emails</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingEmail(editingEmail === `${day}` ? null : `${day}`)}
                      className="text-white hover:bg-white/10"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {sprintData.emailSequence
                      .filter(email => email.day === day)
                      .map((email, emailIndex) => {
                        const globalIndex = sprintData.emailSequence.findIndex(
                          e => e.day === email.day && e.type === email.type
                        );
                        const isEditing = editingEmail === `${day}`;
                        
                         return (
                          <div key={`${day}-${email.type}`} className="border border-white/10 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-white/60 text-sm font-medium">
                                Subject: {email.subject}
                              </div>
                            </div>
                            
                            {isEditing ? (
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-white/60">Subject</Label>
                                  <Input
                                    value={email.subject}
                                    onChange={(e) => handleEmailEdit(globalIndex, 'subject', e.target.value)}
                                    className="mt-1 bg-black/50 border-white/20 text-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white/60">Content</Label>
                                  <Textarea
                                    value={email.content}
                                    onChange={(e) => handleEmailEdit(globalIndex, 'content', e.target.value)}
                                    rows={6}
                                    className="mt-1 bg-black/50 border-white/20 text-white"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <h5 className="font-semibold text-white mb-2">{email.subject}</h5>
                                <div 
                                  className="text-white/80 leading-relaxed whitespace-pre-wrap"
                                  dangerouslySetInnerHTML={{ __html: renderMarkdown(email.content) }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
        </div>
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          isOpen={true}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo.videoUrl}
          lessonTitle={selectedVideo.lessonTitle}
          lessonDay={selectedVideo.lessonDay}
          sprintTitle={sprintData?.sprintTitle || ''}
        />
      )}
    </div>
  );
};