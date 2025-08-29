'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  PenTool,
  Plus,
  Minus,
  Clock,
  Target,
  Brain,
  Code,
  Search,
  Bug,
  FileText,
  Play,
  Settings,
  Trash2,
  GripVertical,
  Timer,
  Loader2
} from 'lucide-react';
import { RoadmapData } from '../../../lib/api';
import { formatSubtopicTitle, formatTitle } from '../utils/textFormatting';
import { useAuth } from '@/app/context/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface PracticeViewProps {
  roadmapData: RoadmapData;
  progressData: any[] | null;
}

interface SubtopicItem {
  id: string;
  title: string;
  module_title: string;
  topic_title: string;
  completed: boolean;
}

interface PracticeSession {
  selectedSubtopics: SubtopicItem[];
  questionCount: number;
  questionTypes: {
    mcq: boolean;
    numerical: boolean;
    caseStudy: boolean;
    codeCompletion: boolean;
    debugging: boolean;
  };
  timeLimit: number; // in minutes
  hintsEnabled: boolean;
}

const QUESTION_TYPES = [
  {
    key: 'mcq',
    label: 'Multiple Choice (MCQ)',
    description: 'Single correct answer questions',
    icon: Target,
    color: 'blue'
  },
  {
    key: 'numerical',
    label: 'Problem Solving / Numerical',
    description: 'Calculate and type the answer',
    icon: Brain,
    color: 'green'
  },
  {
    key: 'caseStudy',
    label: 'Case Study / Scenario',
    description: 'Apply knowledge in context',
    icon: FileText,
    color: 'purple'
  },
  {
    key: 'codeCompletion',
    label: 'Code Completion',
    description: 'Fill in missing code parts',
    icon: Code,
    color: 'orange'
  },
  {
    key: 'debugging',
    label: 'Debugging / Error Finding',
    description: 'Find errors in code or statements',
    icon: Bug,
    color: 'red'
  }
];

const PracticeView: React.FC<PracticeViewProps> = ({ roadmapData, progressData }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [practiceSession, setPracticeSession] = useState<PracticeSession>({
    selectedSubtopics: [],
    questionCount: 20,
    questionTypes: {
      mcq: true,
      numerical: false,
      caseStudy: false,
      codeCompletion: false,
      debugging: false
    },
    timeLimit: 30,
    hintsEnabled: true
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Extract all available subtopics from roadmap
  const availableSubtopics = useMemo(() => {
    if (!roadmapData?.roadmap_plan) return [];

    const modules = (roadmapData.roadmap_plan as any)?.modules || roadmapData.roadmap_plan || [];
    const subtopics: SubtopicItem[] = [];

    modules.forEach((module: any) => {
      if (module.topics) {
        module.topics.forEach((topic: any) => {
          if (topic.subtopics) {
            topic.subtopics.forEach((subtopic: any) => {
              const progress = progressData?.find(p => p.sub_topic_id === subtopic.id);
              subtopics.push({
                id: subtopic.id || '',
                title: formatSubtopicTitle(subtopic.title),
                module_title: formatTitle(module.title),
                topic_title: formatTitle(topic.title),
                completed: progress?.status === 'completed' || false
              });
            });
          }
        });
      }
    });

    return subtopics;
  }, [roadmapData, progressData]);

  // Filter subtopics based on search
  const filteredSubtopics = useMemo(() => {
    if (!searchTerm) return availableSubtopics;
    
    const term = searchTerm.toLowerCase();
    return availableSubtopics.filter(subtopic => 
      subtopic.title.toLowerCase().includes(term) ||
      subtopic.module_title.toLowerCase().includes(term) ||
      subtopic.topic_title.toLowerCase().includes(term)
    );
  }, [availableSubtopics, searchTerm]);

  const handleAddSubtopic = (subtopic: SubtopicItem) => {
    if (!practiceSession.selectedSubtopics.find(s => s.id === subtopic.id)) {
      setPracticeSession(prev => ({
        ...prev,
        selectedSubtopics: [...prev.selectedSubtopics, subtopic]
      }));
    }
  };

  const handleRemoveSubtopic = (subtopicId: string) => {
    setPracticeSession(prev => ({
      ...prev,
      selectedSubtopics: prev.selectedSubtopics.filter(s => s.id !== subtopicId)
    }));
  };

  const handleQuestionTypeToggle = (type: keyof PracticeSession['questionTypes']) => {
    setPracticeSession(prev => ({
      ...prev,
      questionTypes: {
        ...prev.questionTypes,
        [type]: !prev.questionTypes[type]
      }
    }));
  };

  const handleStartPractice = async () => {
    if (isCreatingSession) return; // Prevent double-clicks
    
    setIsCreatingSession(true);
    try {
      // Create practice session via streaming API for faster experience
      const sessionData = {
        subtopic_ids: practiceSession.selectedSubtopics.map(s => s.id),
        question_count: practiceSession.questionCount,
        question_types: Object.entries(practiceSession.questionTypes)
          .filter(([_, enabled]) => enabled)
          .map(([type, _]) => type),
        time_limit: practiceSession.timeLimit,
        hints_enabled: practiceSession.hintsEnabled,
        roadmap_id: roadmapData.id,
        subject: roadmapData.subject || 'General Subject',
        goal: roadmapData.goal || roadmapData.description || 'Practice Questions'
      };

      // Use fetch for streaming instead of axios
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://menttor-backend.onrender.com'}/practice/sessions/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let sessionToken = '';
      let questionsReady = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'session_created') {
                sessionToken = data.data.session_token;
                // Navigate immediately when session is created
                router.push(`/practice-session?session_token=${sessionToken}&streaming=true`);
              } else if (data.type === 'question_ready') {
                questionsReady++;
                // Questions will be loaded by the practice session page
              } else if (data.type === 'progress') {
                // Progress updates are handled by the practice session page
                console.log(`Progress: ${data.data.percentage}% (${data.data.generated}/${data.data.total})`);
              } else if (data.type === 'error') {
                console.error('Streaming error:', data.data.message);
              } else if (data.type === 'complete') {
                console.log(`Session complete: ${data.data.total_questions} questions generated`);
                break;
              }
            } catch (e) {
              console.error('Error parsing streaming data:', e);
            }
          }
        }
      }
      
    } catch (error: any) {
      console.error('Error creating practice session:', error);
      const errorMessage = error?.response?.data?.detail || error.message || 'Failed to create practice session';
      alert(`${errorMessage}. Please check your connection and try again.`);
      setIsCreatingSession(false); // Reset loading state only on error
    }
  };

  const selectedTypeCount = Object.values(practiceSession.questionTypes).filter(Boolean).length;
  const canStartPractice = practiceSession.selectedSubtopics.length > 0 && selectedTypeCount > 0 && !isCreatingSession;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Practice & Exam Mode
        </h2>
        <p className="text-gray-700 dark:text-gray-300">
          Create custom practice sessions with questions from selected subtopics
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Subtopic Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Search className="w-5 h-5 mr-2 text-indigo-600" />
            Select Subtopics
          </h3>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search subtopics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Available Subtopics */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredSubtopics.map((subtopic, index) => {
              const isSelected = practiceSession.selectedSubtopics.find(s => s.id === subtopic.id);
              
              return (
                <motion.div
                  key={subtopic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600' 
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => isSelected ? handleRemoveSubtopic(subtopic.id) : handleAddSubtopic(subtopic)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {subtopic.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {subtopic.module_title} • {subtopic.topic_title}
                      </p>
                      {subtopic.completed && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 mt-1">
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="ml-3">
                      {isSelected ? (
                        <Minus className="w-4 h-4 text-red-600" />
                      ) : (
                        <Plus className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Selected Count */}
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
              {practiceSession.selectedSubtopics.length} subtopics selected
            </p>
          </div>
        </motion.div>

        {/* Right Panel: Configuration */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Selected Subtopics */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <GripVertical className="w-5 h-5 mr-2 text-indigo-600" />
              Selected Subtopics ({practiceSession.selectedSubtopics.length})
            </h4>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {practiceSession.selectedSubtopics.map((subtopic) => (
                <div
                  key={subtopic.id}
                  className="flex items-center justify-between p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {subtopic.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {subtopic.module_title}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveSubtopic(subtopic.id)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {practiceSession.selectedSubtopics.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  No subtopics selected. Choose from the left panel.
                </p>
              )}
            </div>
          </div>

          {/* Question Configuration */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-indigo-600" />
              Practice Configuration
            </h4>

            {/* Question Count */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Questions: {practiceSession.questionCount}
              </label>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={practiceSession.questionCount}
                onChange={(e) => setPracticeSession(prev => ({
                  ...prev,
                  questionCount: parseInt(e.target.value)
                }))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10</span>
                <span>150</span>
              </div>
            </div>

            {/* Time Limit */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Limit: {practiceSession.timeLimit} minutes
              </label>
              <input
                type="range"
                min="10"
                max="180"
                step="5"
                value={practiceSession.timeLimit}
                onChange={(e) => setPracticeSession(prev => ({
                  ...prev,
                  timeLimit: parseInt(e.target.value)
                }))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10 min</span>
                <span>3 hrs</span>
              </div>
            </div>

            {/* Question Types */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Question Types ({selectedTypeCount} selected)
              </label>
              <div className="space-y-2">
                {QUESTION_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isEnabled = practiceSession.questionTypes[type.key as keyof PracticeSession['questionTypes']];
                  
                  return (
                    <label
                      key={type.key}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        isEnabled
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleQuestionTypeToggle(type.key as keyof PracticeSession['questionTypes'])}
                        className="sr-only"
                      />
                      <Icon className={`w-4 h-4 mr-3 text-${type.color}-600`} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {type.label}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {type.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Hints Toggle */}
            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={practiceSession.hintsEnabled}
                  onChange={(e) => setPracticeSession(prev => ({
                    ...prev,
                    hintsEnabled: e.target.checked
                  }))}
                  className="sr-only"
                />
                <div className={`w-11 h-6 bg-gray-200 rounded-full relative transition-colors ${
                  practiceSession.hintsEnabled ? 'bg-indigo-600' : ''
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    practiceSession.hintsEnabled ? 'translate-x-5' : ''
                  }`} />
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable hints for difficult questions
                </span>
              </label>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartPractice}
              disabled={!canStartPractice || isCreatingSession}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                canStartPractice && !isCreatingSession
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {isCreatingSession ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Questions...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start Practice Session</span>
                </>
              )}
            </button>

            {!canStartPractice && !isCreatingSession && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                Select at least one subtopic and question type to start
              </p>
            )}
            
            {isCreatingSession && (
              <div className="text-center mt-3">
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                  Please wait while we generate your practice questions...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This may take 10-30 seconds depending on question complexity
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PracticeView;