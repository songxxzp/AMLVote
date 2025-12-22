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
    await verifyAdmin(request)

    const data = await request.json()
    const {
      title,
      description,
      type,
      authorName,
      authorEmail,
      authorStudentId,
      coAuthors,
      coAuthorStudentIds,
      abstract,
      keywords,
      isPresented
    } = data

    const submission = await prisma.submission.update({
      where: { id: params.id },
      data: {
        title,
        description,
        type,
        authorName,
        authorEmail,
        authorStudentId,
        coAuthors,
        coAuthorStudentIds,
        abstract,
        keywords,
        isPresented: isPresented || false
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true
          }
        }
      }
    })

    return NextResponse.json(submission)

  } catch (error) {
    console.error('Submission PUT error:', error)
    if (error instanceof Error && (error.message === '未授权' || error.message === '权限不足')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '未授权' ? 401 : 403 }
      )
    }
    return NextResponse.json(
      { error: '更新作品失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await verifyAdmin(request)

    // 删除相关的投票记录
    await prisma.vote.deleteMany({
      where: { submissionId: params.id }
    })

    // 删除作品
    await prisma.submission.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: '作品删除成功' })

  } catch (error) {
    console.error('Submission DELETE error:', error)
    if (error instanceof Error && (error.message === '未授权' || error.message === '权限不足')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '未授权' ? 401 : 403 }
      )
    }
    return NextResponse.json(
      { error: '删除作品失败' },
      { status: 500 }
    )
  }
}