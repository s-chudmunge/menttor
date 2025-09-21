"use client";

import React from 'react';
import Link from 'next/link';
import Logo from '@rootComponents/Logo';
import { 
  Home, 
  BookOpen, 
  BarChart3, 
  User, 
  HelpCircle, 
  FileText, 
  Shield, 
  Mail,
  ArrowRight
} from 'lucide-react';

const SitemapPage = () => {
  const siteLinks = [
    {
      category: "Main Pages",
      icon: <Home className="w-5 h-5" />,
      links: [
        { name: "Home", href: "/", description: "Main landing page with roadmap generation" },
        { name: "Dashboard", href: "/dashboard", description: "Personal learning dashboard" },
        { name: "Learning Journey", href: "/journey", description: "Track your learning progress" },
      ]
    },
    {
      category: "Learning Features",
      icon: <BookOpen className="w-5 h-5" />,
      links: [
        { name: "Learn", href: "/learn", description: "Interactive learning content" },
        { name: "Quiz", href: "/quiz", description: "Test your knowledge with quizzes" },
        { name: "Visualize", href: "/visualize", description: "Visual learning tools" },
      ]
    },
    {
      category: "Analytics & Performance",
      icon: <BarChart3 className="w-5 h-5" />,
      links: [
        { name: "Performance Analysis", href: "/performance-analysis", description: "Detailed learning analytics" },
        { name: "Results", href: "/results", description: "Quiz and assessment results" },
        { name: "Quiz Results", href: "/quiz/results", description: "Detailed quiz performance" },
      ]
    },
    {
      category: "User Account",
      icon: <User className="w-5 h-5" />,
      links: [
        { name: "Profile", href: "/profile", description: "Manage your profile settings" },
        { name: "Sign In", href: "/auth/signin", description: "Login to your account" },
        { name: "Reset Password", href: "/auth/reset-password", description: "Reset your password" },
      ]
    },
    {
      category: "Support & Information",
      icon: <HelpCircle className="w-5 h-5" />,
      links: [
        { name: "Help Center", href: "/help", description: "Get help and support" },
        { name: "Contact Support", href: "/contact", description: "Contact our support team" },
        { name: "Status", href: "/status", description: "System status and uptime" },
      ]
    },
    {
      category: "Legal & Policies",
      icon: <Shield className="w-5 h-5" />,
      links: [
        { name: "Privacy Policy", href: "/privacy", description: "Our privacy policy" },
        { name: "Terms of Service", href: "/terms", description: "Terms and conditions" },
        { name: "Security", href: "/security", description: "Security information" },
      ]
    },
    {
      category: "Company",
      icon: <FileText className="w-5 h-5" />,
      links: [
        { name: "About Us", href: "/about", description: "Learn about MenttorLabs" },
        { name: "Careers", href: "/careers", description: "Join our team" },
        { name: "Blog", href: "/blog", description: "Latest news and insights" },
        { name: "Press", href: "/press", description: "Press releases and media" },
        { name: "Partners", href: "/partnerships", description: "Partnership opportunities" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <Logo />
            </div>
            <Link 
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-6">
            Sitemap
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Navigate through all the pages and features available on MenttorLabs. 
            Find everything you need for your personalized learning journey.
          </p>
        </div>

        {/* Sitemap Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {siteLinks.map((category, index) => (
            <div 
              key={index} 
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white mr-4">
                  {category.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {category.category}
                </h2>
              </div>
              
              <div className="space-y-4">
                {category.links.map((link, linkIndex) => (
                  <div key={linkIndex}>
                    <Link 
                      href={link.href}
                      className="group flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-700/80 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                          {link.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {link.description}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="mt-16 bg-blue-600 rounded-2xl p-8 md:p-12 text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Need Help Finding Something?</h2>
            <p className="text-xl opacity-90 mb-8">
              If you can't find what you're looking for, our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/help"
                className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center"
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                Visit Help Center
              </Link>
              <Link 
                href="/contact"
                className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-full font-bold hover:bg-white/30 transition-all duration-300 inline-flex items-center justify-center"
              >
                <Mail className="w-5 h-5 mr-2" />
                Contact Support
              </Link>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center mt-12">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SitemapPage;