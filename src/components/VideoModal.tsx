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
      <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0 bg-transparent border-none">
        {/* Gradient border container */}
        <div className="p-[1px] rounded-xl bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] h-full">
          {/* Inner container with dark background */}
          <div className="rounded-[11px] bg-neutral-950/95 backdrop-blur-sm h-full flex flex-col">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {lessonTitle}
                  </h2>
                  <p className="text-sm text-neutral-400 mt-1">{sprintTitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="sm"
                    className="p-2 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Video container - full height with no padding */}
            <div className="flex-1 relative overflow-hidden rounded-b-[11px]">
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-cover"
                preload="metadata"
                style={{ minHeight: '100%' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};