import { NextResponse } from "next/server";
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
      orderBy: [
        { voteCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}