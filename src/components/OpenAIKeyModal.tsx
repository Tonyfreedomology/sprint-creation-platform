import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Key } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OpenAIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (apiKey: string) => void;
}

export const OpenAIKeyModal: React.FC<OpenAIKeyModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [apiKey, setApiKey] = useState('');
  const [rememberKey, setRememberKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      if (rememberKey) {
        localStorage.setItem('openai_api_key', apiKey.trim());
      }
      onSubmit(apiKey.trim());
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            OpenAI API Key Required
          </DialogTitle>
          <DialogDescription>
            To generate your sprint content with AI, we need your OpenAI API key.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">OpenAI API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="remember"
              checked={rememberKey}
              onChange={(e) => setRememberKey(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="remember" className="text-sm text-muted-foreground">
              Remember this key for future sessions
            </Label>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your API key is stored securely in your browser and never sent to our servers.
              Get your API key from{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenAI Dashboard
              </a>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Start Generation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};