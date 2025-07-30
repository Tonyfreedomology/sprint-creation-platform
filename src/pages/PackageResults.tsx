import React, { useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProgressPill, TimestampPill } from '@/components/ui/progress-pill';
import { LessonCard } from '@/components/ui/lesson-card';
import { Download, Copy, ExternalLink, QrCode, Mail, ArrowLeft, Volume2, Play, Pause, Link } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function PackageResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  
  const packageData = searchParams.get('packageData');
  
  // If no package data, use mock data for testing
  const data = packageData 
    ? JSON.parse(decodeURIComponent(packageData))
    : {
        sprint: {
          sprintTitle: "Morning Mindfulness Mastery",
          sprintDescription: "Transform your mornings and unlock peak performance through science-backed mindfulness practices",
          sprintCategory: "Health & Wellness",
          sprintDuration: 21,
          voiceId: "custom"
        },
        portalUrl: "https://yourapp.com/sprint/demo-sprint-123",
        audioFiles: {
          "1": "https://example.com/audio/day-1.wav",
          "2": "https://example.com/audio/day-2.wav", 
          "3": "https://example.com/audio/day-3.wav",
          "4": "https://example.com/audio/day-4.wav",
          "5": "https://example.com/audio/day-5.wav"
        },
        emailTemplates: Array.from({length: 21}, (_, i) => ({
          day: i + 1,
          ghlFormatted: `Subject: Day ${i + 1} - {{custom_values.sprint_title}} 🚀

Hi {{first_name}},

Welcome to Day ${i + 1} of your Morning Mindfulness Mastery journey!

Today's lesson is now available in your portal:
👉 {{custom_values.portal_url}}?user={{custom_values.user_token}}

${i === 0 ? 'This is your personal link - bookmark it for easy access throughout your sprint!' : 'Continue building on yesterday\'s progress.'}

Ready to unlock today's transformation?

Best regards,
{{custom_values.creator_name}}`
        })),
        qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      };
  
  const { sprint, portalUrl, audioFiles, emailTemplates, qrCode } = data;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const downloadEmailTemplates = () => {
    const ghlContent = emailTemplates
      .map((template: any) => template.ghlFormatted)
      .join('\n\n' + '='.repeat(50) + '\n\n');
    
    const blob = new Blob([ghlContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sprint.sprintTitle}-email-templates.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Email templates downloaded!');
  };

  const toggleAudioPlayback = (day: string, url: string) => {
    if (currentlyPlaying === day) {
      // Pause current audio
      audioRefs.current[day]?.pause();
      setCurrentlyPlaying(null);
    } else {
      // Stop any currently playing audio
      if (currentlyPlaying && audioRefs.current[currentlyPlaying]) {
        audioRefs.current[currentlyPlaying].pause();
      }
      
      // Create new audio element if it doesn't exist
      if (!audioRefs.current[day]) {
        audioRefs.current[day] = new Audio(url);
        audioRefs.current[day].addEventListener('ended', () => {
          setCurrentlyPlaying(null);
        });
      }
      
      // Play the selected audio
      audioRefs.current[day].play();
      setCurrentlyPlaying(day);
    }
  };

  const downloadAudio = (url: string, day: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `day-${day}-audio.wav`;
    link.click();
    toast.success(`Day ${day} audio download started!`);
  };

  const audioCount = Object.keys(audioFiles).length;

  return (
    <div className="min-h-screen bg-background dark">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Page Frame with Gradient Border */}
        <motion.div 
          className="relative border-2 rounded-3xl p-8 md:p-12 bg-background"
          style={{
            background: 'linear-gradient(135deg, hsl(179 73% 50%), hsl(152 84% 53%)) padding-box, hsl(var(--background)) content-box',
            border: '2px solid transparent',
            backgroundClip: 'padding-box, border-box',
            backgroundOrigin: 'padding-box, border-box'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-12">
            {/* Left: Back Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </motion.div>
            
            {/* Center: Title */}
            <div className="flex-1 text-center lg:text-left">
              <motion.h1 
                className="text-4xl lg:text-6xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <span className="text-foreground">Sprint Package</span>
                <br />
                <span className="text-primary">Ready!</span>
              </motion.h1>
            </div>
            
            {/* Right: Progress Pills */}
            <div className="flex flex-col sm:flex-row gap-3">
              <ProgressPill completed={audioCount} total={sprint.sprintDuration} />
              <TimestampPill timestamp="16:07:24 5ah outro" />
            </div>
          </div>
          
          {/* Meta Mini Cards */}
          <div className="flex flex-wrap gap-6 mb-12">
            <motion.div 
              className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 min-w-[140px]"
              whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-glassmorphic)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">Duration</div>
                <div className="text-3xl font-bold text-foreground">{sprint.sprintDuration} days</div>
              </div>
            </motion.div>
            <motion.div 
              className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 min-w-[140px]"
              whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-glassmorphic)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">Total lessons</div>
                <div className="text-3xl font-bold text-foreground">{emailTemplates.length}</div>
              </div>
            </motion.div>
          </div>

          {/* Tabs for Lessons and Emails */}
          <Tabs defaultValue="lessons" className="mb-8">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
              <TabsTrigger value="lessons" className="text-sm font-medium">Lessons</TabsTrigger>
              <TabsTrigger value="emails" className="text-sm font-medium">Emails</TabsTrigger>
            </TabsList>
            
            <TabsContent value="lessons" className="space-y-6">
              {/* Sprint Overview Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <LessonCard
                  title="Sprint Overview"
                  content={sprint.sprintDescription}
                  day={0}
                  className="mb-6"
                />
              </motion.div>
              
              {/* Lesson Cards */}
              {Array.from({length: sprint.sprintDuration}, (_, i) => (
                <motion.div
                  key={i + 1}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1), duration: 0.6 }}
                >
                  <LessonCard
                    title={`Sample Lesson Title for Day ${i + 1}`}
                    content={`This is day ${i + 1} of your ${sprint.sprintTitle} journey!

Today's focus will be on building momentum and creating lasting change through practical exercises.

Challenge: Take 10 minutes today to practice the techniques we've covered. Notice how your mindset shifts when you apply these principles consistently.

Remember, transformation happens through consistent daily action, not perfection.`}
                    day={i + 1}
                    audioUrl={audioFiles[String(i + 1)]}
                    onGenerateAudio={() => toast.info(`Generating audio for Day ${i + 1}...`)}
                    onEdit={() => toast.info(`Edit Day ${i + 1} lesson`)}
                  />
                </motion.div>
              ))}
            </TabsContent>
            
            <TabsContent value="emails">
              {/* Email Templates Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Mail className="h-5 w-5" />
                      GHL Email Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-muted-foreground">
                        Ready-to-import email sequence for GoHighLevel
                      </p>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button onClick={downloadEmailTemplates} className="bg-gradient-primary hover:opacity-90 transition-opacity">
                          <Download className="h-4 w-4 mr-2" />
                          Download Templates
                        </Button>
                      </motion.div>
                    </div>
                    
                    <div className="space-y-3">
                      {emailTemplates.map((template: any) => (
                        <motion.div 
                          key={template.day} 
                          className="flex items-center justify-between p-4 bg-muted/10 rounded-lg border border-primary/10"
                          whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.15)' }}
                          transition={{ duration: 0.2 }}
                        >
                          <span className="text-sm font-medium">Day {template.day} Email Template</span>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => copyToClipboard(template.ghlFormatted, `Day ${template.day} template`)}
                            className="hover:bg-primary/10"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}