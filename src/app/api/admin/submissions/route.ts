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

    const submissions = await prisma.submission.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(submissions)

  } catch (error) {
    console.error('Submissions GET error:', error)
    if (error instanceof Error && (error.message === '未授权' || error.message === '权限不足')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '未授权' ? 401 : 403 }
      )
    }
    return NextResponse.json(
      { error: '获取作品列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    // 查找或创建作者
    let author = await prisma.user.findUnique({
      where: { email: authorEmail }
    })

    if (!author) {
      author = await prisma.user.create({
        data: {
          email: authorEmail,
          name: authorName,
          studentId: authorStudentId,
          isAdmin: false
        }
      })
    }

    const submission = await prisma.submission.create({
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
        isPresented: isPresented || false,
        authorId: author.id
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
    console.error('Submissions POST error:', error)
    if (error instanceof Error && (error.message === '未授权' || error.message === '权限不足')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '未授权' ? 401 : 403 }
      )
    }
    return NextResponse.json(
      { error: '创建作品失败' },
      { status: 500 }
    )
  }
}