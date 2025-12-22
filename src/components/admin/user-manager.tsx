'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Search, Shield, User, Trash2 } from 'lucide-react'

interface User {
  id: string
  email: string
  name?: string
  studentId?: string
  avatar?: string
  isAdmin: boolean
  createdAt: string
  updatedAt: string
  _count: {
    submissions: number
    votes: number
  }
}

interface UserManagerProps {
  onDataChange?: () => void
}

export function UserManager({ onDataChange }: UserManagerProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        setFilteredUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchUsers()
        onDataChange?.()
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const toggleAdminStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/users/${id}/toggle-admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAdmin: !currentStatus })
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to toggle admin status:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>用户管理</CardTitle>
          <CardDescription>管理所有注册用户</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索用户姓名、邮箱或学号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户信息</TableHead>
                <TableHead>学号</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>作品数</TableHead>
                <TableHead>投票数</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || user.email}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {user.name || '未设置姓名'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.studentId || '未设置'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {user.isAdmin ? (
                        <Badge variant="default" className="bg-blue-600">
                          <Shield className="w-3 h-3 mr-1" />
                          管理员
                        </Badge>
                      ) : (
                        <Badge variant="secondary">普通用户</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user._count.submissions}</TableCell>
                  <TableCell>{user._count.votes}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
                      >
                        {user.isAdmin ? '取消管理员' : '设为管理员'}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={user.isAdmin}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除用户</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除用户 "{user.name || user.email}" 吗？
                              此操作将同时删除该用户的所有作品和投票记录，且无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(user.id)}>
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
    </div>
  )
}