import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play, MoreHorizontal, Edit, Download, Copy, Link } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader } from './card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

interface LessonCardProps {
  title: string;
  content: string;
  day: number;
  onGenerateAudio?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  onCopyLink?: () => void;
  audioUrl?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function LessonCard({ 
  title, 
  content, 
  day,
  onGenerateAudio,
  onEdit,
  onDownload,
  onCopyLink,
  audioUrl,
  isOpen = true,
  onToggle,
  className = ""
}: LessonCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(!isOpen);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToggle?.();
  };

  // Format content to highlight challenge/action items in jade
  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      const isChallenge = line.toLowerCase().includes('challenge') || 
                         line.toLowerCase().includes('action') ||
                         line.toLowerCase().includes('practice') ||
                         line.toLowerCase().includes('exercise');
      
      return (
        <p key={index} className={`mb-3 ${isChallenge ? 'text-accent font-medium' : 'text-foreground'}`}>
          {line}
        </p>
      );
    });
  };

  return (
    <motion.div
      className={className}
      whileHover={{ 
        y: -2, 
        boxShadow: 'var(--shadow-elegant)' 
      }}
      transition={{ duration: 0.25 }}
    >
      <Card className={`
        border-2 transition-all duration-300
        ${!isCollapsed 
          ? 'bg-gradient-stroke border-transparent shadow-glassmorphic' 
          : 'border-border hover:border-primary/30'
        }
      `}>
        <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
          <CollapsibleTrigger asChild>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/5 transition-colors duration-200"
              onClick={handleToggle}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: isCollapsed ? -90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-primary">
                    Day {day}: {title}
                  </h2>
                </div>
                
                <div className="flex items-center gap-2">
                  {audioUrl && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle audio play
                      }}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateAudio?.();
                    }}
                  >
                    Generate Audio
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle more options
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <AnimatePresence>
            {!isCollapsed && (
              <CollapsibleContent asChild>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <CardContent className="pt-0">
                    <div className="max-w-[65ch] prose prose-sm">
                      {formatContent(content)}
                    </div>
                  </CardContent>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Collapsible>
      </Card>
    </motion.div>
  );
}