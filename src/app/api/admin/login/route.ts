import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const ADMIN_EMAIL = 'zhipuai'
const ADMIN_PASSWORD = 'aminer'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // 验证管理员凭据
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    // 检查管理员用户是否存在
    let adminUser = await prisma.user.findFirst({
      where: { email: ADMIN_EMAIL + '@admin.local' }
    })

    // 如果不存在，创建管理员用户
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL + '@admin.local',
          name: '系统管理员',
          isAdmin: true,
          studentId: 'ADMIN001'
        }
      })
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        userId: adminUser.id,
        email: adminUser.email,
        isAdmin: true
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        isAdmin: adminUser.isAdmin
      }
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    )
  }
}