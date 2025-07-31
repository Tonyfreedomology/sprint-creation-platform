import React, { useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, ExternalLink, QrCode, Mail, ArrowLeft, Volume2, Play, Pause, Link, MoreHorizontal, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function PackageResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  
  const packageData = searchParams.get('packageData');
  
  // Mock data to match the target design
  const data = packageData 
    ? JSON.parse(decodeURIComponent(packageData))
    : {
        sprint: {
          sprintTitle: "Magnetic - 7 Days to Lead Your Marriage with Confidence & Desire",
          sprintDescription: "Transform your relationship through proven masculine leadership principles and authentic connection strategies.",
          sprintCategory: "Relationships",
          sprintDuration: 7,
          voiceId: "custom"
        },
        portalUrl: "https://yourapp.com/sprint/demo-sprint-123",
        audioFiles: {
          "1": "https://example.com/audio/day-1.wav",
          "2": "https://example.com/audio/day-2.wav", 
        },
        emailTemplates: Array.from({length: 7}, (_, i) => ({
          day: i + 1,
          ghlFormatted: `Subject: Day ${i + 1} - {{custom_values.sprint_title}} 🚀

Hi {{first_name}},

Welcome to Day ${i + 1} of your Magnetic journey!

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
      audioRefs.current[day]?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (currentlyPlaying && audioRefs.current[currentlyPlaying]) {
        audioRefs.current[currentlyPlaying].pause();
      }
      
      if (!audioRefs.current[day]) {
        audioRefs.current[day] = new Audio(url);
        audioRefs.current[day].addEventListener('ended', () => {
          setCurrentlyPlaying(null);
        });
      }
      
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
    <div className="page-wrapper">
      <div className="page-content">
        <div className="max-w-7xl mx-auto">
          {/* Main Container with Gradient Border */}
          <div className="p-[2px] rounded-3xl bg-gradient-to-r from-[#22DFDC] to-[#22EDB6]">
            <div className="relative rounded-3xl bg-neutral-950/90 backdrop-blur-sm p-8 md:p-12">
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
            {/* Left: Back Button */}
            <div>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')} 
                className="text-cool-text-secondary hover:text-white transition-all hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            
            {/* Center: Title */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl lg:text-5xl font-bold leading-tight text-white mb-2">
                Magnetic - 7 Days to Lead Your Marriage
              </h1>
              <h2 className="text-2xl lg:text-4xl font-bold" style={{ color: '#22DFDC' }}>
                with Confidence & Desire
              </h2>
            </div>
            
            {/* Right: Status Pills */}
            <div className="flex flex-col gap-3">
              <div className="px-4 py-2 rounded-full backdrop-blur-sm bg-gradient-glassmorphic border border-primary/20 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Publishing Progress</span>
                  <span className="text-primary font-medium">7 / 8</span>
                </div>
              </div>
              <div className="px-4 py-2 rounded-full backdrop-blur-sm bg-gradient-glassmorphic border border-primary/20 text-sm">
                <div className="text-muted-foreground">
                  16:07:24 5ah outro
                </div>
              </div>
            </div>
          </div>
          
          {/* Meta Cards */}
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="bg-neutral-900/50 backdrop-blur-sm rounded-lg p-6 text-center border border-neutral-800/50 min-w-[140px] transition-all hover:scale-105">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#22DFDC]/20 to-[#22EDB6]/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#22DFDC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-white/60 text-sm font-medium mb-1">Duration</div>
              <div className="text-[#22DFDC] text-xl font-semibold">7 days</div>
            </div>
            <div className="bg-neutral-900/50 backdrop-blur-sm rounded-lg p-6 text-center border border-neutral-800/50 min-w-[140px] transition-all hover:scale-105">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#22DFDC]/20 to-[#22EDB6]/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#22DFDC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-white/60 text-sm font-medium mb-1">Total lessons</div>
              <div className="text-[#22DFDC] text-xl font-semibold">7</div>
            </div>
          </div>

          {/* Sprint Overview Card */}
          <div className="p-[1px] rounded-xl bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] mb-6">
            <div className="rounded-xl bg-neutral-950/90 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] flex items-center justify-center">
                    <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Sprint Overview</h2>
                    <p className="text-white/60 text-sm">Key details about your sprint</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white hover:bg-white/10"
                    title="View Lessons"
                  >
                    Lessons
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white hover:bg-white/10"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Cards */}
          <div className="space-y-4">
            <div className="p-[1px] rounded-xl bg-gradient-to-r from-[#22DFDC] to-[#22EDB6]">
              <div className="rounded-xl bg-neutral-950/90 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] flex items-center justify-center">
                      <span className="text-black text-xs font-bold">1</span>
                    </div>
                    <h3 className="text-xl font-semibold text-[#22DFDC]">
                      Day 1: Awakening Your Masculine Presence
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-white/10"
                      title="Generate Audio"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-white/10"
                      title="More Options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-white/10"
                      title="Edit Lesson"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              <div className="text-white">
                <p className="mb-3">
                  Welcome to Day 1 of your sprint 'Magnetic— 7 Days to Lead Your Marriage with Confidence & Desire!'
                  Today, we awakening on transformative journey focused on awakening your masculine presence and
                  embodied confidence, as well. Encasing the t ore tone resets the current todata sesdy srief, yer learn. how the
                  core classence focus is today is awaken your masculine presence today to awaken your masculine presence
                </p>
                <p className="mb-3" style={{ color: '#22EDB6' }}>
                  In refelctions and prattices, you'll learn to embody sexuał leadership, deepen connect ton,
                  and create relationship that pulses with attra-
                </p>
                <p style={{ color: '#22EDB6' }}>
                  Challenge your comforting lrabits tonight by spending ten minutes grounding yourself in
                  that presence with your wife.
                </p>
                </div>
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}