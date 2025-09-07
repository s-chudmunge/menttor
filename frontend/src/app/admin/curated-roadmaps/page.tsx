'use client'

import React, { useState, useEffect } from 'react'
import Button from '@/components/Button'
import { useRouter } from 'next/navigation'

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

interface CuratedRoadmapFromAPI {
  id: number
  title: string
  description: string
  category: string
  subcategory?: string
  difficulty: string
  is_featured: boolean
  is_verified: boolean
  view_count: number
  adoption_count: number
  average_rating: number
  estimated_hours?: number
}

interface AdminStatus {
  total_available: number
  total_generated: number
  remaining: number
  roadmaps: RoadmapConfig[]
}

interface TrendingListResponse {
  total_available: number
  roadmaps: Array<{
    id: number
    title: string
    category: string
    subcategory?: string
    difficulty: string
    description: string
    estimated_hours?: number
  }>
}

interface LearningResource {
  title: string
  url: string
  type: string
  description: string
}

interface GenerateResourcesResponse {
  success: boolean
  resources: LearningResource[]
  total_generated: number
  error?: string
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://menttor-backend.onrender.com'

export default function AdminCuratedRoadmaps() {
  const router = useRouter()
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null)
  const [trendingList, setTrendingList] = useState<TrendingListResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState<number | null>(null)
  const [clearing, setClearing] = useState(false)
  const [message, setMessage] = useState('')
  const [generatingImages, setGeneratingImages] = useState(false)
  const [imageMessage, setImageMessage] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadMessage, setDownloadMessage] = useState('')
  const [practiceLocked, setPracticeLocked] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('practiceLocked') === 'true'
    }
    return false
  })
  const [selectedRoadmaps, setSelectedRoadmaps] = useState<Set<number>>(new Set())
  const [deletingSelected, setDeletingSelected] = useState(false)
  const [generatingResources, setGeneratingResources] = useState<number | null>(null)
  const [showResourcesModal, setShowResourcesModal] = useState<{ roadmapIndex: number, resources: LearningResource[] } | null>(null)
  const [savingResources, setSavingResources] = useState(false)

  // Toggle practice lock
  const togglePracticeLock = () => {
    const newLockState = !practiceLocked
    setPracticeLocked(newLockState)
    localStorage.setItem('practiceLocked', newLockState.toString())
  }


  // Load data without authentication checks
  useEffect(() => {
    loadData()
  }, [])

  // Load both status and all roadmaps
  const loadData = async () => {
    try {
      const [statusResponse, roadmapsResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/curated-roadmaps/admin/status`),
        fetch(`${BACKEND_URL}/curated-roadmaps/?per_page=100&page=1`)
      ])

      if (statusResponse.ok && roadmapsResponse.ok) {
        const statusData = await statusResponse.json()
        const roadmapsData: CuratedRoadmapFromAPI[] = await roadmapsResponse.json()
        
        console.log('Admin status data:', statusData)
        console.log('Roadmaps data:', roadmapsData)
        
        setAdminStatus(statusData)
        // Transform the roadmaps data to match the TrendingListResponse format
        setTrendingList({
          total_available: roadmapsData.length,
          roadmaps: roadmapsData.map((roadmap) => ({
            id: roadmap.id,
            title: roadmap.title,
            category: roadmap.category,
            subcategory: roadmap.subcategory,
            difficulty: roadmap.difficulty,
            description: roadmap.description,
            estimated_hours: roadmap.estimated_hours
          }))
        })
      } else {
        console.error('API response errors:', {
          status: statusResponse.status,
          statusText: statusResponse.statusText,
          roadmaps: roadmapsResponse.status,
          roadmapsText: roadmapsResponse.statusText
        })
        if (!statusResponse.ok) {
          const statusError = await statusResponse.text()
          console.error('Status API error:', statusError)
        }
        if (!roadmapsResponse.ok) {
          const roadmapsError = await roadmapsResponse.text()
          console.error('Roadmaps API error:', roadmapsError)
        }
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
        method: 'POST'
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

  // Toggle roadmap selection
  const toggleRoadmapSelection = (index: number) => {
    const newSelected = new Set(selectedRoadmaps)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRoadmaps(newSelected)
  }

  // Select all generated roadmaps
  const selectAllGenerated = () => {
    if (!adminStatus) return
    const generatedIndexes = new Set(adminStatus.roadmaps.filter(r => r.generated).map(r => r.index))
    setSelectedRoadmaps(generatedIndexes)
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedRoadmaps(new Set())
  }

  // Delete selected roadmaps
  const deleteSelectedRoadmaps = async () => {
    if (selectedRoadmaps.size === 0) return

    const selectedArray = Array.from(selectedRoadmaps)
    if (!confirm(`⚠️ Are you sure you want to delete ${selectedArray.length} selected roadmap(s)? This cannot be undone!`)) {
      return
    }

    setDeletingSelected(true)
    setMessage('')

    try {
      const response = await fetch(`${BACKEND_URL}/curated-roadmaps/admin/delete-selected`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ indexes: selectedArray })
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(`🗑️ Successfully deleted ${selectedArray.length} roadmap(s)`)
        setSelectedRoadmaps(new Set())
        await loadData() // Refresh status
      } else {
        setMessage(`❌ ${result.detail || 'Failed to delete selected roadmaps'}`)
      }
    } catch (error) {
      setMessage('❌ Network error during deletion')
    } finally {
      setDeletingSelected(false)
    }
  }

  // Generate learning resources for a roadmap
  const generateLearningResources = async (index: number) => {
    setGeneratingResources(index)
    setMessage('')

    try {
      // Check if roadmap is generated first
      const statusResponse = await fetch(`${BACKEND_URL}/curated-roadmaps/admin/status`)

      if (!statusResponse.ok) {
        throw new Error('Failed to fetch roadmap status')
      }

      const statusData = await statusResponse.json()
      const roadmapInfo = statusData.roadmaps.find((r: any) => r.index === index)
      
      if (!roadmapInfo || !roadmapInfo.generated) {
        setMessage('❌ Roadmap must be generated first before adding resources')
        return
      }

      // Use new simplified endpoint that takes index directly
      const response = await fetch(`${BACKEND_URL}/learning-resources/generate-by-index/${index}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage(`✅ Generated ${result.total_generated} learning resources`)
        setShowResourcesModal({
          roadmapIndex: index,
          resources: result.resources
        })
      } else {
        setMessage(`❌ ${result.error || 'Failed to generate learning resources'}`)
      }
    } catch (error) {
      console.error('Resource generation error:', error)
      setMessage('❌ Network error during resource generation')
    } finally {
      setGeneratingResources(null)
    }
  }

  // Save approved resources to database
  const saveApprovedResources = async (roadmapIndex: number, resources: LearningResource[]) => {
    setSavingResources(true)
    setMessage('')

    try {
      // Prepare resources for saving (curated_roadmap_id will be set by backend)
      const resourcesToSave = resources.map(resource => ({
        curated_roadmap_id: 0, // Backend will set this based on roadmap index
        title: resource.title,
        url: resource.url,
        type: resource.type,
        description: resource.description
      }))

      // Use new simplified endpoint that takes index directly
      const response = await fetch(`${BACKEND_URL}/learning-resources/save-by-index/${roadmapIndex}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resourcesToSave)
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(`✅ Saved ${result.saved_count} learning resources`)
        setShowResourcesModal(null)
      } else {
        setMessage(`❌ Failed to save resources: ${result.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Resource saving error:', error)
      setMessage('❌ Network error during resource saving')
    } finally {
      setSavingResources(false)
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
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(`🗑️ ${result.message}`)
        setSelectedRoadmaps(new Set())
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
      // First get the first page to see total count
      const firstPageResponse = await fetch(`${BACKEND_URL}/curated-roadmaps/?per_page=100&page=1`)

      if (!firstPageResponse.ok) {
        throw new Error('Failed to fetch roadmaps data from server')
      }

      let allRoadmaps = await firstPageResponse.json()
      
      // If we got exactly 100 items, there might be more pages
      // For now, we'll assume 100 is enough since most sites won't have more than 100 curated roadmaps
      // If needed later, we can add proper pagination here

      // Fetch categories
      const categoriesResponse = await fetch(`${BACKEND_URL}/curated-roadmaps/categories/all`)

      if (!categoriesResponse.ok) {
        throw new Error('Failed to fetch categories from server')
      }

      const categories = await categoriesResponse.json()

      // Create the data structure
      const exportData = {
        generated_at: new Date().toISOString(),
        total_roadmaps: allRoadmaps.length,
        roadmaps: allRoadmaps,
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

      setDownloadMessage(`✅ Successfully downloaded ${allRoadmaps.length} roadmaps! Place this file in backend/curated_roadmaps_data/`)
      
    } catch (error) {
      console.error('Error downloading data:', error)
      setDownloadMessage('❌ Failed to download curated roadmaps data')
    } finally {
      setDownloading(false)
    }
  }

  // No authentication checks needed

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
                onClick={togglePracticeLock}
                className={`px-4 py-2 rounded-md transition duration-150 ease-in-out ${
                  practiceLocked 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {practiceLocked ? '🔒 Unlock Practice' : '🔓 Lock Practice'}
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-150 ease-in-out"
              >
                Back to Dashboard
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Trending Roadmaps</h2>
              <div className="flex gap-2">
                <button
                  onClick={selectAllGenerated}
                  disabled={adminStatus.total_generated === 0}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Select All Generated
                </button>
                <button
                  onClick={clearSelection}
                  disabled={selectedRoadmaps.size === 0}
                  className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Selection
                </button>
                <button
                  onClick={deleteSelectedRoadmaps}
                  disabled={selectedRoadmaps.size === 0 || deletingSelected}
                  className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingSelected ? 'Deleting...' : `Delete Selected (${selectedRoadmaps.size})`}
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {trendingList.roadmaps.map((roadmap, displayIndex) => {
                // Find matching roadmap in admin status by comparing title and category
                const matchingAdminRoadmap = adminStatus.roadmaps.find(r => 
                  r.title === roadmap.title && r.category === roadmap.category
                )
                const roadmapIndex = matchingAdminRoadmap?.index || displayIndex
                const isGenerated = matchingAdminRoadmap?.generated || false
                const isGenerating = generating === roadmapIndex
                const isSelected = selectedRoadmaps.has(roadmapIndex)

                return (
                  <div
                    key={roadmap.id || displayIndex}
                    className={`border rounded-lg p-6 ${isGenerated 
                      ? isSelected 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4 flex-1">
                        {isGenerated && (
                          <div className="mt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRoadmapSelection(roadmapIndex)}
                              className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                            />
                          </div>
                        )}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-medium">
                                #{roadmapIndex}
                              </span>
                              {isGenerated && (
                                <span className={`px-2 py-1 rounded text-sm font-medium ${
                                  isSelected 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {isSelected ? '🗑️ Selected for deletion' : '✅ Generated'}
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
                              {roadmap.estimated_hours && (
                                <div>
                                  <span className="font-medium">Estimated:</span> {roadmap.estimated_hours} hours
                                </div>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mt-2">
                              <span className="font-medium">Description:</span> {roadmap.description}
                            </p>
                          </div>
                        </div>

                      <div className="ml-4 flex gap-2">
                        <Button
                          onClick={() => generateRoadmap(roadmapIndex)}
                          disabled={isGenerated || isGenerating}
                          className={isGenerated ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          {isGenerating ? 'Generating...' : isGenerated ? 'Already Generated' : 'Generate Roadmap'}
                        </Button>
                        {isGenerated && (
                          <Button
                            onClick={() => generateLearningResources(roadmapIndex)}
                            disabled={generatingResources === roadmapIndex}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            {generatingResources === roadmapIndex ? 'Generating...' : 'Generate Resources'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Learning Resources Modal */}
        {showResourcesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                Generated Learning Resources - Roadmap #{showResourcesModal.roadmapIndex}
              </h2>
              
              <div className="space-y-3 mb-6">
                {showResourcesModal.resources.map((resource, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {resource.type}
                          </span>
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            {resource.url}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowResourcesModal(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveApprovedResources(showResourcesModal.roadmapIndex, showResourcesModal.resources)}
                  disabled={savingResources}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {savingResources ? 'Saving...' : `Save ${showResourcesModal.resources.length} Resources`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refresh button */}
        <div className="mt-6 text-center">
          <button
            onClick={loadData}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-150 ease-in-out"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  )
}