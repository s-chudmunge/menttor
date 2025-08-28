'use client'

import React, { useState, useEffect } from 'react'
import Button from '@/components/Button'

interface RoadmapConfig {
  index: number
  title: string
  category: string
  subcategory?: string
  difficulty: string
  estimated_hours: number
  target_audience: string
  generated?: boolean
}

interface AdminStatus {
  total_available: number
  total_generated: number
  remaining: number
  roadmaps: RoadmapConfig[]
}

interface TrendingListResponse {
  total_available: number
  roadmaps: Omit<RoadmapConfig, 'index' | 'generated'>[]
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://menttor-backend.onrender.com'

export default function AdminCuratedRoadmaps() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null)
  const [trendingList, setTrendingList] = useState<TrendingListResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState<number | null>(null)
  const [clearing, setClearing] = useState(false)
  const [message, setMessage] = useState('')
  const [generatingImages, setGeneratingImages] = useState(false)
  const [imageMessage, setImageMessage] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadMessage, setDownloadMessage] = useState('')

  // Create basic auth header
  const createAuthHeader = () => {
    return 'Basic ' + btoa(`${username}:${password}`)
  }

  // Test authentication and load initial data
  const handleLogin = async () => {
    if (!username || !password) {
      setLoginError('Please enter both username and password')
      return
    }

    setLoading(true)
    setLoginError('')

    try {
      const response = await fetch(`${BACKEND_URL}/curated-roadmaps/admin/status`, {
        headers: {
          'Authorization': createAuthHeader()
        }
      })

      if (response.status === 401) {
        setLoginError('Invalid credentials')
        return
      }

      if (!response.ok) {
        setLoginError('Failed to connect to server')
        return
      }

      setIsAuthenticated(true)
      await loadData()
    } catch (error) {
      setLoginError('Network error')
    } finally {
      setLoading(false)
    }
  }

  // Load both status and trending list
  const loadData = async () => {
    try {
      const [statusResponse, trendingResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/curated-roadmaps/admin/status`, {
          headers: { 'Authorization': createAuthHeader() }
        }),
        fetch(`${BACKEND_URL}/curated-roadmaps/admin/trending-list`, {
          headers: { 'Authorization': createAuthHeader() }
        })
      ])

      if (statusResponse.ok && trendingResponse.ok) {
        const statusData = await statusResponse.json()
        const trendingData = await trendingResponse.json()
        
        setAdminStatus(statusData)
        setTrendingList(trendingData)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  // Generate roadmap by index
  const generateRoadmap = async (index: number) => {
    setGenerating(index)
    setMessage('')

    try {
      const response = await fetch(`${BACKEND_URL}/curated-roadmaps/admin/generate/${index}`, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader()
        }
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(`✅ ${result.message}`)
        await loadData() // Refresh status
      } else {
        setMessage(`❌ ${result.detail}`)
      }
    } catch (error) {
      setMessage('❌ Network error during generation')
    } finally {
      setGenerating(null)
    }
  }

  // Clear all roadmaps
  const clearAllRoadmaps = async () => {
    if (!confirm('⚠️ Are you sure you want to delete ALL curated roadmaps? This cannot be undone!')) {
      return
    }

    setClearing(true)
    setMessage('')

    try {
      const response = await fetch(`${BACKEND_URL}/curated-roadmaps/admin/clear-all`, {
        method: 'DELETE',
        headers: {
          'Authorization': createAuthHeader()
        }
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(`🗑️ ${result.message}`)
        await loadData() // Refresh status
      } else {
        setMessage(`❌ ${result.detail}`)
      }
    } catch (error) {
      setMessage('❌ Network error during deletion')
    } finally {
      setClearing(false)
    }
  }

  // Generate promotional images
  const generatePromotionalImages = async () => {
    if (!confirm('Generate 12 promotional images for the main page? This will take a few minutes.')) {
      return
    }

    setGeneratingImages(true)
    setImageMessage('Generating promotional images... This may take 3-5 minutes.')
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/promotional-images/generate-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ count: 12 })
      })

      const result = await response.json()
      
      if (result.success) {
        setImageMessage(`✅ Successfully generated ${result.generated_count} promotional images! They will now rotate on the main page.`)
      } else {
        setImageMessage(`❌ Failed to generate images: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error generating images:', error)
      setImageMessage('❌ Error generating promotional images')
    } finally {
      setGeneratingImages(false)
    }
  }

  // Download curated roadmaps data
  const downloadCuratedRoadmaps = async () => {
    if (!confirm('Download all curated roadmaps data as JSON? This will include all roadmaps and categories for static loading.')) {
      return
    }

    setDownloading(true)
    setDownloadMessage('Fetching curated roadmaps data...')
    
    try {
      // Fetch all roadmaps and categories
      const [roadmapsResponse, categoriesResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/curated-roadmaps/?per_page=1000`, {
          headers: { 'Authorization': createAuthHeader() }
        }),
        fetch(`${BACKEND_URL}/curated-roadmaps/categories/all`, {
          headers: { 'Authorization': createAuthHeader() }
        })
      ])

      if (!roadmapsResponse.ok || !categoriesResponse.ok) {
        throw new Error('Failed to fetch data from server')
      }

      const roadmaps = await roadmapsResponse.json()
      const categories = await categoriesResponse.json()

      // Create the data structure
      const exportData = {
        generated_at: new Date().toISOString(),
        total_roadmaps: roadmaps.length,
        roadmaps: roadmaps,
        categories: categories.categories || {}
      }

      // Create and download the JSON file
      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `curated_roadmaps_data_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setDownloadMessage(`✅ Successfully downloaded ${roadmaps.length} roadmaps! Place this file in backend/curated_roadmaps_data/`)
      
    } catch (error) {
      console.error('Error downloading data:', error)
      setDownloadMessage('❌ Failed to download curated roadmaps data')
    } finally {
      setDownloading(false)
    }
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Admin Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Curated Roadmaps Management
            </p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Admin username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Admin password"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {loginError && (
              <div className="text-red-600 text-sm text-center">{loginError}</div>
            )}

            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Curated Roadmaps Admin</h1>
              <p className="text-gray-600 mt-1">Generate and manage curated roadmaps for the explore page</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadCuratedRoadmaps}
                disabled={downloading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? 'Downloading...' : '📥 Download Data'}
              </button>
              <button
                onClick={generatePromotionalImages}
                disabled={generatingImages}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingImages ? 'Generating...' : '🎨 Generate Images'}
              </button>
              <button
                onClick={clearAllRoadmaps}
                disabled={clearing || (adminStatus?.total_generated === 0)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {clearing ? 'Clearing...' : 'Clear All'}
              </button>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-150 ease-in-out"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        {adminStatus && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{adminStatus.total_available}</div>
                <div className="text-sm text-gray-600">Available Roadmaps</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{adminStatus.total_generated}</div>
                <div className="text-sm text-gray-600">Generated</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{adminStatus.remaining}</div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="text-center font-medium">{message}</div>
          </div>
        )}
        
        {/* Image Generation Message */}
        {imageMessage && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg shadow-sm p-4 mb-6">
            <div className="text-center font-medium text-purple-800">{imageMessage}</div>
          </div>
        )}

        {/* Download Message */}
        {downloadMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-4 mb-6">
            <div className="text-center font-medium text-blue-800">{downloadMessage}</div>
          </div>
        )}

        {/* Roadmaps List */}
        {trendingList && adminStatus && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Trending Roadmaps</h2>
            <div className="space-y-4">
              {trendingList.roadmaps.map((roadmap, index) => {
                const isGenerated = adminStatus.roadmaps.find(r => r.index === index)?.generated || false
                const isGenerating = generating === index

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-6 ${isGenerated 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-medium">
                            #{index}
                          </span>
                          {isGenerated && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                              ✅ Generated
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {roadmap.title}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Category:</span> {roadmap.category}
                            {roadmap.subcategory && ` › ${roadmap.subcategory}`}
                          </div>
                          <div>
                            <span className="font-medium">Difficulty:</span> {roadmap.difficulty}
                          </div>
                          <div>
                            <span className="font-medium">Estimated:</span> {roadmap.estimated_hours} hours
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mt-2">
                          <span className="font-medium">Target:</span> {roadmap.target_audience}
                        </p>
                      </div>

                      <div className="ml-4">
                        <Button
                          onClick={() => generateRoadmap(index)}
                          disabled={isGenerated || isGenerating}
                          className={isGenerated ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          {isGenerating ? 'Generating...' : isGenerated ? 'Already Generated' : 'Generate Roadmap'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Refresh button */}
        <div className="mt-6 text-center">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : 'Refresh Status'}
          </button>
        </div>
      </div>
    </div>
  )
}