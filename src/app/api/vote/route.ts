import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, voterStudentId, voterName } = body;

    if (!submissionId || !voterStudentId || !voterName) {
      return NextResponse.json(
        { error: 'Submission ID, voter student ID, and voter name are required' },
        { status: 400 }
      );
    }

    // Find or create voter
    let voter = await db.user.findFirst({
      where: { studentId: voterStudentId }
    });

    if (!voter) {
      voter = await db.user.create({
        data: {
          email: `${voterStudentId}@student.edu`, // Generate placeholder email
          name: voterName,
          studentId: voterStudentId
        }
      });
    }

    // Check if already voted for this submission
    const existingVote = await db.vote.findUnique({
      where: {
        voterId_submissionId: {
          voterId: voter.id,
          submissionId: submissionId
        }
      }
    });

    if (existingVote) {
      return NextResponse.json(
        { error: '您已经为这个作品投过票了' },
        { status: 400 }
      );
    }

    // Check total votes for this voter (max 5 votes)
    const totalVotes = await db.vote.count({
      where: { voterId: voter.id }
    });

    if (totalVotes >= 5) {
      return NextResponse.json(
        { error: '您的票数已用完！每位同学最多可以投5票。' },
        { status: 400 }
      );
    }

    // Create vote
    const vote = await db.vote.create({
      data: {
        voterId: voter.id,
        voterStudentId: voterStudentId,
        submissionId: submissionId
      }
    });

    // Update vote count
    await db.submission.update({
      where: { id: submissionId },
      data: {
        voteCount: {
          increment: 1
        }
      }
    });

    const remainingVotes = 5 - totalVotes - 1; // -1 for the current vote

    return NextResponse.json({ 
      message: 'Vote recorded successfully',
      remainingVotes 
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}