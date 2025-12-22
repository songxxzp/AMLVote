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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await verifyAdmin(request)

    // 获取要删除的投票记录
    const vote = await prisma.vote.findUnique({
      where: { id: params.id },
      include: { submission: true }
    })

    if (!vote) {
      return NextResponse.json(
        { error: '投票记录不存在' },
        { status: 404 }
      )
    }

    // 删除投票记录
    await prisma.vote.delete({
      where: { id: params.id }
    })

    // 更新作品的投票数
    await prisma.submission.update({
      where: { id: vote.submissionId },
      data: { voteCount: Math.max(0, vote.submission.voteCount - 1) }
    })

    return NextResponse.json({ message: '投票删除成功' })

  } catch (error) {
    console.error('Vote DELETE error:', error)
    if (error instanceof Error && (error.message === '未授权' || error.message === '权限不足')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '未授权' ? 401 : 403 }
      )
    }
    return NextResponse.json(
      { error: '删除投票失败' },
      { status: 500 }
    )
  }
}