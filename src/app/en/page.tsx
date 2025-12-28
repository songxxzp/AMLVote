'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, Search, Trophy, Users, FileText, Image, Star, Globe } from 'lucide-react'
import Link from 'next/link'

interface Submission {
  id: string
  title: string
  description?: string
  type: 'PAPER' | 'POSTER' | 'DEMO'
  authorName: string
  authorEmail: string
  authorStudentId?: string
  coAuthors?: string
  coAuthorStudentIds?: string
  abstract?: string
  keywords?: string
  voteCount: number
  isPresented: boolean
  createdAt: string
  fileName?: string
  fileUrl?: string
  hasVoted?: boolean
}

export default function EnglishPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('votes')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [voterStudentId, setVoterStudentId] = useState('')
  const [voterName, setVoterName] = useState('')
  const [showVoterDialog, setShowVoterDialog] = useState(false)
  const [pendingVoteId, setPendingVoteId] = useState<string | null>(null)
  const [remainingVotes, setRemainingVotes] = useState(5)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'PAPER',
    authorName: '',
    authorEmail: '',
    authorStudentId: '',
    coAuthors: '',
    coAuthorStudentIds: '',
    abstract: '',
    keywords: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Fetch submissions on mount
  useEffect(() => {
    fetchSubmissions()
  }, [])

  // Fetch remaining votes when student ID changes
  useEffect(() => {
    if (voterStudentId) {
      fetchRemainingVotes()
    }
  }, [voterStudentId])

  const fetchRemainingVotes = async () => {
    try {
      const response = await fetch('/api/votes-remaining', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voterStudentId })
      })

      if (response.ok) {
        const data = await response.json()
        setRemainingVotes(data.remainingVotes)
      }
    } catch (error) {
      console.error('Error fetching remaining votes:', error)
    }
  }

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions')
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setSubmissions(data)
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (submissionId: string) => {
    if (!voterStudentId || !voterName) {
      setPendingVoteId(submissionId)
      setShowVoterDialog(true)
      return
    }

    if (remainingVotes <= 0) {
      alert('Your votes are exhausted! Each student can vote maximum 5 times.')
      return
    }

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          voterStudentId,
          voterName
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Vote Error Response:', errorText)
        const error = JSON.parse(errorText)
        alert(error.error || 'Voting failed')
        return
      }

      const result = await response.json()
      console.log('Vote Success:', result)

      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId
            ? { ...sub, voteCount: sub.voteCount + 1, hasVoted: true }
            : sub
        )
      )

      // Update remaining votes
      setRemainingVotes(result.remainingVotes || 0)

      alert('Vote successful!')
    } catch (error) {
      console.error('Error voting:', error)
      alert('Voting failed, please try again')
    }
  }

  const handleVoterInfoSubmit = () => {
    if (voterStudentId && voterName && pendingVoteId) {
      setShowVoterDialog(false)
      handleVote(pendingVoteId)
      setPendingVoteId(null)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return null

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload Error Response:', errorText)
        throw new Error(`Upload failed with status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Upload Success:', data)
      return data
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.authorName || !formData.authorEmail || !formData.authorStudentId) {
      alert('Please fill in required fields (title, author name, student ID, email)')
      return
    }

    setUploading(true)
    try {
      let fileData = null
      if (selectedFile) {
        fileData = await handleFileUpload()
        if (!fileData) {
          alert('File upload failed')
          return
        }
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          fileUrl: fileData?.fileUrl,
          fileName: fileData?.fileName,
          fileSize: fileData?.fileSize
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Submit Error Response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Submit Success:', result)

      setIsUploadOpen(false)
      setFormData({
        title: '',
        description: '',
        type: 'PAPER',
        authorName: '',
        authorEmail: '',
        authorStudentId: '',
        coAuthors: '',
        coAuthorStudentIds: '',
        abstract: '',
        keywords: ''
      })
      setSelectedFile(null)
      fetchSubmissions()
      alert('Work submitted successfully!')
    } catch (error) {
      console.error('Error submitting:', error)
      alert('Submission failed, please try again')
    } finally {
      setUploading(false)
    }
  }

  const filteredSubmissions = submissions
    .filter(submission => {
      const matchesSearch = submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           submission.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           submission.keywords?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = selectedType === 'ALL' || submission.type === selectedType
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      if (sortBy === 'votes') return b.voteCount - a.voteCount
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return 0
    })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PAPER': return <FileText className="w-4 h-4" />
      case 'POSTER': return <Image className="w-4 h-4" />
      case 'DEMO': return <Star className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PAPER': return 'bg-blue-100 text-blue-800'
      case 'POSTER': return 'bg-green-100 text-green-800'
      case 'DEMO': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const toggleCardExpansion = (submissionId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId)
      } else {
        newSet.add(submissionId)
      }
      return newSet
    })
  }

  const isExpanded = (submissionId: string) => expandedCards.has(submissionId)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-2xl font-bold text-gray-900">Academic Work Voting Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Your Student ID"
                  value={voterStudentId}
                  onChange={(e) => setVoterStudentId(e.target.value)}
                  className="w-32"
                />
                <Input
                  type="text"
                  placeholder="Your Name"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  className="w-32"
                />
                <div className="text-sm font-medium text-orange-600">
                  Votes left: {remainingVotes}/5
                </div>
              </div>
              <Link href="/zh">
                <Button variant="outline" size="sm">
                  <Globe className="w-4 h-4 mr-2" />
                  中文
                </Button>
              </Link>
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Work
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Submit Academic Work</DialogTitle>
                    <DialogDescription>
                      Please fill in the work information and upload related files
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Work Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter work title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Work Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select work type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAPER">Academic Paper</SelectItem>
                          <SelectItem value="POSTER">Academic Poster</SelectItem>
                          <SelectItem value="DEMO">Demo Project</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="author">Author Name *</Label>
                      <Input
                        id="author"
                        placeholder="Enter author name"
                        value={formData.authorName}
                        onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="studentId">Student ID *</Label>
                      <Input
                        id="studentId"
                        placeholder="Enter student ID"
                        value={formData.authorStudentId}
                        onChange={(e) => setFormData(prev => ({ ...prev, authorStudentId: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={formData.authorEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, authorEmail: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="coAuthors">Co-authors</Label>
                      <Input
                        id="coAuthors"
                        placeholder="Enter co-author names, separated by commas"
                        value={formData.coAuthors}
                        onChange={(e) => setFormData(prev => ({ ...prev, coAuthors: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="coAuthorStudentIds">Co-author Student IDs</Label>
                      <Input
                        id="coAuthorStudentIds"
                        placeholder="Enter co-author student IDs, separated by commas"
                        value={formData.coAuthorStudentIds}
                        onChange={(e) => setFormData(prev => ({ ...prev, coAuthorStudentIds: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Work Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter work description"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="abstract">Abstract</Label>
                      <Textarea
                        id="abstract"
                        placeholder="Enter work abstract"
                        rows={4}
                        value={formData.abstract}
                        onChange={(e) => setFormData(prev => ({ ...prev, abstract: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="keywords">Keywords</Label>
                      <Input
                        id="keywords"
                        placeholder="Enter keywords, separated by commas"
                        value={formData.keywords}
                        onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="file">Upload File</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov,.wmv,.webm,.mkv,.m4v"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-gray-500">
                        Supports documents (PDF, DOC, PPT) and videos (MP4, AVI, MOV, WMV, WEBM, MKV, M4V), max 100MB
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={uploading}>
                      {uploading ? 'Submitting...' : 'Submit Work'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Welcome to Academic Work Voting Platform</h2>
          <p className="text-xl mb-8">Discover excellent academic works and vote for your favorite research</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Participate in Voting</h3>
              <p>Vote for your favorite academic works and support excellent research</p>
            </div>
            <div className="text-center">
              <Upload className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Share Your Work</h3>
              <p>Upload your papers, posters or demo projects</p>
            </div>
            <div className="text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Get Recognition</h3>
              <p>Works with the most votes will have the opportunity to present on stage</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="submissions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="submissions">Work List</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search works, authors or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Work Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="PAPER">Academic Paper</SelectItem>
                    <SelectItem value="POSTER">Academic Poster</SelectItem>
                    <SelectItem value="DEMO">Demo Project</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="votes">Sort by Votes</SelectItem>
                    <SelectItem value="date">Sort by Date</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total {filteredSubmissions.length} works</p>
                </div>
              </div>
            </div>

            {/* Submissions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubmissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg line-clamp-2">{submission.title}</CardTitle>
                      <Badge className={`ml-2 ${getTypeColor(submission.type)}`}>
                        {getTypeIcon(submission.type)}
                        <span className="ml-1">
                          {submission.type === 'PAPER' ? 'Paper' :
                           submission.type === 'POSTER' ? 'Poster' : 'Demo'}
                        </span>
                      </Badge>
                    </div>

                    {/* Abstract section */}
                    {submission.abstract && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">Abstract:</div>
                        <div className={`text-sm text-gray-600 ${isExpanded(submission.id) ? '' : 'line-clamp-3'}`}>
                          {submission.abstract}
                        </div>
                      </div>
                    )}

                    {/* Description section */}
                    {submission.description && (
                      <div className="mb-2">
                        <div className="text-sm font-medium text-gray-700 mb-1">Description:</div>
                        <div className={`text-sm text-gray-600 ${isExpanded(submission.id) ? '' : 'line-clamp-2'}`}>
                          {submission.description}
                        </div>
                      </div>
                    )}

                    {/* Expand/Collapse button */}
                    {(submission.abstract || submission.description) && (
                      <button
                        onClick={() => toggleCardExpansion(submission.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 mt-1 focus:outline-none"
                      >
                        {isExpanded(submission.id) ? 'Collapse ▲' : 'Expand more ▼'}
                      </button>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium">Author:</span>
                        <span className="ml-2">{submission.authorName}</span>
                        {submission.coAuthors && (
                          <span className="ml-1">et al.</span>
                        )}
                      </div>

                      {submission.keywords && (
                        <div className="flex flex-wrap gap-1">
                          {submission.keywords.split(',').map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {submission.fileUrl && (
                        <div className="text-sm">
                          <a
                            href={submission.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            📄 {submission.fileName}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold text-lg">{submission.voteCount}</span>
                          <span className="text-sm text-gray-600">votes</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleVote(submission.id)}
                          disabled={submission.hasVoted}
                          className={submission.hasVoted ? "bg-gray-300" : "bg-blue-600 hover:bg-blue-700"}
                        >
                          {submission.hasVoted ? 'Voted' : 'Vote'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredSubmissions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">No matching works found</div>
                <p className="text-gray-500 mt-2">Please try adjusting search criteria</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
                  Work Leaderboard
                </h3>
                <p className="text-gray-600 mt-2">Works with the most votes will have the opportunity to present in the final week</p>
              </div>

              <div className="p-6">
                {[...submissions]
                  .sort((a, b) => b.voteCount - a.voteCount)
                  .slice(0, 10)
                  .map((submission, index) => (
                    <div key={submission.id} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold text-lg">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{submission.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>Author: {submission.authorName}</span>
                            <Badge className={`text-xs ${getTypeColor(submission.type)}`}>
                              {submission.type === 'PAPER' ? 'Paper' :
                               submission.type === 'POSTER' ? 'Poster' : 'Demo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{submission.voteCount}</div>
                          <div className="text-sm text-gray-600">votes</div>
                        </div>
                        {index < 3 && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                            {index === 0 ? '🥇 Champion' : index === 1 ? '🥈 Runner-up' : '🥉 Third Place'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Voter Info Dialog */}
      <Dialog open={showVoterDialog} onOpenChange={setShowVoterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Information</DialogTitle>
            <DialogDescription>
              To prevent duplicate voting, please enter your student ID and name (each student can vote maximum 5 times)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="voter-student-id">Student ID</Label>
              <Input
                id="voter-student-id"
                placeholder="Enter your student ID"
                value={voterStudentId}
                onChange={(e) => setVoterStudentId(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="voter-name">Name</Label>
              <Input
                id="voter-name"
                placeholder="Enter your name"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowVoterDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVoterInfoSubmit}>
              Confirm Vote
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}