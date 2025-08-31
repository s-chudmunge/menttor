'use client'

import React, { useState } from 'react'
import Button from '@/components/Button'

export default function AdminEmailSystem() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  const [recipientEmail, setRecipientEmail] = useState('')
  const [emailSubject, setEmailSubject] = useState('Test Email from Menttor')
  const [emailMessage, setEmailMessage] = useState('This is a test email sent from the Menttor admin panel.')
  const [emailTemplate, setEmailTemplate] = useState('custom')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string>('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    if (username === 'mountain_snatcher' && password === 'tyson2012') {
      setIsAuthenticated(true)
    } else {
      setLoginError('Invalid credentials')
    }
  }

  const getWelcomeTemplate = () => {
    return `Welcome to Menttor! 🚀

Hi there!

Welcome to Menttor - your smart learning companion! We're excited to have you join our community of learners.

**🗺️ Explore 500+ Curated Roadmaps**
Visit our Explore page to discover expertly crafted learning paths across programming, business, science, and more. Each roadmap is designed to take you from beginner to expert.

**🎯 Your Personalized Journey**
• Interactive roadmap visualization with progress tracking
• Practice exercises tailored to your learning style  
• Quick tools: Flashcards, Mind Maps, Timetables, PDF exports
• Performance analytics to track your growth

**✨ Key Features You'll Love**
• Smart content adaptation based on your progress
• Behavioral learning insights and milestone rewards
• Mobile-optimized learning experience
• 95% learner success rate with our structured approach

Ready to start your learning journey? Head to menttor.live and dive in!

Best regards,
Sankalp from Menttor
menttor.live`;
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setSendResult('')

    try {
      const finalMessage = emailTemplate === 'welcome' ? getWelcomeTemplate() : emailMessage;
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailSubject,
          message: finalMessage,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSendResult(`✅ Email sent successfully! Email ID: ${data.emailId}`)
        if (emailTemplate === 'welcome') {
          setRecipientEmail('')
        }
      } else {
        setSendResult(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setSendResult(`❌ Network error: ${error}`)
    } finally {
      setSending(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow rounded-lg sm:px-10">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                Admin Login
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                Email System Administration
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {loginError && (
                <div className="text-red-600 dark:text-red-400 text-sm text-center">
                  {loginError}
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign in
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Email System Administration
                </h1>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  Send test emails using Resend from sankalp@menttor.live
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Button
                  onClick={() => setIsAuthenticated(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  Logout
                </Button>
              </div>
            </div>

            <div className="mt-8">
              <form onSubmit={handleSendEmail} className="space-y-6">
                <div>
                  <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Template
                  </label>
                  <select
                    id="template"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    value={emailTemplate}
                    onChange={(e) => {
                      setEmailTemplate(e.target.value)
                      if (e.target.value === 'welcome') {
                        setEmailSubject('Welcome to Menttor - Start Your Learning Journey!')
                        setEmailMessage(getWelcomeTemplate())
                      } else {
                        setEmailSubject('Test Email from Menttor')
                        setEmailMessage('This is a test email sent from the Menttor admin panel.')
                      }
                    }}
                  >
                    <option value="custom">Custom Message</option>
                    <option value="welcome">Welcome Email Template</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    id="recipient"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    placeholder="recipient@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    placeholder="Enter your email message here..."
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                  />
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={sending}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      sending 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                  >
                    {sending ? 'Sending...' : 'Send Test Email'}
                  </Button>
                </div>

                {sendResult && (
                  <div className={`mt-4 p-4 rounded-md ${
                    sendResult.includes('✅') 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                  }`}>
                    <p className="text-sm">{sendResult}</p>
                  </div>
                )}
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Quick Test
                </h3>
                <Button
                  onClick={() => {
                    setRecipientEmail('your-email@gmail.com')
                    setEmailSubject('Test Email from Menttor Admin')
                    setEmailMessage('Hello! This is a test email sent from the Menttor admin panel to verify that the Resend integration is working correctly.\n\nIf you received this email, the setup is successful!')
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                >
                  Fill Sample Test Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}