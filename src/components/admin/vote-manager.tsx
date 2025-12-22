'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { BarChart3, Download, Trash2, Users, FileText } from 'lucide-react'

interface Vote {
  id: string
  voterId: string
  voterStudentId?: string
  voter: {
    name?: string
    email: string
    studentId?: string
  }
  submissionId: string
  submission: {
    title: string
    authorName: string
    type: string
  }
  createdAt: string
}

interface VoteStats {
  totalVotes: number
  uniqueVoters: number
  submissionsWithVotes: number
  averageVotesPerSubmission: number
}

interface VoteManagerProps {
  onDataChange?: () => void
}

export function VoteManager({ onDataChange }: VoteManagerProps) {
  const [votes, setVotes] = useState<Vote[]>([])
  const [stats, setStats] = useState<VoteStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVotes()
    fetchStats()
  }, [])

  const fetchVotes = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/votes', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setVotes(data)
      }
    } catch (error) {
      console.error('Failed to fetch votes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/votes/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch vote stats:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/votes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchVotes()
        fetchStats()
        onDataChange?.()
      }
    } catch (error) {
      console.error('Failed to delete vote:', error)
    }
  }

  const handleClearAllVotes = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/votes', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchVotes()
        fetchStats()
        onDataChange?.()
      }
    } catch (error) {
      console.error('Failed to clear all votes:', error)
    }
  }

  const exportVotes = () => {
    const csvContent = [
      ['投票者', '投票者邮箱', '投票者学号', '作品标题', '作品作者', '作品类型', '投票时间'],
      ...votes.map(vote => [
        vote.voter.name || '未设置',
        vote.voter.email,
        vote.voterStudentId || vote.voter.studentId || '未设置',
        vote.submission.title,
        vote.submission.authorName,
        vote.submission.type,
        new Date(vote.createdAt).toLocaleString()
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `votes_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总投票数</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVotes}</div>
              <p className="text-xs text-muted-foreground">
                所有投票记录
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">投票用户</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueVoters}</div>
              <p className="text-xs text-muted-foreground">
                参与投票的唯一用户数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">被投票作品</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.submissionsWithVotes}</div>
              <p className="text-xs text-muted-foreground">
                获得投票的作品数量
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均票数</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageVotesPerSubmission.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                每个作品的平均投票数
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>投票管理</CardTitle>
              <CardDescription>管理所有投票记录</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={exportVotes}>
                <Download className="h-4 w-4 mr-2" />
                导出投票
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    清空所有投票
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认清空所有投票</AlertDialogTitle>
                    <AlertDialogDescription>
                      确定要清空所有投票记录吗？此操作无法撤销。
                      这将删除所有用户的投票数据，但不会删除作品或用户。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAllVotes}>
                      清空投票
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>投票者</TableHead>
                <TableHead>作品信息</TableHead>
                <TableHead>作品类型</TableHead>
                <TableHead>投票时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {votes.map((vote) => (
                <TableRow key={vote.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {vote.voter.name || '未设置姓名'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {vote.voter.email}
                      </div>
                      {vote.voterStudentId && (
                        <div className="text-xs text-blue-600">
                          学号: {vote.voterStudentId}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{vote.submission.title}</div>
                      <div className="text-sm text-gray-500">
                        作者: {vote.submission.authorName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {vote.submission.type === 'PAPER' && '论文'}
                      {vote.submission.type === 'POSTER' && '海报'}
                      {vote.submission.type === 'DEMO' && '演示'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(vote.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除投票</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要删除这条投票记录吗？
                            投票者: {vote.voter.name || vote.voter.email}
                            作品: {vote.submission.title}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(vote.id)}>
                            删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {votes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无投票记录
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}