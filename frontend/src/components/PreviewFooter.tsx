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
        {/* Related Roadmaps */}
        {relatedRoadmaps.length > 0 && (
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              Related Learning Paths
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedRoadmaps.slice(0, 3).map((roadmap) => (
                <Link
                  key={roadmap.slug}
                  href={`/explore/${roadmap.slug}`}
                  className="p-4 bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors border border-gray-200 dark:border-gray-800"
                >
                  <h4 className="font-medium text-black dark:text-white mb-1">{roadmap.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{roadmap.category.replace('-', ' ')}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-semibold text-black dark:text-white mb-4">Learn</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/explore" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">All Roadmaps</Link></li>
              <li><Link href="/explore?category=web-development" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Web Development</Link></li>
              <li><Link href="/explore?category=data-science" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Data Science</Link></li>
              <li><Link href="/explore?category=mobile-development" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Mobile Dev</Link></li>
            </ul>
          </div>
          
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