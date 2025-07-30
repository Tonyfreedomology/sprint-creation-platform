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
    <div className="min-h-screen bg-cool-grey p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Container with Cyan Border */}
        <div 
          className="relative rounded-3xl p-8 md:p-12"
          style={{
            background: '#242424',
            border: '2px solid #22DFDC'
          }}
        >
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
              <div 
                className="px-4 py-2 rounded-lg text-sm transition-all hover:scale-105"
                style={{
                  background: '#242424',
                  border: '1px solid #22DFDC',
                  color: '#CFCFCF'
                }}
              >
                Publishing Progress: 7 / 8
              </div>
              <div 
                className="px-4 py-2 rounded-lg text-sm transition-all hover:scale-105"
                style={{
                  background: '#242424',
                  border: '1px solid #22DFDC', 
                  color: '#CFCFCF'
                }}
              >
                16:07:24 5ah outro
              </div>
            </div>
          </div>
          
          {/* Meta Cards */}
          <div className="flex flex-wrap gap-6 mb-8">
            <div 
              className="rounded-2xl p-6 min-w-[140px] transition-all hover:scale-105"
              style={{
                background: '#1a1a1a',
                border: '1px solid #22DFDC'
              }}
            >
              <div className="text-center">
                <div className="text-lg font-medium text-cool-text-secondary mb-1">Duration</div>
                <div className="text-2xl font-bold text-white">7 days</div>
              </div>
            </div>
            <div 
              className="rounded-2xl p-6 min-w-[140px] transition-all hover:scale-105"
              style={{
                background: '#1a1a1a',
                border: '1px solid #22DFDC'
              }}
            >
              <div className="text-center">
                <div className="text-lg font-medium text-cool-text-secondary mb-1">Total lessons</div>
                <div className="text-2xl font-bold text-white">7</div>
              </div>
            </div>
          </div>

          {/* Sprint Overview Card */}
          <div 
            className="rounded-2xl p-6 mb-6 transition-all hover:scale-105"
            style={{
              background: '#1a1a1a',
              border: '1px solid #22DFDC'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-cool-blue flex items-center justify-center">
                  <span className="text-cool-blue text-sm">📋</span>
                </div>
                <h3 className="text-xl font-semibold text-white">Sprint Overview</h3>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" className="text-cool-blue hover:bg-cool-blue/10 transition-all hover:scale-105">
                  Lessons
                </Button>
                <Button variant="ghost" className="text-cool-text-secondary hover:bg-cool-text-secondary/10 transition-all hover:scale-105">
                  Edit
                </Button>
              </div>
            </div>
          </div>

          {/* Lesson Cards */}
          <div className="space-y-4">
            <div 
              className="rounded-2xl p-6 transition-all hover:scale-105"
              style={{
                background: '#1a1a1a',
                border: '1px solid #22DFDC'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold" style={{ color: '#22DFDC' }}>
                  Day 1: Awakening Your Masculine Presence
                </h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-cool-text-secondary hover:bg-cool-text-secondary/10 transition-all hover:scale-105">
                    Generate Audio
                  </Button>
                  <Button variant="ghost" size="sm" className="text-cool-text-secondary hover:bg-cool-text-secondary/10 transition-all hover:scale-105">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-cool-text-secondary hover:bg-cool-text-secondary/10 transition-all hover:scale-105">
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
  );
}