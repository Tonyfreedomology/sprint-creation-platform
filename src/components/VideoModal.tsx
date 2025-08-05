import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  lessonTitle: string;
  lessonDay: number;
  sprintTitle: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  lessonTitle,
  lessonDay,
  sprintTitle
}) => {
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sprintTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_day_${lessonDay}.mp4`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Video Downloaded",
        description: `Day ${lessonDay} video has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the video.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0 bg-background border-border">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Day {lessonDay}: {lessonTitle}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{sprintTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 p-6 flex items-center justify-center bg-black/5">
          <video
            src={videoUrl}
            controls
            className="w-full h-full max-h-[60vh] rounded-lg bg-black"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
};