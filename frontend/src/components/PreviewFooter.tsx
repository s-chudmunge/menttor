import Link from 'next/link'

interface PreviewFooterProps {
  relatedRoadmaps?: Array<{
    slug: string
    title: string
    category: string
  }>
}

export default function PreviewFooter({ relatedRoadmaps = [] }: PreviewFooterProps) {
  return (
    <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-semibold text-black dark:text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Dashboard</Link></li>
              <li><Link href="/journey" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">My Journey</Link></li>
              <li><Link href="/performance-analysis" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Analytics</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-black dark:text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Help Center</Link></li>
              <li><Link href="mailto:support@menttor.live" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-black dark:text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">About</Link></li>
              <li><Link href="/sitemap" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Sitemap</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
            © 2024 Menttor Labs. All rights reserved.
            <br />Built with ❤️ for learners
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Privacy</Link>
            <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}