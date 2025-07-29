import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Copy, ExternalLink, QrCode, Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function PackageResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const packageData = searchParams.get('packageData');
  
  if (!packageData) {
    navigate('/');
    return null;
  }

  const data = JSON.parse(decodeURIComponent(packageData));
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
                <Button size="sm" onClick={() => window.open(portalUrl, '_blank')}>
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
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {emailTemplates.map((template: any) => (
                <div key={template.day} className="flex items-center justify-between p-3 bg-secondary/10 rounded">
                  <span className="text-sm">Day {template.day}: {template.subject}</span>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(audioFiles).map(([day, url]) => (
                <div key={day} className="flex items-center justify-between p-3 bg-secondary/10 rounded">
                  <span className="text-sm font-medium">Day {day} Audio</span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => window.open(url as string, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
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
                  <h4 className="font-medium">Import Email Templates to GHL</h4>
                  <p className="text-sm text-muted-foreground">Download and import the email templates into your GoHighLevel campaigns</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <h4 className="font-medium">Share the Portal</h4>
                  <p className="text-sm text-muted-foreground">Send participants the portal URL or QR code for easy mobile access</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
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