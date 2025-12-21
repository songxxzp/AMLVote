import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voterStudentId } = body;

    if (!voterStudentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Find voter by student ID
    const voter = await db.user.findFirst({
      where: { studentId: voterStudentId }
    });

    if (!voter) {
      return NextResponse.json({ remainingVotes: 5 });
    }

    // Count total votes for this voter
    const totalVotes = await db.vote.count({
      where: { voterId: voter.id }
    });

    const remainingVotes = Math.max(0, 5 - totalVotes);

    return NextResponse.json({ remainingVotes });
  } catch (error) {
    console.error('Error checking remaining votes:', error);
    return NextResponse.json(
      { error: 'Failed to check remaining votes' },
      { status: 500 }
    );
  }
}