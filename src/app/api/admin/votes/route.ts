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

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request)

    const votes = await prisma.vote.findMany({
      include: {
        voter: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true
          }
        },
        submission: {
          select: {
            id: true,
            title: true,
            authorName: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(votes)

  } catch (error) {
    console.error('Votes GET error:', error)
    if (error instanceof Error && (error.message === '未授权' || error.message === '权限不足')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '未授权' ? 401 : 403 }
      )
    }
    return NextResponse.json(
      { error: '获取投票列表失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await verifyAdmin(request)

    // 删除所有投票记录
    await prisma.vote.deleteMany()

    // 重置所有作品的投票数
    await prisma.submission.updateMany({
      data: { voteCount: 0 }
    })

    return NextResponse.json({ message: '所有投票已清空' })

  } catch (error) {
    console.error('Votes DELETE error:', error)
    if (error instanceof Error && (error.message === '未授权' || error.message === '权限不足')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '未授权' ? 401 : 403 }
      )
    }
    return NextResponse.json(
      { error: '清空投票失败' },
      { status: 500 }
    )
  }
}