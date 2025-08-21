// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from './context/AuthContext';
import { auth } from '../lib/firebase/client';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import Logo from '@rootComponents/Logo';
import SpiralMark from '@rootComponents/SpiralMark';
import OldRoadmapsModal from './components/OldRoadmapsModal';
import OldLearnPagesModal from './learn/OldLearnPagesModal';
import D3ModelMapModal from './components/ModelSelectionMap';
import { BACKEND_URL } from '../config/config';
import { RoadmapData, RoadmapItem, api } from '../lib/api';
import { useAIState } from '@/store/aiState';
import { 
  BookOpen, 
  Brain, 
  Target, 
  Clock, 
  Calendar,
  ChevronDown, 
  Sparkles, 
  Play, 
  History,
  User,
  LogOut,
  Menu,
  X,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  Globe,
  Users,
  TrendingUp,
  Sun,
  Moon
} from 'lucide-react';
import ProfileDropdown from '../components/ProfileDropdown';

const MenttorLabsMainPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState({
    subject: '',
    goal: '',
    time_value: 1, // Changed from timeToLearn
    time_unit: 'days', // Default to days as per backend
    model: '', // Will be set by useEffect
  });
  const { isGenerating, startGeneration, endGeneration } = useAIState();
  const [roadmapHtml, setRoadmapHtml] = useState<React.ReactNode | null>(null); // Changed type
  const [selectedModelName, setSelectedModelName] = useState<string>('Loading models...');
  const [showModelModal, setShowModelModal] = useState(false);
  const [showOldRoadmaps, setShowOldRoadmaps] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showOldLearnPages, setShowOldLearnPages] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  // Define GenerateRoadmapRequest interface here or import if already defined
  interface GenerateRoadmapRequest {
    subject: string;
    goal: string;
    time_value: number;
    time_unit: string;
    model: string;
  }
  
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Intelligent Learning",
      description: "Smart technology creates personalized roadmaps tailored to your learning style and goals."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Goal-Oriented",
      description: "Set specific objectives and get structured paths to achieve them efficiently."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Flexible Timeline",
      description: "Learn at your own pace with customizable schedules that fit your lifestyle."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Progress Tracking",
      description: "Monitor your advancement with detailed analytics and milestone achievements."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Developer",
      content: "Menttor helped me transition from marketing to coding in just 3 months!",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Data Scientist",
      content: "The personalized roadmaps are incredibly detailed and practical.",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "UX Designer",
      content: "Perfect for structured learning. I finally mastered machine learning!",
      rating: 5
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Set default model to Vertex AI
  useEffect(() => {
    const fetchAndSetDefaultModel = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/models/`);
        if (response.ok) {
          const models = await response.json();
          console.log('Fetched models:', models.length);
          
          // Find the first Vertex AI model as default
          const vertexAIModel = models.find(model => 
            model.id && model.id.startsWith('vertexai:')
          );
          
          if (vertexAIModel) {
            console.log('Selected Vertex AI model:', vertexAIModel.name);
            setFormData(prev => ({ ...prev, model: vertexAIModel.id }));
            setSelectedModelName(vertexAIModel.name);
          } else {
            // Fallback to first available model if no Vertex AI model found
            const firstModel = models[0];
            if (firstModel) {
              console.log('No Vertex AI model found, using first available:', firstModel.name);
              setFormData(prev => ({ ...prev, model: firstModel.id }));
              setSelectedModelName(firstModel.name);
            } else {
              // Final fallback if no models at all
              console.warn('No models available, using hardcoded Vertex AI model');
              setFormData(prev => ({ ...prev, model: 'vertexai:gemini-1.5-flash-001' }));
              setSelectedModelName('Google Gemini (gemini-1.5-flash-001)');
            }
          }
        } else {
          throw new Error(`Failed to fetch models: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        // Set a hardcoded Vertex AI model as final fallback
        console.log('Using fallback Vertex AI model');
        setFormData(prev => ({ ...prev, model: 'vertexai:gemini-1.5-flash-001' }));
        setSelectedModelName('Google Gemini (gemini-1.5-flash-001)');
      }
    };

    // Only fetch if no model is currently set
    if (!formData.model) {
      fetchAndSetDefaultModel();
    }
  }, [formData.model]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'time_value' ? parseInt(value) : value,
    }));
  };

  const generateRoadmapMutation = useMutation<RoadmapData, Error, GenerateRoadmapRequest>({
    mutationFn: async (requestData) => {
      const response = await api.post('/roadmaps/generate', requestData);
      return response.data;
    },
    onSuccess: (data) => {
      displayRoadmap(data.roadmap_plan);
      sessionStorage.setItem('currentRoadmap', JSON.stringify(data)); // Store full roadmap data
      endGeneration(); // End generation on success
      if (!loading && !user) {
        setRoadmapHtml(prevHtml => (
          <>
            {prevHtml}
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
                <p className="font-semibold">Your roadmap has been generated!</p>
                <p>To save your progress and access it later, please <Link href="/auth/signin" className="underline">Login</Link> or <Link href="/auth/register" className="underline">Register</Link>.</p>
            </div>
          </>
        ));
      }
    },
    onError: (error) => {
      setRoadmapHtml(<p className="text-red-500">Error: {error.message}</p>);
      endGeneration(); // End generation on error
    },
  });

  const generateRoadmap = async () => {
    if (!formData.subject || !formData.goal || !formData.time_value) {
      alert('Please fill in all fields');
      return;
    }

    startGeneration(formData.model); // Start generation with the selected model
    setRoadmapHtml(null); // Clear previous roadmap
    generateRoadmapMutation.mutate({
      subject: formData.subject,
      goal: formData.goal,
      time_value: formData.time_value,
      time_unit: formData.time_unit,
      model: formData.model,
    });
  };

  const displayRoadmap = (roadmapPlan: RoadmapItem[]) => {
    if (!roadmapPlan || roadmapPlan.length === 0) {
      setRoadmapHtml(<p>No roadmap generated.</p>);
      return;
    }

    const roadmapContent = (
      <>
        <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Your Learning Roadmap: {formData.subject}</h3>
        <div className="space-y-6">
          {roadmapPlan.map((item, index) => (
            <div key={index} className="module bg-gradient-to-r from-white to-blue-50 dark:from-gray-700 dark:to-blue-900/20 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                  {index + 1}
                </div>
                <h4 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">{item.title}</h4>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3 mb-4">
                <p className="text-indigo-700 dark:text-indigo-300 font-medium">📅 Timeline: {item.timeline}</p>
              </div>
              <div className="space-y-4">
                {item.topics.map((topic, topicIdx) => (
                  <div key={topicIdx} className="bg-white dark:bg-gray-600 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-500">
                    <h5 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                      <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                        {topicIdx + 1}
                      </span>
                      {topic.title}
                    </h5>
                    <div className="grid gap-2">
                      {topic.subtopics.map((subTopic, subTopicIdx) => (
                        <div key={subTopicIdx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mr-3"></div>
                            <span className="text-gray-700 dark:text-gray-200 font-medium">{subTopic.title}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {subTopic.has_learn && (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full font-medium">📚 Learn</span>
                            )}
                            {subTopic.has_quiz && (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full font-medium">🧠 Quiz</span>
                            )}
                            {subTopic.has_code_challenge && (
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full font-medium">💻 Code</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
    setRoadmapHtml(roadmapContent);
  };

  const handleLoadOldRoadmap = (roadmap: RoadmapData) => {
    sessionStorage.setItem('currentRoadmap', JSON.stringify(roadmap));
    router.push('/journey');
  };

  const handleSelectModel = (modelId: string, modelName: string) => {
    setFormData(prev => ({ ...prev, model: modelId }));
    setSelectedModelName(modelName); // This will be updated by the useEffect
  };

  const handleLoadOldLearningContent = (content: any) => {
    // Navigate to learn page with the content
    router.push('/learn');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 transition-colors duration-300">

      {/* Navigation */}
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <Logo />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200">Home</Link>
              <a href="#generate" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200">Generate</a>
              <button 
                onClick={() => setShowOldRoadmaps(true)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Roadmaps
              </button>
              <div className="ml-6 pl-6 border-l border-gray-200 dark:border-gray-700 flex items-center space-x-3">
                {/* Theme Toggle */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>
                
                {!loading && user ? (
                  <ProfileDropdown />
                ) : (
                  <button
                    onClick={() => router.push('/auth/signin')}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
            {showMobileMenu && (
              <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 transition-all duration-300">
                <div className="px-4 py-3 space-y-1">
                  <Link href="/" className="block py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium">Home</Link>
                  <a href="#generate" className="block py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium">Generate</a>
                  <button 
                    onClick={() => setShowOldRoadmaps(true)}
                    className="block py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-left font-medium w-full"
                  >
                    Roadmaps
                  </button>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium w-full"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="w-4 h-4 mr-2" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 mr-2" />
                        Dark Mode
                      </>
                    )}
                  </button>
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-3">
                    {!loading && user ? (
                      <ProfileDropdown className="w-full" />
                    ) : (
                      <button
                        onClick={() => router.push('/auth/signin')}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 rounded-full font-medium transition-all duration-200"
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-800"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400/10 rounded-full filter blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Smart Learning Platform
              </div>
            </div>
            
            <h1 className="heading-primary mb-8">
              Master Any Skill with{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Expertly Crafted
              </span>{' '}
              Learning Paths
            </h1>
            
            <p className="text-xl md:text-2xl text-body max-w-4xl mx-auto mb-10 leading-relaxed">
              Transform your ambitions into achievements with personalized roadmaps that adapt to your pace, 
              style, and goals. Experience the future of education.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <button 
                onClick={() => document.getElementById('generate').scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary text-lg px-10 py-4 group"
              >
                <span>Start Your Journey</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="btn-ghost text-lg px-8 py-4 group">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                <span>Watch Demo</span>
              </button>
            </div>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            <div className="glass-card rounded-2xl p-6 text-center group smooth-hover">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">50K+</div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active Learners</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center group smooth-hover">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">1M+</div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Learning Paths</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center group smooth-hover">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">95%</div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Success Rate</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center group smooth-hover">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">500+</div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Skills Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50/80 dark:bg-indigo-900/30 border border-indigo-200/50 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Powerful Features
            </div>
            <h2 className="heading-secondary mb-6">Why Choose Menttor?</h2>
            <p className="text-xl text-body max-w-3xl mx-auto">
              Experience the future of personalized learning with our intelligent technology 
              and cutting-edge educational methodologies
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={`group cursor-pointer transition-all duration-500 ${ 
                    activeFeature === index 
                      ? 'scale-105' 
                      : 'hover:scale-102'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className={`card-elevated p-8 ${ 
                    activeFeature === index 
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-600' 
                      : 'hover:border-gray-300 dark:hover:border-gray-600'
                  }`}>
                    <div className="flex items-start space-x-6">
                      <div className={`p-4 rounded-2xl transition-all duration-300 ${ 
                        activeFeature === index 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                          : 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'
                      }`}>
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="heading-tertiary mb-3">{feature.title}</h3>
                        <p className="text-body">{feature.description}</p>
                        {activeFeature === index && (
                          <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-medium">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span>Active Feature</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="relative lg:sticky lg:top-8">
              <div className="relative">
                {/* Background decoration */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl"></div>
                
                {/* Main feature showcase */}
                <div className="relative card-elevated p-8 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-900 dark:to-blue-900/10 border-0">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                      {features[activeFeature].icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      {features[activeFeature].title}
                    </h3>
                    <p className="text-body text-lg mb-6">
                      {features[activeFeature].description}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">Enterprise Ready</span>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">24/7 Support</span>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">Proven Results</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Generation Form */}
      <section id="generate" className="py-32 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 transition-colors duration-300 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/5 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/5 rounded-full filter blur-3xl"></div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <Target className="w-4 h-4 mr-2" />
              Roadmap Generator
            </div>
            <h2 className="heading-secondary mb-6">Create Your Learning Journey</h2>
            <p className="text-xl text-body max-w-3xl mx-auto">
              Share your goals and let our intelligent system craft a personalized roadmap 
              that transforms your ambitions into achievable milestones
            </p>
          </div>

          <div className="card-elevated p-10 md:p-12 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    What do you want to learn?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="e.g., Python Programming, Digital Marketing, Data Science"
                      className="input-field pr-12"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    <Target className="w-4 h-4 inline mr-2" />
                    Describe your specific goal
                  </label>
                  <textarea
                    name="goal"
                    value={formData.goal}
                    onChange={handleInputChange}
                    placeholder="Be specific about what you want to achieve, your current level, and preferred learning style..."
                    rows={4}
                    className="input-field resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Timeline Duration
                    </label>
                    <input
                      type="number"
                      name="time_value"
                      value={formData.time_value}
                      onChange={handleInputChange}
                      placeholder="12"
                      min="1"
                      max="365"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Time Unit
                    </label>
                    <div className="relative">
                      <select
                        name="time_unit"
                        value={formData.time_unit}
                        onChange={handleInputChange}
                        className="input-field appearance-none pr-12"
                      >
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    <Brain className="w-4 h-4 inline mr-2" />
                    Learning Engine Selection
                  </label>
                  <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{selectedModelName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Advanced learning engine for personalized education</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowModelModal(true)}
                      className="btn-secondary py-2 px-4 text-sm"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center space-y-8">
                <div className="relative">
                  {/* Background decoration */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
                  
                  {/* Main panel */}
                  <div className="relative card-elevated p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0">
                    <div className="text-center">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                          <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Zap className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <h3 className="heading-tertiary mb-4">Intelligent Generation</h3>
                      <p className="text-body mb-6">
                        Our smart system analyzes your goals and creates a structured, personalized learning path optimized for your success.
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-center space-x-2 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span>Personalized Content</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span>Adaptive Learning Path</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span>Progress Tracking</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  onClick={generateRoadmap}
                  disabled={isGenerating}
                  className={`w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 transform flex items-center justify-center space-x-3 ${
                    isGenerating
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'btn-primary hover:scale-105 shadow-2xl'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="loading-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                      <span>Generating Your Path...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate My Roadmap</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {roadmapHtml && (
            <div className="mt-12 p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              {roadmapHtml}
              <div className="text-center mt-8">
                <button 
                  onClick={() => router.push('/journey')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto"
                >
                  <Play className="w-6 h-6" />
                  <span>Start Your Journey</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Hear from learners who transformed their journey with MenttorLabs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-600 transition-colors duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-200 text-lg mb-6 italic">"{testimonial.content}"</p>
                <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                <div className="text-gray-500 text-sm">{testimonial.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Learning Journey?</h2>
          <p className="text-xl opacity-90 mb-10">
            Join thousands of learners who are achieving their goals with personalized learning roadmaps.
          </p>
          <button 
            onClick={() => document.getElementById('generate').scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-blue-700 px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto"
          >
            <span>Generate Your First Roadmap</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <Logo />
              <p className="text-gray-300 mt-4 leading-relaxed">
                Transforming education through intelligent, personalized learning experiences that adapt to every learner's unique journey.
              </p>
              <div className="flex space-x-4 mt-8">
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  <Users className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Product</h4>
              <ul className="space-y-3">
                <li><Link href="/" className="text-gray-300 hover:text-white transition-colors duration-200">Home</Link></li>
                <li><a href="#generate" className="text-gray-300 hover:text-white transition-colors duration-200">Create Roadmap</a></li>
                <li><button onClick={() => setShowOldRoadmaps(true)} className="text-gray-300 hover:text-white transition-colors duration-200">My Roadmaps</button></li>
                <li><Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors duration-200">Dashboard</Link></li>
                <li><Link href="/performance-analysis" className="text-gray-300 hover:text-white transition-colors duration-200">Analytics</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Company</h4>
              <ul className="space-y-3">
                <li><a href="/about" className="text-gray-300 hover:text-white transition-colors duration-200">About Us</a></li>
                <li><a href="/careers" className="text-gray-300 hover:text-white transition-colors duration-200">Careers</a></li>
                <li><a href="/blog" className="text-gray-300 hover:text-white transition-colors duration-200">Blog</a></li>
                <li><a href="/press" className="text-gray-300 hover:text-white transition-colors duration-200">Press</a></li>
                <li><a href="/partnerships" className="text-gray-300 hover:text-white transition-colors duration-200">Partners</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Support</h4>
              <ul className="space-y-3">
                <li><Link href="/help" className="text-gray-300 hover:text-white transition-colors duration-200">Help Center</Link></li>
                <li><a href="/contact" className="text-gray-300 hover:text-white transition-colors duration-200">Contact Support</a></li>
                <li><a href="/privacy" className="text-gray-300 hover:text-white transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="/terms" className="text-gray-300 hover:text-white transition-colors duration-200">Terms of Service</a></li>
                <li><a href="/security" className="text-gray-300 hover:text-white transition-colors duration-200">Security</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} MenttorLabs. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="/sitemap" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Sitemap</a>
              <span className="text-gray-600">|</span>
              <a href="/status" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Status</a>
              <span className="text-gray-600">|</span>
              <div className="text-gray-400 text-sm">
                Built by <a href="mailto:csankalp21@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors duration-200">Sankalp Chudmunge</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      

      {/* Model Selection Modal */}
      {showModelModal && (
        <D3ModelMapModal
          isOpen={showModelModal}
          onClose={() => setShowModelModal(false)}
          onSelectModel={handleSelectModel}
          currentModelId={formData.model}
        />
      )}

      {/* Old Roadmaps Modal */}
      {showOldRoadmaps && (
        <OldRoadmapsModal
          isOpen={showOldRoadmaps}
          onClose={() => setShowOldRoadmaps(false)}
          onLoadRoadmap={handleLoadOldRoadmap}
        />
      )}

      {/* Old Learn Pages Modal */}
      {showOldLearnPages && (
        <OldLearnPagesModal
          isOpen={showOldLearnPages}
          onClose={() => setShowOldLearnPages(false)}
          onLoadLearningContent={handleLoadOldLearningContent}
        />
      )}

      
    </div>
  );
};

export default MenttorLabsMainPage;
