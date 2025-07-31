import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AnimatedRays from '@/components/AnimatedRays';
import { SprintCreationForm } from '@/components/SprintCreationForm';
import { 
  Sparkles, 
  Users, 
  Brain, 
  Heart, 
  DollarSign, 
  Zap, 
  Target, 
  Clock, 
  Star,
  ChevronRight,
  Play,
  CheckCircle
} from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';

const Index = () => {
  const [showForm, setShowForm] = React.useState(false);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Content",
      description: "Let AI generate scripts, lessons, and exercises based on your expertise"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Community-Driven",
      description: "Built-in community features to keep participants engaged and accountable"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Habit Formation",
      description: "Scientifically-backed daily practices that create lasting transformation"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Automated Delivery",
      description: "Smart automation handles emails, reminders, and content delivery"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Gamification",
      description: "Streaks, badges, and rewards keep participants motivated"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Flexible Duration",
      description: "Create sprints from 7 to 40 days based on your content and goals"
    }
  ];

  const categories = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Health & Wellness",
      description: "Mental health, fitness, nutrition, and mindfulness sprints",
      color: "bg-gradient-to-br from-pink-500 to-rose-500"
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Wealth & Finance",
      description: "Money mindset, investing, budgeting, and financial freedom",
      color: "bg-gradient-to-br from-green-500 to-emerald-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Relationships",
      description: "Communication, dating, marriage, and social connections",
      color: "bg-gradient-to-br from-blue-500 to-cyan-500"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Personal Development",
      description: "Confidence, productivity, goals, and self-improvement",
      color: "bg-gradient-to-br from-purple-500 to-violet-500"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Wellness Coach",
      content: "Creating my first sprint was incredibly easy. The AI helped me structure 21 days of content in just hours!",
      rating: 5
    },
    {
      name: "Marcus Chen",
      role: "Financial Advisor",
      content: "My 'Money Mindset' sprint has helped over 500 people transform their relationship with money.",
      rating: 5
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Therapist",
      content: "The community features really make a difference. Participants support each other beautifully.",
      rating: 5
    }
  ];

  if (showForm) {
    return (
      <div className="min-h-screen" style={{ background: 'radial-gradient(circle at center, #0a0f1a 0%, #1a1a1a 70%, #0f0f0f 100%)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div>
              <Button
                variant="ghost"
                onClick={() => setShowForm(false)}
                className="mb-4 text-cool-text-secondary hover:text-white"
              >
                ← Back to Overview
              </Button>
              <h1 className="text-4xl font-bold text-white mb-4">
                Create Your <span style={{ color: '#22DFDC' }}>Transformational Sprint</span>
              </h1>
              <p className="text-xl text-cool-text-secondary max-w-2xl mx-auto">
                Turn your expertise into a powerful, community-driven experience that creates lasting change
              </p>
            </div>
          </div>
          
          <div>
            <SprintCreationForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'radial-gradient(circle at center, #060a0f 0%, #0f0f0f 70%, #080808 100%)' }}>
      {/* Animated Rays Background */}
      <AnimatedRays 
        intensity={0.2} 
        speed={0.3}
        color1="#22DFDC"
        color2="#22EDB6"
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16">
        <div className="container mx-auto px-4">
          {/* Hero Container with Gradient Border */}
          <div className="relative before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-tr before:from-[#22DFDC] before:to-[#22EDB6] before:p-[2px] mb-32">
            <div className="relative bg-[#111111] rounded-3xl p-8 md:p-12 border border-[#22DFDC]/30">
              {/* Video Background */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover rounded-3xl"
              >
                <source 
                  src="https://hufbbrvmcdugfrgjxwuv.supabase.co/storage/v1/object/sign/media/jonah_10079_A_vibrant_jade_digital_sappling_particle_effects__24600ee9-ca04-47cb-913a-4a15c5d7c153_3.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82OTA2Yzk4OC0zYjdiLTRmZmUtODNkNy1mMGE1ZDVlODkyODgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtZWRpYS9qb25haF8xMDA3OV9BX3ZpYnJhbnRfamFkZV9kaWdpdGFsX3NhcHBsaW5nX3BhcnRpY2xlX2VmZmVjdHNfXzI0NjAwZWU5LWNhMDQtNDdjYi05MTNhLTRhMTVjNWQ3YzE1M18zLm1wNCIsImlhdCI6MTc1MzkwMTc3MiwiZXhwIjoyMDY5MjYxNzcyfQ.Tk48j-rookfz-ZBZTm0guHfTyfCm0Sn5NMwJBN52eM8" 
                  type="video/mp4" 
                />
              </video>

              {/* Content Overlay */}
              <div className="relative z-10 flex items-center min-h-[600px]">
                <div className="w-full max-w-2xl space-y-6">
                  <div
                    className="border w-fit text-sm px-4 py-2 rounded-full"
                    style={{ 
                      backgroundColor: 'rgba(26, 26, 26, 0.8)',
                      border: '1px solid #22DFDC',
                      color: '#22DFDC',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2 inline" />
                    Transform Lives Through Sprints
                  </div>
                  
                  <h1 className="text-5xl md:text-[72px] leading-[1.1] font-bold text-white">
                    Create{' '}
                    <span 
                      className="bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] bg-clip-text text-transparent"
                    >
                      Powerful Sprints
                    </span>
                    {' '}That Change Lives
                  </h1>
                  
                  <p className="text-xl leading-relaxed max-w-[48ch]" style={{ color: '#CFCFCF', opacity: 0.9 }}>
                    Join Freedomology and turn your expertise into transformational 21-40 day experiences. 
                    Our AI-powered platform helps you create engaging, habit-forming sprints that deliver real results.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setShowForm(true)}
                      className="px-8 py-4 text-lg rounded-xl font-medium text-white transition-all hover:scale-105"
                      style={{ 
                        background: 'linear-gradient(135deg, #22DFDC, #22EDB6)',
                        border: 'none'
                      }}
                    >
                      Start Creating
                      <ChevronRight className="w-5 h-5 ml-2 inline" />
                    </button>
                    
                    <button
                      onClick={() => window.location.href = '/package-results'}
                      className="px-8 py-4 text-lg rounded-xl font-medium transition-all hover:scale-105"
                      style={{ 
                        color: '#22DFDC',
                        border: '1px solid #22DFDC',
                        backgroundColor: 'rgba(34, 223, 220, 0.1)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      Test Publish Page
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm" style={{ color: '#CFCFCF' }}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: '#22EDB6' }} />
                      No coding required
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: '#22EDB6' }} />
                      AI-powered content
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: '#22EDB6' }} />
                      Community included
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="relative before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-tr before:from-[#22DFDC] before:to-[#22EDB6] before:p-[2px]">
            <div className="relative bg-[#111111] rounded-3xl p-8 md:p-12 border border-[#22DFDC]/30">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4 text-white">
                  Everything You Need to Create{' '}
                  <span className="bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] bg-clip-text text-transparent">Amazing</span>
                </h2>
                <p className="text-xl max-w-3xl mx-auto" style={{ color: '#CFCFCF', opacity: 0.7 }}>
                  From AI-powered content creation to automated delivery and community building, 
                  we've got every aspect covered.
                </p>
              </div>
          
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="rounded-xl bg-[#1E1E1E]/70 backdrop-blur-md border border-transparent hover:border-[#22DFDC] transition-all duration-300 p-6 group hover:scale-105"
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform"
                      style={{ background: 'linear-gradient(135deg, #22DFDC, #22EDB6)' }}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-base" style={{ color: '#CFCFCF', opacity: 0.7 }}>
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
