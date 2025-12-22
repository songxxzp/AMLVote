import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // 验证用户是否为管理员
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin
      }
    })

  } catch (error) {
    console.error('Admin verification error:', error)
    return NextResponse.json(
      { error: '无效token' },
      { status: 401 }
    )
  }
}