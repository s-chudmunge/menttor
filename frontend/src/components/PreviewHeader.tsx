import Link from 'next/link'
import { Home, Search, BookOpen, User } from 'lucide-react'

export default function PreviewHeader() {
  return (
    <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/Menttor.png" alt="Menttor" className="h-8 w-auto" />
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/explore" className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Search className="w-4 h-4" />
                <span>Explore</span>
              </Link>
              <Link href="/help" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Help
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/auth/signin"
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}