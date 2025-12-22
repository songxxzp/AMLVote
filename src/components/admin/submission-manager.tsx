'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Download, Eye, Upload } from 'lucide-react'
import { submissionTypes } from '@/lib/constants'

interface Submission {
  id: string
  title: string
  description?: string
  type: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
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
  updatedAt: string
}

interface SubmissionManagerProps {
  onDataChange?: () => void
}

export function SubmissionManager({ onDataChange }: SubmissionManagerProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
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
    keywords: '',
    isPresented: false
  })

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsCreateDialogOpen(false)
        resetForm()
        fetchSubmissions()
        onDataChange?.()
      }
    } catch (error) {
      console.error('Failed to create submission:', error)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSubmission) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/submissions/${editingSubmission.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsEditDialogOpen(false)
        setEditingSubmission(null)
        resetForm()
        fetchSubmissions()
        onDataChange?.()
      }
    } catch (error) {
      console.error('Failed to update submission:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchSubmissions()
        onDataChange?.()
      }
    } catch (error) {
      console.error('Failed to delete submission:', error)
    }
  }

  const resetForm = () => {
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
      keywords: '',
      isPresented: false
    })
  }

  const startEdit = (submission: Submission) => {
    setEditingSubmission(submission)
    setFormData({
      title: submission.title,
      description: submission.description || '',
      type: submission.type,
      authorName: submission.authorName,
      authorEmail: submission.authorEmail,
      authorStudentId: submission.authorStudentId || '',
      coAuthors: submission.coAuthors || '',
      coAuthorStudentIds: submission.coAuthorStudentIds || '',
      abstract: submission.abstract || '',
      keywords: submission.keywords || '',
      isPresented: submission.isPresented
    })
    setIsEditDialogOpen(true)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>作品管理</CardTitle>
              <CardDescription>管理所有提交的作品</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加作品
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>创建新作品</DialogTitle>
                  <DialogDescription>填写作品信息</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">作品标题</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">作品类型</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {submissionTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">作品描述</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="authorName">作者姓名</Label>
                      <Input
                        id="authorName"
                        value={formData.authorName}
                        onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authorEmail">作者邮箱</Label>
                      <Input
                        id="authorEmail"
                        type="email"
                        value={formData.authorEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, authorEmail: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="abstract">摘要</Label>
                    <Textarea
                      id="abstract"
                      value={formData.abstract}
                      onChange={(e) => setFormData(prev => ({ ...prev, abstract: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">关键词</Label>
                    <Input
                      id="keywords"
                      value={formData.keywords}
                      onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                      placeholder="用逗号分隔多个关键词"
                    />
                  </div>
                  <Button type="submit" className="w-full">创建作品</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>作者</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>投票数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{submission.title}</div>
                      {submission.fileName && (
                        <div className="text-sm text-gray-500">{submission.fileName}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{submission.authorName}</div>
                      <div className="text-sm text-gray-500">{submission.authorEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {submissionTypes.find(t => t.value === submission.type)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{submission.voteCount}</TableCell>
                  <TableCell>
                    <Badge variant={submission.isPresented ? "default" : "secondary"}>
                      {submission.isPresented ? '已展示' : '未展示'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(submission)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {submission.fileUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(submission.fileUrl, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除作品 "{submission.title}" 吗？此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(submission.id)}>
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑作品</DialogTitle>
            <DialogDescription>修改作品信息</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">作品标题</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">作品类型</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {submissionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">作品描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-authorName">作者姓名</Label>
                <Input
                  id="edit-authorName"
                  value={formData.authorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-authorEmail">作者邮箱</Label>
                <Input
                  id="edit-authorEmail"
                  type="email"
                  value={formData.authorEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorEmail: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-abstract">摘要</Label>
              <Textarea
                id="edit-abstract"
                value={formData.abstract}
                onChange={(e) => setFormData(prev => ({ ...prev, abstract: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-keywords">关键词</Label>
              <Input
                id="edit-keywords"
                value={formData.keywords}
                onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="用逗号分隔多个关键词"
              />
            </div>
            <Button type="submit" className="w-full">更新作品</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}