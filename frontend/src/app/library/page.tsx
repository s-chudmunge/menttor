import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import Logo from '../../../components/Logo';

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <Logo variant="dark" />
              <nav className="hidden md:flex items-center space-x-1">
                <Link 
                  href="/" 
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <span>Home</span>
                </Link>
                <Link 
                  href="/explore" 
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <span>Explore</span>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Menttor Library</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive knowledge base with editable, regeneratable content powered by AI
          </p>
        </div>

        {/* Library Content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link 
            href="/library/neural-network-architectures"
            className="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Neural Network Architectures
            </h3>
            <p className="text-gray-600 text-sm">
              Comprehensive guide to neural network architectures in deep learning research, covering feedforward networks, CNNs, RNNs, and Transformers.
            </p>
            <div className="mt-4 flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Deep Learning
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Research
              </span>
            </div>
          </Link>
          
          {/* Placeholder for more library content */}
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">More Content Coming Soon</h3>
            <p className="text-gray-400 text-sm">
              Additional library pages will be added here
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Wiki-Style Reading</h3>
            <p className="text-gray-600 text-sm">Clean, distraction-free reading experience with table of contents navigation</p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hidden Edit Controls</h3>
            <p className="text-gray-600 text-sm">Editing controls accessible via hover, edit mode, or right-click context menu</p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Regeneration</h3>
            <p className="text-gray-600 text-sm">Regenerate individual components or entire pages using different AI models</p>
          </div>
        </div>
      </div>
    </div>
  );
}