import React from 'react';
import { motion } from 'framer-motion';
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
      <div className="min-h-screen" style={{ background: '#242424' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
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
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SprintCreationForm />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#242424' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Badge 
                  className="border w-fit text-sm"
                  style={{ 
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #22DFDC',
                    color: '#22DFDC'
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Transform Lives Through Sprints
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-5xl lg:text-6xl font-bold leading-tight text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Create{' '}
                <span style={{ color: '#22DFDC' }}>
                  Powerful Sprints
                </span>
                {' '}That Change Lives
              </motion.h1>
              
              <motion.p 
                className="text-xl leading-relaxed"
                style={{ color: '#CFCFCF' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Join Freedomology and turn your expertise into transformational 21-40 day experiences. 
                Our AI-powered platform helps you create engaging, habit-forming sprints that deliver real results.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    onClick={() => setShowForm(true)}
                    className="text-lg px-8 text-white"
                    style={{ 
                      background: 'linear-gradient(135deg, #22DFDC, #22EDB6)',
                      border: 'none'
                    }}
                  >
                    Start Creating
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 text-cool-blue border-cool-blue hover:bg-cool-blue/10"
                    onClick={() => window.location.href = '/package-results'}
                  >
                    Test Publish Page
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 text-cool-text-secondary border-cool-text-secondary hover:bg-cool-text-secondary/10"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Watch Demo
                  </Button>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-6 text-sm"
                style={{ color: '#CFCFCF' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
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
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -10 }}
            >
              <div 
                className="absolute -inset-4 opacity-20 blur-xl rounded-full"
                style={{ background: 'linear-gradient(135deg, #22DFDC, #22EDB6)' }}
              ></div>
              <img
                src={heroImage}
                alt="Freedomology Sprint Creation"
                className="relative rounded-2xl w-full"
                style={{ boxShadow: '0 20px 40px -12px rgba(34, 223, 220, 0.15)' }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" style={{ background: '#1a1a1a' }}>
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              Everything You Need to Create{' '}
              <span style={{ color: '#22DFDC' }}>
                Amazing Sprints
              </span>
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#CFCFCF' }}>
              From AI-powered content creation to automated delivery and community building, 
              we've got every aspect covered.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -5,
                  boxShadow: '0 20px 40px -12px rgba(34, 223, 220, 0.15)'
                }}
              >
                <Card 
                  className="h-full"
                  style={{
                    background: '#2a2a2a',
                    border: '1px solid #22DFDC',
                    borderRadius: '16px'
                  }}
                >
                  <CardHeader>
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white mb-4"
                      style={{ background: 'linear-gradient(135deg, #22DFDC, #22EDB6)' }}
                    >
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base" style={{ color: '#CFCFCF' }}>
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20" style={{ background: '#242424' }}>
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              Create Sprints in Any{' '}
              <span style={{ color: '#22EDB6' }}>
                Category
              </span>
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#CFCFCF' }}>
              Whether you're an expert in health, wealth, relationships, or personal development, 
              our platform adapts to your unique expertise.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -5,
                  scale: 1.02
                }}
              >
                <Card 
                  className="h-full text-center group"
                  style={{
                    background: '#2a2a2a',
                    border: '1px solid #22DFDC',
                    borderRadius: '16px'
                  }}
                >
                  <CardHeader>
                    <motion.div 
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4`}
                      style={{ background: 'linear-gradient(135deg, #22DFDC, #22EDB6)' }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {category.icon}
                    </motion.div>
                    <CardTitle className="text-xl text-white">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-base" style={{ color: '#CFCFCF' }}>
                      {category.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20" style={{ background: '#1a1a1a' }}>
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              Loved by{' '}
              <span style={{ color: '#22DFDC' }}>
                Creators Worldwide
              </span>
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#CFCFCF' }}>
              Join thousands of experts who have transformed their knowledge into powerful sprints
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Card 
                  className="h-full"
                  style={{
                    background: '#2a2a2a',
                    border: '1px solid #22DFDC',
                    borderRadius: '16px'
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#22EDB6' }} />
                      ))}
                    </div>
                    <CardDescription className="text-base italic" style={{ color: '#CFCFCF' }}>
                      "{testimonial.content}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm" style={{ color: '#CFCFCF' }}>{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-20 text-white"
        style={{ background: 'linear-gradient(135deg, #22DFDC, #22EDB6)' }}
      >
        <div className="container mx-auto px-4 text-center">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold mb-6">
              Ready to Transform Lives?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join the movement of creators who are changing the world one sprint at a time. 
              Your expertise deserves to reach more people.
            </p>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                onClick={() => setShowForm(true)}
                className="text-lg px-12 py-6"
                style={{
                  background: '#242424',
                  color: '#22DFDC',
                  border: 'none'
                }}
              >
                Create Your First Sprint
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
            
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
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
