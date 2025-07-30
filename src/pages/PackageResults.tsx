import React, { useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Copy, ExternalLink, QrCode, Mail, ArrowLeft, Volume2, Play, Pause, Link } from 'lucide-react';
import { toast } from 'sonner';

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

Welcome to Day ${i + 1} of your ${sprint.sprintTitle} journey!

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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Create Another Sprint
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Sprint Package Ready! 🎉</h1>
            <p className="text-muted-foreground">Your complete sprint delivery system is ready to deploy</p>
          </div>
        </div>

        {/* Package Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📦 Package Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{sprint.sprintDuration}</div>
                <div className="text-sm text-muted-foreground">Days of Content</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{audioCount}</div>
                <div className="text-sm text-muted-foreground">Audio Files Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{emailTemplates.length}</div>
                <div className="text-sm text-muted-foreground">Email Templates</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">{sprint.sprintTitle}</h3>
              <p className="text-muted-foreground text-sm">{sprint.sprintDescription}</p>
              <div className="flex gap-2">
                <Badge variant="secondary">{sprint.sprintCategory}</Badge>
                <Badge variant="outline">Voice: {sprint.voiceId ? 'Custom' : 'Default'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Portal */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📱 Mobile-Friendly Sprint Portal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg mb-4">
              <div>
                <p className="font-medium">Portal URL</p>
                <p className="text-sm text-muted-foreground break-all">{portalUrl}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(portalUrl, 'Portal URL')}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  onClick={async () => {
                    try {
                      const response = await supabase.functions.invoke('enroll-user', {
                        body: { sprintId: 'demo-sprint-123' }
                      });
                      
                      if (response.error) throw response.error;
                      
                      const enrollmentUrl = response.data.portalUrl;
                      window.open(enrollmentUrl, '_blank');
                    } catch (error) {
                      console.error('Failed to generate enrollment URL:', error);
                      window.open(portalUrl, '_blank');
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">QR Code for Easy Access</h4>
                <div className="bg-white p-4 rounded-lg border text-center">
                  <img src={qrCode} alt="QR Code" className="mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Scan with phone camera</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Portal Features</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Mobile-optimized audio player</li>
                  <li>✓ Progress tracking</li>
                  <li>✓ Speed controls</li>
                  <li>✓ Works offline after first load</li>
                  <li>✓ No app download required</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Templates */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              GHL Email Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <p className="text-muted-foreground">
                Ready-to-import email sequence for GoHighLevel
              </p>
              <Button onClick={downloadEmailTemplates}>
                <Download className="h-4 w-4 mr-2" />
                Download Templates
              </Button>
            </div>
            
            <div className="space-y-2">
              {emailTemplates.map((template: any) => (
                <div key={template.day} className="flex items-center justify-between p-3 bg-secondary/10 rounded">
                  <span className="text-sm">Magnetic: Day {template.day}</span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => copyToClipboard(template.ghlFormatted, `Day ${template.day} template`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audio Files */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎧 Generated Audio Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              All audio files are hosted and ready for delivery. Links are embedded in the portal and email templates.
            </p>
            
            {Object.keys(audioFiles).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(audioFiles).map(([day, url]) => (
                  <div key={day} className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg">
                    <span className="text-sm font-medium">Day {day} Audio</span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => toggleAudioPlayback(day, url as string)}
                        className="flex items-center gap-1"
                      >
                        {currentlyPlaying === day ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => downloadAudio(url as string, day)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(url as string, `Day ${day} audio link`)}
                        className="flex items-center gap-1"
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audio files were generated for this sprint.</p>
                <p className="text-sm">Audio generation may have failed or been skipped.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <h4 className="font-medium">Set Up GHL Custom Fields</h4>
                  <p className="text-sm text-muted-foreground mb-2">Create these custom contact fields in GoHighLevel:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <code>user_token</code> - Auto-generated unique ID</li>
                    <li>• <code>portal_url</code> - Your sprint portal base URL</li>
                    <li>• <code>sprint_title</code> - Sprint name for emails</li>
                    <li>• <code>creator_name</code> - Your name for email signatures</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <h4 className="font-medium">Import Email Templates to GHL</h4>
                  <p className="text-sm text-muted-foreground">Download and import the email templates into your GoHighLevel campaigns</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <h4 className="font-medium">Share the Portal</h4>
                  <p className="text-sm text-muted-foreground">Send participants the portal URL or QR code for easy mobile access</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</div>
                <div>
                  <h4 className="font-medium">Set Up Email Automation</h4>
                  <p className="text-sm text-muted-foreground">Configure your GHL automation to send daily emails with portal links</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}