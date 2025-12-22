import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('未授权')
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, JWT_SECRET) as any

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  })

  if (!user || !user.isAdmin) {
    throw new Error('权限不足')
  }

  return user
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await verifyAdmin(request)
    const data = await request.json()
    const { isAdmin } = data

    // 防止管理员取消自己的管理员权限
    if (params.id === currentUser.id && !isAdmin) {
      return NextResponse.json(
        { error: '不能取消自己的管理员权限' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { isAdmin },
      include: {
        _count: {
          select: {
            submissions: true,
            votes: true
          }
        }
      }
    })

    return NextResponse.json(updatedUser)

  } catch (error) {
    console.error('Toggle admin error:', error)
    if (error instanceof Error && (error.message === '未授权' || error.message === '权限不足')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '未授权' ? 401 : 403 }
      )
    }
    return NextResponse.json(
      { error: '切换用户权限失败' },
      { status: 500 }
    )
  }
}