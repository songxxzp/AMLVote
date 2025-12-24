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

export default function ChinesePage() {
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
      alert('您的票数已用完！每位同学最多可以投5票。')
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
        alert(error.error || '投票失败')
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

      alert('投票成功！')
    } catch (error) {
      console.error('Error voting:', error)
      alert('投票失败，请重试')
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
      alert('请填写必填字段（标题、作者姓名、学号、邮箱）')
      return
    }

    setUploading(true)
    try {
      let fileData = null
      if (selectedFile) {
        fileData = await handleFileUpload()
        if (!fileData) {
          alert('文件上传失败')
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
      alert('作品提交成功！')
    } catch (error) {
      console.error('Error submitting:', error)
      alert('提交失败，请重试')
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
          <p className="text-gray-600">加载中...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">学术作品投票平台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="您的学号"
                  value={voterStudentId}
                  onChange={(e) => setVoterStudentId(e.target.value)}
                  className="w-32"
                />
                <Input
                  type="text"
                  placeholder="您的姓名"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  className="w-32"
                />
                <div className="text-sm font-medium text-orange-600">
                  剩余票数: {remainingVotes}/5
                </div>
              </div>
              <Link href="/en">
                <Button variant="outline" size="sm">
                  <Globe className="w-4 h-4 mr-2" />
                  English
                </Button>
              </Link>
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="w-4 h-4 mr-2" />
                    上传作品
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>上传学术作品</DialogTitle>
                    <DialogDescription>
                      请填写作品信息并上传相关文件
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid gap-2">
                      <Label htmlFor="title">作品标题 *</Label>
                      <Input
                        id="title"
                        placeholder="请输入作品标题"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">作品类型</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择作品类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAPER">学术论文</SelectItem>
                          <SelectItem value="POSTER">学术海报</SelectItem>
                          <SelectItem value="DEMO">演示项目</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="author">作者姓名 *</Label>
                      <Input
                        id="author"
                        placeholder="请输入作者姓名"
                        value={formData.authorName}
                        onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="studentId">作者学号 *</Label>
                      <Input
                        id="studentId"
                        placeholder="请输入作者学号"
                        value={formData.authorStudentId}
                        onChange={(e) => setFormData(prev => ({ ...prev, authorStudentId: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">邮箱地址 *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="请输入邮箱地址"
                        value={formData.authorEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, authorEmail: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="coAuthors">合作作者</Label>
                      <Input
                        id="coAuthors"
                        placeholder="请输入合作作者姓名，用逗号分隔"
                        value={formData.coAuthors}
                        onChange={(e) => setFormData(prev => ({ ...prev, coAuthors: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="coAuthorStudentIds">合作作者学号</Label>
                      <Input
                        id="coAuthorStudentIds"
                        placeholder="请输入合作作者学号，用逗号分隔"
                        value={formData.coAuthorStudentIds}
                        onChange={(e) => setFormData(prev => ({ ...prev, coAuthorStudentIds: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">作品描述</Label>
                      <Textarea
                        id="description"
                        placeholder="请输入作品描述"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="abstract">摘要</Label>
                      <Textarea
                        id="abstract"
                        placeholder="请输入作品摘要"
                        rows={4}
                        value={formData.abstract}
                        onChange={(e) => setFormData(prev => ({ ...prev, abstract: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="keywords">关键词</Label>
                      <Input
                        id="keywords"
                        placeholder="请输入关键词，用逗号分隔"
                        value={formData.keywords}
                        onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="file">上传文件</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={uploading}>
                      {uploading ? '提交中...' : '提交作品'}
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
          <h2 className="text-4xl font-bold mb-4">欢迎来到学术作品投票平台</h2>
          <p className="text-xl mb-8">发现优秀的学术作品，为您喜爱的研究投票</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">参与投票</h3>
              <p>为您喜爱的学术作品投票，支持优秀研究</p>
            </div>
            <div className="text-center">
              <Upload className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">分享作品</h3>
              <p>上传您的论文、海报或演示项目</p>
            </div>
            <div className="text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">获得认可</h3>
              <p>获票最多的作品将有机会上台展示</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="submissions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="submissions">作品列表</TabsTrigger>
            <TabsTrigger value="leaderboard">排行榜</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="搜索作品、作者或关键词..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="作品类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全部类型</SelectItem>
                    <SelectItem value="PAPER">学术论文</SelectItem>
                    <SelectItem value="POSTER">学术海报</SelectItem>
                    <SelectItem value="DEMO">演示项目</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="排序方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="votes">按投票数排序</SelectItem>
                    <SelectItem value="date">按时间排序</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-center">
                  <p className="text-sm text-gray-600">共 {filteredSubmissions.length} 个作品</p>
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
                          {submission.type === 'PAPER' ? '论文' :
                           submission.type === 'POSTER' ? '海报' : '演示'}
                        </span>
                      </Badge>
                    </div>

                    {/* 摘要部分 */}
                    {submission.abstract && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">摘要:</div>
                        <div className={`text-sm text-gray-600 ${isExpanded(submission.id) ? '' : 'line-clamp-3'}`}>
                          {submission.abstract}
                        </div>
                      </div>
                    )}

                    {/* 描述部分 */}
                    {submission.description && (
                      <div className="mb-2">
                        <div className="text-sm font-medium text-gray-700 mb-1">简介:</div>
                        <div className={`text-sm text-gray-600 ${isExpanded(submission.id) ? '' : 'line-clamp-2'}`}>
                          {submission.description}
                        </div>
                      </div>
                    )}

                    {/* 展开/收起按钮 */}
                    {(submission.abstract || submission.description) && (
                      <button
                        onClick={() => toggleCardExpansion(submission.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 mt-1 focus:outline-none"
                      >
                        {isExpanded(submission.id) ? '收起 ▲' : '展开更多 ▼'}
                      </button>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium">作者:</span>
                        <span className="ml-2">{submission.authorName}</span>
                        {submission.coAuthors && (
                          <span className="ml-1">等</span>
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
                          <span className="text-sm text-gray-600">票</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleVote(submission.id)}
                          disabled={submission.hasVoted}
                          className={submission.hasVoted ? "bg-gray-300" : "bg-blue-600 hover:bg-blue-700"}
                        >
                          {submission.hasVoted ? '已投票' : '投票'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredSubmissions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">暂无匹配的作品</div>
                <p className="text-gray-500 mt-2">请尝试调整搜索条件</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
                  作品排行榜
                </h3>
                <p className="text-gray-600 mt-2">获票最多的作品将有机会在最后一周上台展示</p>
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
                            <span>作者: {submission.authorName}</span>
                            <Badge className={`text-xs ${getTypeColor(submission.type)}`}>
                              {submission.type === 'PAPER' ? '论文' :
                               submission.type === 'POSTER' ? '海报' : '演示'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{submission.voteCount}</div>
                          <div className="text-sm text-gray-600">票</div>
                        </div>
                        {index < 3 && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                            {index === 0 ? '🥇 冠军' : index === 1 ? '🥈 亚军' : '🥉 季军'}
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
            <DialogTitle>请输入您的信息</DialogTitle>
            <DialogDescription>
              为了防止重复投票，请输入您的学号和姓名（每位同学最多5票）
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="voter-student-id">学号</Label>
              <Input
                id="voter-student-id"
                placeholder="请输入您的学号"
                value={voterStudentId}
                onChange={(e) => setVoterStudentId(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="voter-name">姓名</Label>
              <Input
                id="voter-name"
                placeholder="请输入您的姓名"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowVoterDialog(false)}>
              取消
            </Button>
            <Button onClick={handleVoterInfoSubmit}>
              确认投票
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}