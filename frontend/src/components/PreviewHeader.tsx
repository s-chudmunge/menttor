import Link from 'next/link'
import { Home, BookOpen, Target, BarChart3 } from 'lucide-react'
import Logo from '@rootComponents/Logo'
import ProfileDropdown from './ProfileDropdown'

export default function PreviewHeader() {
  const navigationItems = [
    { href: '/', label: 'Home', icon: Home, active: false },
    { href: '/explore', label: 'Explore', icon: BookOpen, active: true },
    { href: '/journey', label: 'Journey', icon: Target, active: false },
    { href: '/performance-analysis', label: 'Performance', icon: BarChart3, active: false },
  ]

  return (
    <header className="bg-white/95 dark:bg-black backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Logo />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all duration-200 ${
                    item.active 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Profile */}
          <div className="flex items-center space-x-3">
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  )
}