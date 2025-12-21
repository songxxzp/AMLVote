import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

export async function GET() {
  try {
    const submissions = await db.submission.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        votes: {
          select: {
            id: true,
            voterId: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      type = 'PAPER',
      authorName,
      authorEmail,
      coAuthors,
      abstract,
      keywords,
      fileUrl,
      fileName,
      fileSize
    } = body;

    // Create or find user
    let user = await db.user.findUnique({
      where: { email: authorEmail }
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: authorEmail,
          name: authorName
        }
      });
    }

    const submission = await db.submission.create({
      data: {
        title,
        description,
        type,
        authorName,
        authorEmail,
        coAuthors,
        abstract,
        keywords,
        fileUrl,
        fileName,
        fileSize,
        authorId: user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}