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
import { analytics } from '../lib/analytics';
import SpiralMark from '@rootComponents/SpiralMark';
import OldRoadmapsModal from './components/OldRoadmapsModal';
import OldLearnPagesModal from './learn/OldLearnPagesModal';
import D3ModelMapModal from './components/ModelSelectionMap';
import OnboardingWrapper from '../components/OnboardingWrapper';
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
  Moon,
  BarChart3,
  Award,
  Box,
  Github,
  Twitter,
  Instagram
} from 'lucide-react';
import ProfileDropdown from '../components/ProfileDropdown';
import { ThreeDGeneratorCard, ThreeDGeneratorModal } from '../../components/ThreeDGenerator';
import { LearnAboutSomethingCard, LearnAboutSomethingModal } from '../../components/LearnAboutSomething';
import PromotionalBackground from '../components/PromotionalBackground';
import SimpleLearningAnimation from '../components/SimpleLearningAnimation';
import MainPageSidePanel from './components/MainPageSidePanel';
import LearnBar from './components/LearnBar';

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
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [showOldLearnPages, setShowOldLearnPages] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [show3DGenerator, setShow3DGenerator] = useState(false);
  const [threeDModel, setThreeDModel] = useState('vertexai:gemini-2.5-flash');
  const [threeDModelName, setThreeDModelName] = useState('Loading models...');
  const [show3DModelModal, setShow3DModelModal] = useState(false);
  const [showLearnAboutSomething, setShowLearnAboutSomething] = useState(false);
  const [learnModel, setLearnModel] = useState('vertexai:gemini-2.5-flash-lite');
  const [learnModelName, setLearnModelName] = useState('Loading models...');
  const [showLearnModelModal, setShowLearnModelModal] = useState(false);

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
              setFormData(prev => ({ ...prev, model: 'vertexai:gemini-2.5-flash-lite' }));
              setSelectedModelName('Google Gemini (gemini-2.5-flash-lite)');
            }
          }
        } else {
          throw new Error(`Failed to fetch models: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        // Set a hardcoded Vertex AI model as final fallback
        console.log('Using fallback Vertex AI model');
        setFormData(prev => ({ ...prev, model: 'vertexai:gemini-2.5-flash-lite' }));
        setSelectedModelName('Google Gemini (gemini-2.5-flash-lite)');
      }
    };

    // Only fetch if no model is currently set
    if (!formData.model) {
      fetchAndSetDefaultModel();
    }
  }, [formData.model]);

  // Set default model for 3D generator
  useEffect(() => {
    const fetchAndSet3DModel = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/models/`);
        if (response.ok) {
          const models = await response.json();
          
          // Find the first Vertex AI model as default for 3D generator
          const vertexAIModel = models.find(model => 
            model.id && model.id.startsWith('vertexai:')
          );
          
          if (vertexAIModel) {
            setThreeDModel(vertexAIModel.id.replace('vertexai:', ''));
            setThreeDModelName(vertexAIModel.name);
          } else {
            // Fallback to first available model
            const firstModel = models[0];
            if (firstModel) {
              setThreeDModel(firstModel.id.replace('vertexai:', ''));
              setThreeDModelName(firstModel.name);
            } else {
              // Final fallback
              setThreeDModel('gemini-2.5-flash');
              setThreeDModelName('Google Gemini (gemini-2.5-flash)');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching 3D models:', error);
        setThreeDModel('gemini-2.5-flash');
        setThreeDModelName('Google Gemini (gemini-2.5-flash)');
      }
    };

    // Only fetch if no 3D model is currently set
    if (threeDModelName === 'Loading models...') {
      fetchAndSet3DModel();
    }
  }, [threeDModelName]);


  // Initialize learn model name  
  useEffect(() => {
    if (learnModelName === 'Loading models...') {
      setLearnModelName('Gemini 2.5 Flash Lite (Fast Learning)');
    }
  }, [learnModelName]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'time_value' ? parseInt(value) : value,
    }));
  };

  // Smart auto-fill functionality
  const handleSmartFill = (e: React.FocusEvent<HTMLInputElement>) => {
    const subject = e.target.value.trim().toLowerCase();
    if (!subject || formData.goal) return; // Don't auto-fill if goal is already set

    // Common subject-to-goal mappings
    const smartSuggestions: Record<string, { goal: string; timeValue: number; timeUnit: string }> = {
      'python': { goal: 'Master Python programming for data analysis and web development', timeValue: 8, timeUnit: 'weeks' },
      'javascript': { goal: 'Build modern web applications with JavaScript and React', timeValue: 10, timeUnit: 'weeks' },
      'react': { goal: 'Create interactive user interfaces with React framework', timeValue: 6, timeUnit: 'weeks' },
      'node.js': { goal: 'Develop backend APIs and server-side applications', timeValue: 7, timeUnit: 'weeks' },
      'machine learning': { goal: 'Understand ML algorithms and build predictive models', timeValue: 12, timeUnit: 'weeks' },
      'data science': { goal: 'Analyze data and extract insights using Python and SQL', timeValue: 14, timeUnit: 'weeks' },
      'web development': { goal: 'Build full-stack web applications from scratch', timeValue: 16, timeUnit: 'weeks' },
      'mobile development': { goal: 'Create native mobile apps for iOS and Android', timeValue: 12, timeUnit: 'weeks' },
      'devops': { goal: 'Automate deployment and manage cloud infrastructure', timeValue: 10, timeUnit: 'weeks' },
      'cybersecurity': { goal: 'Secure systems and understand ethical hacking principles', timeValue: 14, timeUnit: 'weeks' },
      'blockchain': { goal: 'Understand cryptocurrency and build decentralized applications', timeValue: 10, timeUnit: 'weeks' },
      'ai': { goal: 'Build intelligent systems using artificial intelligence', timeValue: 16, timeUnit: 'weeks' },
      'cloud computing': { goal: 'Deploy and manage applications in the cloud', timeValue: 8, timeUnit: 'weeks' },
      'database': { goal: 'Design and optimize database systems for applications', timeValue: 6, timeUnit: 'weeks' },
      'ui/ux': { goal: 'Design user-friendly interfaces and improve user experience', timeValue: 8, timeUnit: 'weeks' }
    };

    // Find matching suggestion
    const matchedKey = Object.keys(smartSuggestions).find(key => 
      subject.includes(key) || key.includes(subject)
    );

    if (matchedKey) {
      const suggestion = smartSuggestions[matchedKey];
      setFormData(prev => ({
        ...prev,
        goal: suggestion.goal,
        time_value: suggestion.timeValue,
        time_unit: suggestion.timeUnit
      }));
    }
  };

  const generateRoadmapMutation = useMutation<RoadmapData, Error, GenerateRoadmapRequest>({
    mutationFn: async (requestData) => {
      const response = await api.post('/roadmaps/generate', requestData);
      return response.data;
    },
    onSuccess: (data) => {
      // Track roadmap generation
      analytics.roadmapGenerated({
        subject: formData.subject,
        timeValue: formData.time_value,
        timeUnit: formData.time_unit,
        model: formData.model,
      });
      
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
            <div key={index} className="module bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                  {index + 1}
                </div>
                <h4 className="text-xl font-semibold text-green-600 dark:text-green-400">{item.title}</h4>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 mb-4">
                <p className="text-green-700 dark:text-green-300 font-medium">📅 Timeline: {item.timeline}</p>
              </div>
              <div className="space-y-4">
                {item.topics.map((topic, topicIdx) => (
                  <div key={topicIdx} className="bg-white dark:bg-gray-600 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-500">
                    <h5 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                      <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                        {topicIdx + 1}
                      </span>
                      {topic.title}
                    </h5>
                    <div className="grid gap-2">
                      {topic.subtopics.map((subTopic, subTopicIdx) => (
                        <div key={subTopicIdx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
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
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full font-medium">💻 Code</span>
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

  const handleSelect3DModel = (modelId: string, modelName: string) => {
    // Keep the full model ID for 3D generation to support all providers
    // (vertexai:, openrouter:, huggingface:, etc.)
    setThreeDModel(modelId);
    setThreeDModelName(modelName);
    setShow3DModelModal(false);
  };

  const handleSelectLearnModel = (modelId: string, modelName: string) => {
    // Keep the full model ID for learning content generation to support all providers
    // (vertexai:, openrouter:, huggingface:, etc.)
    setLearnModel(modelId);
    setLearnModelName(modelName);
    setShowLearnModelModal(false);
  };

  const handleLoadOldLearningContent = (content: any) => {
    // Navigate to learn page with the content
    router.push('/learn');
  };

  return (
    <OnboardingWrapper>
      <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">

      {/* Navigation */}
      <nav className="bg-white/95 dark:bg-black backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo and Dashboard Link */}
            <div className="flex items-center space-x-6">
              <Logo />
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              <Link 
                href="/" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all duration-200 bg-green-700 text-white"
              >
                <span className="text-sm">Home</span>
              </Link>
              <Link 
                href="/explore" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">Explore</span>
              </Link>
              <Link 
                href="/library" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">Library</span>
              </Link>
              <Link 
                href="/journey" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Target className="w-4 h-4" />
                <span className="text-sm">Journey</span>
              </Link>
              <button 
                onClick={() => setShowOldRoadmaps(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <History className="w-4 h-4" />
                <span className="text-sm">Roadmaps</span>
              </button>
            </nav>

            {/* Profile */}
            <div className="flex items-center space-x-3">
              {!loading && user ? (
                <ProfileDropdown />
              ) : (
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                >
                  Sign In
                </button>
              )}
              
              {/* Mobile Side Panel Toggle */}
              <button
                onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <BookOpen className="w-5 h-5" />
              </button>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden ml-2 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
            {showMobileMenu && (
              <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 transition-all duration-300">
                <div className="px-4 py-3 space-y-1">
                  <Link href="/" className="block py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium">Home</Link>
                  <Link href="/explore" className="block py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium">Explore</Link>
                  <Link href="/library" className="block py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium">Library</Link>
                  <a href="#generate" className="block py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium">Generate</a>
                  <button 
                    onClick={() => setShowOldRoadmaps(true)}
                    className="block py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-left font-medium w-full"
                  >
                    Roadmaps
                  </button>
                  <button
                    onClick={() => {
                      const newTheme = theme === 'dark' ? 'light' : 'dark';
                      analytics.themeChanged(theme || 'system', newTheme);
                      setTheme(newTheme);
                    }}
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
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-full font-medium transition-all duration-200"
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
      </nav>

      {/* Main Content Area */}
      <div className="lg:ml-80">
        {/* Roadmap Generation Form - Connected Flow Design */}
        <section id="generate" className="py-12 bg-white dark:bg-black transition-colors duration-300">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Create Your Learning Roadmap</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Follow the connected flow to build your personalized learning journey
            </p>
          </div>

          {/* Connected Form Flow */}
          <div className="relative">
            {/* Flow Container */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 items-start">
              
              {/* Step 1: Subject */}
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">1</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Subject</h3>
                </div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  What to learn?
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  onBlur={handleSmartFill}
                  placeholder="e.g., Python Programming"
                  className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                />
                {formData.subject && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Subject selected
                  </div>
                )}
                
                {/* Simple dashed connecting line - Desktop */}
                <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0 border-t-2 border-dashed border-gray-300 dark:border-gray-600 transform -translate-y-1/2"></div>
                
                {/* Simple dashed connecting line - Mobile */}
                <div className="md:hidden absolute -bottom-4 left-1/2 w-0 h-8 border-l-2 border-dashed border-gray-300 dark:border-gray-600 transform -translate-x-1/2"></div>
              </div>

              {/* Step 2: Goal */}
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">2</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Goal</h3>
                </div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Target className="w-4 h-4 inline mr-2" />
                  Your objective?
                </label>
                <textarea
                  name="goal"
                  value={formData.goal}
                  onChange={handleInputChange}
                  placeholder="e.g., Build web applications"
                  rows={3}
                  className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none"
                />
                {formData.goal && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Goal defined
                  </div>
                )}
                
                {/* Simple dashed connecting line - Desktop */}
                <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0 border-t-2 border-dashed border-gray-300 dark:border-gray-600 transform -translate-y-1/2"></div>
                
                {/* Simple dashed connecting line - Mobile */}
                <div className="md:hidden absolute -bottom-4 left-1/2 w-0 h-8 border-l-2 border-dashed border-gray-300 dark:border-gray-600 transform -translate-x-1/2"></div>
              </div>

              {/* Step 3: Timeline */}
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">3</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Timeline</h3>
                </div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Time frame?
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    name="time_value"
                    value={formData.time_value}
                    onChange={handleInputChange}
                    placeholder="12"
                    min="1"
                    max="365"
                    className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  />
                  <select
                    name="time_unit"
                    value={formData.time_unit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
                {formData.time_value && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Timeline set
                  </div>
                )}
                
                {/* Simple dashed connecting line - Desktop */}
                <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0 border-t-2 border-dashed border-gray-300 dark:border-gray-600 transform -translate-y-1/2"></div>
                
                {/* Simple dashed connecting line - Mobile */}
                <div className="md:hidden absolute -bottom-4 left-1/2 w-0 h-8 border-l-2 border-dashed border-gray-300 dark:border-gray-600 transform -translate-x-1/2"></div>
              </div>

              {/* Step 4: AI Model */}
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">4</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI Engine</h3>
                </div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Brain className="w-4 h-4 inline mr-2" />
                  Learning model?
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                  <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">{selectedModelName}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Advanced AI</div>
                  <button
                    type="button"
                    onClick={() => setShowModelModal(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Change Model
                  </button>
                </div>
                {formData.model && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Model selected
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button - Centered below flow */}
            <div className="text-center mt-12">
              <button
                type="submit"
                onClick={generateRoadmap}
                disabled={isGenerating || !formData.subject || !formData.goal}
                className={`px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 mx-auto ${
                  isGenerating || !formData.subject || !formData.goal
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="loading-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                    <span>Generating Roadmap...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Your Roadmap</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              {(!formData.subject || !formData.goal) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Complete the subject and goal fields to generate your roadmap
                </p>
              )}
            </div>
          </div>

          {roadmapHtml && (
            <div className="mt-16 p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              {roadmapHtml}
              <div className="text-center mt-8">
                <button 
                  onClick={() => router.push('/journey')}
                  className="bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto"
                >
                  <Play className="w-6 h-6" />
                  <span>Start Your Journey</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>


        {/* How It Works - Interactive Flow */}
        <section className="py-12 bg-white dark:bg-black transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <Target className="w-4 h-4 mr-2" />
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Your Learning Journey Visualized
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              See how Menttor transforms your learning goals into structured, achievable pathways
            </p>
          </div>
          
          {/* Animation Component */}
          <div className="flex justify-center">
            <SimpleLearningAnimation />
          </div>
        </div>
      </section>

        {/* Stats Section */}
        <section className="py-12 bg-white dark:bg-black transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-black rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">50K+</div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Active Learners</div>
            </div>
            <div className="bg-white dark:bg-black rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">1M+</div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Learning Paths</div>
            </div>
            <div className="bg-white dark:bg-black rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">95%</div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
            <div className="bg-white dark:bg-black rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">500+</div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Topics Available</div>
            </div>
          </div>
        </div>
      </section>

        {/* Quick Tools Section */}
        <section className="py-8 bg-white dark:bg-black transition-colors duration-300">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">More Tools</h2>
            </div>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShow3DGenerator(true)}
                className="flex items-center px-4 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Box className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">3D Visualization</span>
              </button>
              
              <button
                onClick={() => setShowLearnAboutSomething(true)}
                className="flex items-center px-4 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Learn About Something</span>
              </button>
            </div>
          </div>
        </section>

        {/* Why Choose Menttor Section */}
        <section className="py-8 bg-white dark:bg-black transition-colors duration-300">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Menttor?</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Brain className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">AI-Powered Learning</h3>
                    <p className="text-gray-600 dark:text-gray-400">Personalized content adapted to your learning style</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Target className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Smart Roadmaps</h3>
                    <p className="text-gray-600 dark:text-gray-400">Structured learning paths with clear milestones</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Zap className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Instant Access</h3>
                    <p className="text-gray-600 dark:text-gray-400">Start learning immediately with no setup required</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <BarChart3 className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Progress Tracking</h3>
                    <p className="text-gray-600 dark:text-gray-400">Monitor your learning journey with detailed analytics</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Community Driven</h3>
                    <p className="text-gray-600 dark:text-gray-400">Learn with thousands of active learners</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Award className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Expert Verified</h3>
                    <p className="text-gray-600 dark:text-gray-400">Content reviewed by industry professionals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <Logo />
              <p className="text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
                Transforming education through intelligent, personalized learning experiences that adapt to every learner's unique journey.
              </p>
              <div className="flex space-x-4 mt-8">
                <a href="https://x.com/menttorlive" target="_blank" rel="noopener noreferrer">
                  <img src="/x-social-media-logo-icon.svg" alt="Twitter/X" className="w-6 h-6" />
                </a>
                <a href="https://www.instagram.com/menttorlive/" target="_blank" rel="noopener noreferrer">
                  <img src="/ig-instagram-icon.svg" alt="Instagram" className="w-6 h-6" />
                </a>
                <a href="https://github.com/mountain-snatcher" target="_blank" rel="noopener noreferrer">
                  <img src="/github.svg" alt="GitHub" className="w-6 h-6" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Product</h4>
              <ul className="space-y-3">
                <li><Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Home</Link></li>
                <li><a href="#generate" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Create Roadmap</a></li>
                <li><Link href="/library" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Library</Link></li>
                <li><button onClick={() => setShowOldRoadmaps(true)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">My Roadmaps</button></li>
                <li><Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Dashboard</Link></li>
                <li><Link href="/performance-analysis" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Analytics</Link></li>
              </ul>
            </div>


            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Support</h4>
              <ul className="space-y-3">
                <li><Link href="/help" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Help Center</Link></li>
                <li><a href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Contact Support</a></li>
                <li><a href="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="/terms" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Terms of Service</a></li>
                <li><a href="/security" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Security</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} MenttorLabs. All rights reserved.
              <br />Built with ❤️ for learners
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="/sitemap" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors duration-200">Sitemap</a>
              <span className="text-gray-400 dark:text-gray-600">|</span>
              <a href="/status" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors duration-200">Status</a>
              <span className="text-gray-400 dark:text-gray-600">|</span>
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                <a href="https://github.com/mountain-snatcher" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200">GitHub</a>
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

      {/* 3D Generator Modal */}
      <ThreeDGeneratorModal
        isOpen={show3DGenerator}
        onClose={() => setShow3DGenerator(false)}
        selectedModel={threeDModel}
        selectedModelName={threeDModelName}
        onModelSelect={() => setShow3DModelModal(true)}
      />

      {/* Learn About Something Modal */}
      <LearnAboutSomethingModal
        isOpen={showLearnAboutSomething}
        onClose={() => setShowLearnAboutSomething(false)}
        selectedModel={learnModel}
        selectedModelName={learnModelName}
        onModelSelect={() => setShowLearnModelModal(true)}
      />
      

      {/* 3D Model Selection Modal */}
      {show3DModelModal && (
        <D3ModelMapModal
          isOpen={show3DModelModal}
          onClose={() => setShow3DModelModal(false)}
          onSelectModel={handleSelect3DModel}
          currentModelId={threeDModel.includes(':') ? threeDModel : `vertexai:${threeDModel}`}
        />
      )}

      {/* Learn About Something Model Selection Modal */}
      {showLearnModelModal && (
        <D3ModelMapModal
          isOpen={showLearnModelModal}
          onClose={() => setShowLearnModelModal(false)}
          onSelectModel={handleSelectLearnModel}
          currentModelId={learnModel.includes(':') ? learnModel : `vertexai:${learnModel}`}
        />
      )}
      

      </div>

      {/* Main Page Side Panel */}
      <MainPageSidePanel
        onShow3DGenerator={() => setShow3DGenerator(true)}
        onShowLearnAboutSomething={() => setShowLearnAboutSomething(true)}
        isOpen={isSidePanelOpen}
        onToggle={() => setIsSidePanelOpen(!isSidePanelOpen)}
      />
      
    </div>
    </OnboardingWrapper>
  );
};

export default MenttorLabsMainPage;
