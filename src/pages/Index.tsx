import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AnimatedRays from '@/components/AnimatedRays';
import { SprintCreationForm } from '@/components/SprintCreationForm';
import RollingTextButton from '@/components/RollingTextButton';
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
import { OptimizedThreeScene } from '@/components/OptimizedThreeScene';

const Index = () => {
  const [showForm, setShowForm] = React.useState(false);

  const benefits = [
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Zero code",
      description: "Focus on your program, not web design."
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-generated content",
      description: "Daily prompts, check-ins, and resources written for you."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Community built-in",
      description: "Automatic discussion forums and accountability groups."
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Pick a goal",
      description: "Health, relationships, mindset—choose the change you're here to guide."
    },
    {
      step: "2", 
      title: "Let the AI do the heavy lifting",
      description: "Our engine drafts daily emails, journaling prompts and tasks that keep participants engaged."
    },
    {
      step: "3",
      title: "Launch and lead",
      description: "Invite people in, track their progress and cheer them on. We handle delivery, reminders and community chat."
    }
  ];

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Habit science built in",
      description: "Our system uses proven habit-forming frameworks so your participants see progress fast."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Automated delivery",
      description: "Content drips out on schedule—no manual sendouts."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Built-in community",
      description: "Discussion forums and group coaching tools foster accountability."
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Analytics that matter",
      description: "See completion rates, engagement scores and feedback at a glance."
    }
  ];

  const creatorBenefits = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Recurring revenue",
      description: "Once your sprint is live, people can join anytime."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Evergreen content", 
      description: "Update once; your sprint keeps selling itself."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Focus on coaching",
      description: "We handle tech, you handle transformation."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Build an audience",
      description: "Participants become fans who join your next sprint or coaching offer."
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
      name: "Sarah J.",
      role: "Relationship Coach",
      content: "I used to cobble together spreadsheets and email blasts. With this platform, my 40-day marriage-reset sprint got over 200 sign-ups and 97% completion.",
      results: "200+ sign-ups, 97% completion rate",
      rating: 5
    },
    {
      name: "Mark D.",
      role: "Personal Trainer",
      content: "As a fitness trainer, I launched a 21-day strength sprint and watched my clients actually finish the program for once. Built my email list from 0 to 1,200 in 3 months.",
      results: "1,200 email subscribers in 3 months",
      rating: 5
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Therapist & Author",
      content: "The community features really make a difference. Participants support each other beautifully. My anxiety management sprint has generated $15k in recurring revenue.",
      results: "$15k monthly recurring revenue",
      rating: 5
    },
    {
      name: "Jennifer Chen",
      role: "Life Coach",
      content: "I was skeptical about AI-generated content, but it actually captures my voice perfectly. Saved me 20+ hours per week while doubling my client engagement.",
      results: "20+ hours saved weekly",
      rating: 5
    },
    {
      name: "Alex Thompson",
      role: "Productivity Expert",
      content: "Launched my first sprint in under 2 hours. The habit science framework is genius—participants see results faster than any other program I've tried.",
      results: "2-hour setup time",
      rating: 5
    },
    {
      name: "Maria Santos",
      role: "Nutrition Coach",
      content: "The automated email sequences keep my participants engaged without me having to manually follow up. My completion rates went from 40% to 89%.",
      results: "89% completion rate increase",
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
                Create Your <span className="bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] bg-clip-text text-transparent">Transformational Sprint</span>
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
      {/* Animated Rays - Fixed at top, behind content */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <AnimatedRays 
          intensity={0.15} 
          speed={0.3}
          color1="#22DFDC"
          color2="#22EDB6"
        />
      </div>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16" style={{ zIndex: 10 }}>
        <div className="container mx-auto px-4">
          {/* Hero Container with Gradient Border */}
          <div className="relative before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-tr before:from-[#22DFDC] before:to-[#22EDB6] before:p-[2px] mb-32">
            <div className="relative bg-[#111111] rounded-3xl p-8 md:p-12 border border-[#22DFDC]/30 overflow-hidden">
              {/* Optimized Three.js Scene Background */}
              <OptimizedThreeScene className="rounded-3xl" />

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
                    Change Lives Through Sprints
                  </div>
                  
                  <h1 className="text-5xl md:text-[72px] leading-[1.1] font-bold text-white">
                    Build{' '}
                    <span 
                      className="bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] bg-clip-text text-transparent"
                    >
                      life-changing
                    </span>
                    {' '}30-day sprints
                  </h1>
                  
                  <p className="text-xl leading-relaxed max-w-[48ch]" style={{ color: '#CFCFCF', opacity: 0.9 }}>
                    You've got knowledge that could change someone's life. Our AI-powered platform helps you turn that expertise into guided 21–40-day journeys that break bad habits, build good ones and get real results. No coding, no tech headaches—just you and your mission.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <RollingTextButton
                      onClick={() => setShowForm(true)}
                      data-testid="get-started-button"
                      className="px-8 py-4 text-lg rounded-full font-medium text-white transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
                      style={{ 
                        background: 'linear-gradient(135deg, #22DFDC, #22EDB6)',
                        border: 'none',
                        boxShadow: '0 0 20px rgba(34, 223, 220, 0.4), 0 4px 15px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      Get started free
                    </RollingTextButton>
                    
                    {/* Test Publish Page Button - Commented out
                    <button
                      onClick={() => window.location.href = '/package-results'}
                      className="px-8 py-4 text-lg rounded-full font-medium transition-all hover:scale-105 shadow-lg"
                      style={{ 
                        color: '#22DFDC',
                        border: '1px solid #22DFDC',
                        backgroundColor: 'rgba(34, 223, 220, 0.1)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 0 15px rgba(34, 223, 220, 0.2), 0 4px 10px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      Test Publish Page
                    </button>
                    */}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2" style={{ color: '#CFCFCF' }}>
                        <div style={{ color: '#22EDB6' }}>
                          {benefit.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{benefit.title}</div>
                          <div className="opacity-70">{benefit.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why It Matters Section */}
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-12 text-center max-w-4xl mx-auto border border-white/10 mb-32">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] bg-clip-text text-transparent">
              Why It Matters
            </h2>
            <p className="text-xl leading-relaxed" style={{ color: '#CFCFCF', opacity: 0.9 }}>
              Building a new habit is hard. Doing it alone is even harder. Our sprints bring people together in a focused, bite-size challenge so they actually stick with it. Think of it as your own 30-day bootcamp—built once, sold again and again.
            </p>
          </div>

          {/* How It Works Section */}
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-12 max-w-6xl mx-auto border border-white/10 mb-32">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] bg-clip-text text-transparent">
                How It Works
              </h2>
              <p className="text-xl max-w-3xl mx-auto" style={{ color: '#CFCFCF', opacity: 0.7 }}>
                Three easy steps to launch your life-changing sprint
              </p>
            </div>
        
            <div className="grid md:grid-cols-3 gap-8">
              {howItWorks.map((step, index) => (
                <div key={index} className="text-center group">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-6 mx-auto group-hover:scale-110 transition-transform"
                    style={{ background: 'linear-gradient(135deg, #22DFDC, #22EDB6)' }}
                  >
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-base" style={{ color: '#CFCFCF', opacity: 0.7 }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Features at a Glance Section */}
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-12 max-w-6xl mx-auto border border-white/10 mb-32">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] bg-clip-text text-transparent">
                Features at a Glance
              </h2>
            </div>
        
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          {/* Social Proof Section */}
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-12 max-w-6xl mx-auto border border-white/10 mb-32">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] bg-clip-text text-transparent">
                What other creators are saying
              </h2>
            </div>
        
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.slice(0, 6).map((testimonial, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-[#1E1E1E]/70 backdrop-blur-md border border-transparent p-6"
                >
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-[#22EDB6] text-[#22EDB6]" />
                    ))}
                  </div>
                  <p className="text-base mb-4" style={{ color: '#CFCFCF', opacity: 0.9 }}>
                    "{testimonial.content}"
                  </p>
                  <div className="mb-4 p-3 rounded-lg bg-[#22DFDC]/10 border border-[#22DFDC]/20">
                    <p className="text-sm font-medium text-[#22DFDC]">
                      📈 {testimonial.results}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm" style={{ color: '#CFCFCF', opacity: 0.7 }}>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why You'll Love It Section */}
          <div className="relative before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-tr before:from-[#22DFDC] before:to-[#22EDB6] before:p-[2px] mb-32">
            <div className="relative bg-[#111111] rounded-3xl p-8 md:p-12 border border-[#22DFDC]/30">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4 text-white">
                  Why You'll <span className="bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] bg-clip-text text-transparent">Love It</span>
                </h2>
                <p className="text-xl max-w-3xl mx-auto" style={{ color: '#CFCFCF', opacity: 0.7 }}>
                  Creator benefits that make this platform irresistible
                </p>
              </div>
          
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {creatorBenefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="rounded-xl bg-[#1E1E1E]/70 backdrop-blur-md border border-transparent hover:border-[#22DFDC] transition-all duration-300 p-6 group hover:scale-105"
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform"
                      style={{ background: 'linear-gradient(135deg, #22DFDC, #22EDB6)' }}
                    >
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{benefit.title}</h3>
                    <p className="text-base" style={{ color: '#CFCFCF', opacity: 0.7 }}>
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Closing CTA Section */}
          <div className="relative before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-tr before:from-[#22DFDC] before:to-[#22EDB6] before:p-[2px] mb-32">
            <div className="relative bg-[#111111] rounded-3xl p-8 md:p-12 border border-[#22DFDC]/30 text-center">
              <h2 className="text-4xl font-bold mb-6 text-white">
                Ready to make your expertise a{' '}
                <span className="bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] bg-clip-text text-transparent">catalyst for change?</span>
              </h2>
              <p className="text-xl leading-relaxed mb-8 max-w-4xl mx-auto" style={{ color: '#CFCFCF', opacity: 0.9 }}>
                Stop sitting on that brilliant idea. Build your sprint today and watch lives transform—including yours.
              </p>
              <RollingTextButton
                onClick={() => setShowForm(true)}
                className="px-8 py-4 text-lg rounded-full font-medium text-white transition-all hover:scale-105 flex items-center gap-2 shadow-lg mx-auto"
                style={{ 
                  background: 'linear-gradient(135deg, #22DFDC, #22EDB6)',
                  border: 'none',
                  boxShadow: '0 0 20px rgba(34, 223, 220, 0.4), 0 4px 15px rgba(0, 0, 0, 0.2)'
                }}
              >
                Get started free
              </RollingTextButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
