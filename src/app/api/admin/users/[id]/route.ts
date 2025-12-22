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
    const { isAdmin } = data

    // 防止管理员取消自己的管理员权限
    const currentUser = await verifyAdmin(request)
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
    console.error('User PUT error:', error)
    if (error instanceof Error && (error.message === '未授权' || error.message === '权限不足')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '未授权' ? 401 : 403 }
      )
    }
    return NextResponse.json(
      { error: '更新用户失败' },
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

    // 防止管理员删除自己
    const currentUser = await verifyAdmin(request)
    if (params.id === currentUser.id) {
      return NextResponse.json(
        { error: '不能删除自己的账户' },
        { status: 400 }
      )
    }

    // 检查用户是否存在且不是管理员
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    if (targetUser.isAdmin) {
      return NextResponse.json(
        { error: '不能删除管理员账户' },
        { status: 400 }
      )
    }

    // 删除相关的投票记录
    await prisma.vote.deleteMany({
      where: { voterId: params.id }
    })

    // 删除用户的作品（这会级联删除相关的投票）
    await prisma.submission.deleteMany({
      where: { authorId: params.id }
    })

    // 删除用户
    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: '用户删除成功' })

  } catch (error) {
    console.error('User DELETE error:', error)
    if (error instanceof Error && (error.message === '未授权' || error.message === '权限不足')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '未授权' ? 401 : 403 }
      )
    }
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    )
  }
}