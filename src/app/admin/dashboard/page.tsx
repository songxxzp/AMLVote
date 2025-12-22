'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, Vote, BarChart3, Plus, Download, Trash2, Edit, LogOut } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { SubmissionManager } from '@/components/admin/submission-manager'
import { UserManager } from '@/components/admin/user-manager'
import { VoteManager } from '@/components/admin/vote-manager'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    users: 0,
    submissions: 0,
    votes: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    fetchStats()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    try {
      const response = await fetch('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
      }
    } catch (error) {
      localStorage.removeItem('admin_token')
      router.push('/admin/login')
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">加载中...</div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">管理员控制台</h1>
            <p className="text-gray-600">管理系统数据、用户和投票</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总用户数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
              <p className="text-xs text-muted-foreground">
                注册用户总数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">作品提交</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.submissions}</div>
              <p className="text-xs text-muted-foreground">
                已提交的作品数量
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总投票数</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.votes}</div>
              <p className="text-xs text-muted-foreground">
                用户投票总数
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="submissions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="submissions">作品管理</TabsTrigger>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="votes">投票管理</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <SubmissionManager onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="users">
            <UserManager onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="votes">
            <VoteManager onDataChange={fetchStats} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}