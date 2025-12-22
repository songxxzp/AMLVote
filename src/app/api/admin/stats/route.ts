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

    // 获取统计数据
    const [userCount, submissionCount, voteCount] = await Promise.all([
      prisma.user.count(),
      prisma.submission.count(),
      prisma.vote.count()
    ])

    return NextResponse.json({
      users: userCount,
      submissions: submissionCount,
      votes: voteCount
    })

  } catch (error) {
    console.error('Stats API error:', error)
    if (error instanceof Error && (error.message === '未授权' || error.message === '权限不足')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '未授权' ? 401 : 403 }
      )
    }
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    )
  }
}