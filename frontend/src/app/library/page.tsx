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
        <div className="space-y-4">
          <a 
            href="/library/neural-network-architectures"
            className="block border-l-4 border-blue-500 bg-white p-4 hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Neural Network Architectures
            </h3>
            <p className="text-gray-600 text-sm">
              Comprehensive guide to neural network architectures in deep learning research
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}