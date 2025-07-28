import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
              className="mb-4"
            >
              ← Back to Overview
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
              Create Your Transformational Sprint
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Turn your expertise into a powerful, community-driven experience that creates lasting change
            </p>
          </div>
          
          <SprintCreationForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <Badge className="bg-gradient-primary text-white border-0 w-fit">
                <Sparkles className="w-4 h-4 mr-2" />
                Transform Lives Through Sprints
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Create{' '}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  Powerful Sprints
                </span>
                {' '}That Change Lives
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Join Freedomology and turn your expertise into transformational 21-40 day experiences. 
                Our AI-powered platform helps you create engaging, habit-forming sprints that deliver real results.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  variant="hero"
                  onClick={() => setShowForm(true)}
                  className="text-lg px-8"
                >
                  Start Creating
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
                
                <Button
                  size="lg"
                  variant="elegant"
                  className="text-lg px-8"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  No coding required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  AI-powered content
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Community included
                </div>
              </div>
            </div>
            
            <div className="relative animate-float">
              <div className="absolute -inset-4 bg-gradient-hero opacity-20 blur-xl rounded-full"></div>
              <img
                src={heroImage}
                alt="Freedomology Sprint Creation"
                className="relative rounded-2xl shadow-elegant w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to Create{' '}
              <span className="bg-gradient-secondary bg-clip-text text-transparent">
                Amazing Sprints
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From AI-powered content creation to automated delivery and community building, 
              we've got every aspect covered.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-primary/20 hover:shadow-card transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Create Sprints in Any{' '}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Category
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Whether you're an expert in health, wealth, relationships, or personal development, 
              our platform adapts to your unique expertise.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Card key={index} className="border-primary/20 hover:shadow-elegant transition-all duration-300 hover:scale-105 group">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    {category.icon}
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base">
                    {category.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Loved by{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Creators Worldwide
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of experts who have transformed their knowledge into powerful sprints
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-primary/20 hover:shadow-card transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold mb-6">
              Ready to Transform Lives?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join the movement of creators who are changing the world one sprint at a time. 
              Your expertise deserves to reach more people.
            </p>
            
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setShowForm(true)}
              className="text-lg px-12 py-6 text-primary hover:text-primary/90"
            >
              Create Your First Sprint
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                No technical skills needed
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Launch in minutes
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
