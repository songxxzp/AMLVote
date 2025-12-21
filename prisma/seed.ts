import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check if sample data already exists
  const existingSubmissionCount = await prisma.submission.count();

  if (existingSubmissionCount > 0) {
    console.log(`Found ${existingSubmissionCount} existing submissions. Skipping sample data creation.`);
    return;
  }

  console.log('No existing data found. Creating sample data...');

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'zhang.san@university.edu' },
    update: {},
    create: {
      email: 'zhang.san@university.edu',
      name: '张三',
      studentId: '2021001'
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'li.si@university.edu' },
    update: {},
    create: {
      email: 'li.si@university.edu',
      name: '李四',
      studentId: '2021002'
    },
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'wang.wu@university.edu' },
    update: {},
    create: {
      email: 'wang.wu@university.edu',
      name: '王五',
      studentId: '2021003'
    },
  })

  const user4 = await prisma.user.upsert({
    where: { email: 'zhao.liu@university.edu' },
    update: {},
    create: {
      email: 'zhao.liu@university.edu',
      name: '赵六',
      studentId: '2021004'
    },
  })

  const user5 = await prisma.user.upsert({
    where: { email: 'qian.qi@university.edu' },
    update: {},
    create: {
      email: 'qian.qi@university.edu',
      name: '钱七',
      studentId: '2021005'
    },
  })

  // Create sample submissions
  const submission1 = await prisma.submission.create({
    data: {
      title: '基于深度学习的医学图像分割算法研究',
      description: '提出了一种新的深度学习模型用于医学图像的精确分割，在多个数据集上取得了state-of-the-art的性能。',
      type: 'PAPER',
      authorName: '张三',
      authorEmail: 'zhang.san@university.edu',
      authorStudentId: '2021001',
      coAuthors: '李四, 王五',
      coAuthorStudentIds: '2021002,2021003',
      abstract: '本研究提出了一种基于U-Net架构改进的医学图像分割算法，通过引入注意力机制和多尺度特征融合，显著提升了分割精度。实验结果表明，在MICCAI 2023的多个挑战数据集上，我们的方法相比现有方法提升了5-8%的Dice系数。',
      keywords: '深度学习, 医学图像, 图像分割, U-Net, 注意力机制',
      voteCount: 28,
      authorId: user1.id,
    },
  })

  const submission2 = await prisma.submission.create({
    data: {
      title: '智能交通系统中的车辆检测与跟踪',
      description: '设计了一个实时车辆检测和跟踪系统，能够处理复杂的交通场景。',
      type: 'POSTER',
      authorName: '李四',
      authorEmail: 'li.si@university.edu',
      authorStudentId: '2021002',
      abstract: '本研究设计了一个基于YOLOv5的实时车辆检测和跟踪系统，能够在复杂交通环境下实现高精度的车辆识别和跟踪。系统采用了多目标跟踪算法，并针对夜间和恶劣天气条件进行了优化。',
      keywords: '计算机视觉, 智能交通, YOLO, 目标跟踪',
      voteCount: 22,
      authorId: user2.id,
    },
  })

  const submission3 = await prisma.submission.create({
    data: {
      title: '基于区块链的供应链管理系统',
      description: '利用区块链技术构建透明可信的供应链管理平台，确保数据不可篡改。',
      type: 'DEMO',
      authorName: '王五',
      authorEmail: 'wang.wu@university.edu',
      authorStudentId: '2021003',
      coAuthors: '赵六',
      coAuthorStudentIds: '2021004',
      abstract: '本项目基于区块链技术构建了一个去中心化的供应链管理系统，确保了数据的透明性和不可篡改性。系统采用智能合约实现自动化业务流程，并提供了友好的Web界面供用户使用。',
      keywords: '区块链, 供应链, 智能合约, 去中心化',
      voteCount: 35,
      authorId: user3.id,
    },
  })

  const submission4 = await prisma.submission.create({
    data: {
      title: '自然语言处理在情感分析中的应用',
      description: '研究了BERT模型在中文情感分析任务上的表现，并提出改进方法。',
      type: 'PAPER',
      authorName: '赵六',
      authorEmail: 'zhao.liu@university.edu',
      authorStudentId: '2021004',
      abstract: '本文研究了BERT模型在中文情感分析任务上的表现，并提出了一种结合领域自适应的改进方法。通过在多个中文情感数据集上的实验，证明了我们方法的有效性。',
      keywords: '自然语言处理, 情感分析, BERT, 领域自适应',
      voteCount: 18,
      authorId: user4.id,
    },
  })

  const submission5 = await prisma.submission.create({
    data: {
      title: '增强现实技术在教育中的应用研究',
      description: '开发了基于AR的交互式学习平台，提升了学生的学习体验。',
      type: 'POSTER',
      authorName: '钱七',
      authorEmail: 'qian.qi@university.edu',
      authorStudentId: '2021005',
      coAuthors: '孙八',
      coAuthorStudentIds: '2021006',
      abstract: '本研究开发了一个基于增强现实技术的交互式学习平台，主要面向K12教育。通过将抽象概念可视化，学生可以更直观地理解复杂知识点。系统支持多学科内容，包括数学、物理、化学等。',
      keywords: '增强现实, 教育技术, 交互式学习, K12教育',
      voteCount: 31,
      authorId: user5.id,
    },
  })

  // Create some sample votes
  await prisma.vote.createMany({
    data: [
      { voterId: user2.id, submissionId: submission1.id },
      { voterId: user3.id, submissionId: submission1.id },
      { voterId: user1.id, submissionId: submission2.id },
      { voterId: user3.id, submissionId: submission2.id },
      { voterId: user1.id, submissionId: submission3.id },
      { voterId: user2.id, submissionId: submission3.id },
      { voterId: user2.id, submissionId: submission4.id },
      { voterId: user1.id, submissionId: submission5.id },
      { voterId: user3.id, submissionId: submission5.id },
    ],
  })

  console.log(`Sample data created successfully! Created 5 submissions with sample users and votes.`);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })