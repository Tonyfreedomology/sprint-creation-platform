import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Lock, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Sprint {
  id: string;
  sprint_id: string;
  title: string;
  description: string;
  duration: number;
  daily_lessons: any[];
  creator_info: any;
  audio_files: Record<string, string>;
}

export default function SprintPortal() {
  const { sprintId } = useParams<{ sprintId: string }>();
  const [searchParams] = useSearchParams();
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingDay, setPlayingDay] = useState<number | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<number, number>>({});
  const [userProgress, setUserProgress] = useState<any>(null);
  const [maxUnlockedDay, setMaxUnlockedDay] = useState(1);

  useEffect(() => {
    if (sprintId) {
      initializeUserProgress();
    }
  }, [sprintId]);

  const initializeUserProgress = async () => {
    try {
      const userToken = searchParams.get('user');
      
      if (!userToken) {
        // No user token - create new enrollment
        await enrollUser();
      } else {
        // User token provided - check existing progress
        await checkUserProgress(userToken);
      }
      
      await fetchSprint();
    } catch (error) {
      console.error('Error initializing user progress:', error);
      setLoading(false);
    }
  };

  const enrollUser = async () => {
    try {
      const response = await supabase.functions.invoke('enroll-user', {
        body: { sprintId }
      });
      
      if (response.error) throw response.error;
      
      setUserProgress(response.data);
      setMaxUnlockedDay(response.data.maxUnlockedDay);
      
      // Update URL with user token
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('user', response.data.userToken);
      window.history.replaceState({}, '', newUrl.toString());
    } catch (error) {
      console.error('Error enrolling user:', error);
      toast.error('Failed to start sprint');
    }
  };

  const checkUserProgress = async (userToken: string) => {
    try {
      const response = await supabase.functions.invoke('enroll-user', {
        body: { sprintId, userToken }
      });
      
      if (response.error) throw response.error;
      
      setUserProgress(response.data);
      setMaxUnlockedDay(response.data.maxUnlockedDay);
    } catch (error) {
      console.error('Error checking user progress:', error);
      // If token is invalid, create new enrollment
      await enrollUser();
    }
  };

  const fetchSprint = async () => {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('sprint_id', sprintId)
        .single();

      if (error) throw error;
      setSprint(data as Sprint);
    } catch (error) {
      console.error('Error fetching sprint:', error);
      toast.error('Sprint not found');
    } finally {
      setLoading(false);
    }
  };

  const toggleAudio = async (day: number) => {
    try {
      if (playingDay === day && currentAudio) {
        // Pause current audio
        currentAudio.pause();
        setPlayingDay(null);
        setCurrentAudio(null);
        return;
      }

      // Stop any playing audio
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }

      // Start new audio
      const audioUrl = sprint?.audio_files[day.toString()];
      if (!audioUrl) {
        toast.error('Audio not available for this day');
        return;
      }

      const audio = new Audio(audioUrl);
      audio.addEventListener('loadstart', () => setPlayingDay(day));
      audio.addEventListener('ended', () => {
        setPlayingDay(null);
        setCurrentAudio(null);
      });
      audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        setAudioProgress(prev => ({ ...prev, [day]: progress }));
      });

      await audio.play();
      setCurrentAudio(audio);
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Error playing audio');
      setPlayingDay(null);
    }
  };

  const resetAudio = (day: number) => {
    if (currentAudio && playingDay === day) {
      currentAudio.currentTime = 0;
      setAudioProgress(prev => ({ ...prev, [day]: 0 }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading sprint...</p>
        </div>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-2">Sprint Not Found</h2>
            <p className="text-muted-foreground">The sprint you're looking for doesn't exist or hasn't been published yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">{sprint.title}</h1>
            <p className="text-muted-foreground mb-4">{sprint.description}</p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
              <span>Created by {sprint.creator_info.name}</span>
              <span>•</span>
              <span>{sprint.duration} days</span>
            </div>
            
            {userProgress && (
              <div className="flex items-center justify-center gap-4 mb-2">
                <Badge variant="secondary">
                  Day {userProgress.currentDay} of {sprint.duration}
                </Badge>
                <Badge variant="outline">
                  {maxUnlockedDay} {maxUnlockedDay === 1 ? 'day' : 'days'} unlocked
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Lessons */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {sprint.daily_lessons.map((lesson: any, index: number) => {
            const dayNumber = index + 1;
            const isPlaying = playingDay === dayNumber;
            const progress = audioProgress[dayNumber] || 0;
            const hasAudio = sprint.audio_files[dayNumber.toString()];
            const isLocked = dayNumber > maxUnlockedDay;
            const isComingSoon = dayNumber === maxUnlockedDay + 1;

            return (
              <Card key={dayNumber} className={`overflow-hidden ${isLocked ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3 mb-2">
                        <span className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium ${
                          isLocked 
                            ? 'bg-muted text-muted-foreground' 
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          {isLocked ? <Lock className="h-4 w-4" /> : dayNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          {isLocked ? 'Coming Soon' : lesson.title}
                          {isComingSoon && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Unlocks Tomorrow
                            </Badge>
                          )}
                        </div>
                      </CardTitle>
                    </div>
                    {hasAudio && !isLocked && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resetAudio(dayNumber)}
                          disabled={!isPlaying}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => toggleAudio(dayNumber)}
                          className="min-w-[80px]"
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Play
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  {hasAudio && progress > 0 && !isLocked && (
                    <Progress value={progress} className="mt-2" />
                  )}
                </CardHeader>
                <CardContent>
                  {isLocked ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium mb-2">This content is locked</p>
                      <p className="text-sm">
                        {isComingSoon 
                          ? 'Come back tomorrow to unlock this lesson!'
                          : `This lesson unlocks on day ${dayNumber} of your sprint`
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-muted-foreground">
                        {lesson.content}
                      </div>
                      {lesson.exercise && (
                        <div className="mt-4 p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                          <h4 className="font-medium text-primary mb-2">Today's Exercise</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {lesson.exercise}
                          </p>
                        </div>
                      )}
                      {lesson.affirmation && (
                        <div className="mt-4 p-4 bg-secondary/20 rounded-lg text-center">
                          <h4 className="font-medium mb-2">Affirmation</h4>
                          <p className="text-sm italic">"{lesson.affirmation}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}