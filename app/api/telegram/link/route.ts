import { NextRequest, NextResponse } from 'next/server';
import { telegramStorage } from '@/lib/telegram-storage';

export const dynamic = 'force-dynamic';

// Generate a new linking code
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userName } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check if user is already linked
    const existingLink = telegramStorage.getUserLink(userId);
    if (existingLink) {
      return NextResponse.json(
        { 
          error: 'Account already linked',
          telegramId: existingLink.telegramId,
          linkedAt: existingLink.linkedAt
        },
        { status: 400 }
      );
    }

    // Generate new linking code
    const code = telegramStorage.generateLinkingCode(userId, userName || 'customer');
    const linkingCodeInfo = telegramStorage.getLinkingCodeInfo(code);

    if (!linkingCodeInfo) {
      return NextResponse.json(
        { error: 'Failed to generate linking code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code: linkingCodeInfo.code,
      expiresAt: linkingCodeInfo.expiresAt.toISOString(),
      expiresIn: Math.floor((linkingCodeInfo.expiresAt.getTime() - Date.now()) / 1000), // seconds
    });
  } catch (error) {
    console.error('Error generating linking code:', error);
    return NextResponse.json(
      { error: 'Failed to generate linking code' },
      { status: 500 }
    );
  }
}

// Check linking code status or get linked account info
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const code = searchParams.get('code');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // If code provided, check its status
    if (code) {
      const linkingCode = telegramStorage['linkingCodes'].get(code.toUpperCase());
      
      if (!linkingCode) {
        return NextResponse.json({ valid: false, reason: 'not_found' });
      }

      if (linkingCode.expiresAt < new Date()) {
        return NextResponse.json({ valid: false, reason: 'expired' });
      }

      if (linkingCode.used) {
        return NextResponse.json({ valid: false, reason: 'already_used' });
      }

      return NextResponse.json({
        valid: true,
        expiresAt: linkingCode.expiresAt.toISOString(),
        expiresIn: Math.floor((linkingCode.expiresAt.getTime() - Date.now()) / 1000),
      });
    }

    // Otherwise, return linked account info
    const userLink = telegramStorage.getUserLink(userId);

    if (!userLink) {
      return NextResponse.json({ linked: false });
    }

    return NextResponse.json({
      linked: true,
      telegramId: userLink.telegramId,
      telegramUsername: userLink.username,
      telegramFirstName: userLink.firstName,
      linkedAt: userLink.linkedAt.toISOString(),
      lastActive: userLink.lastActive.toISOString(),
      notifications: userLink.notifications,
    });
  } catch (error) {
    console.error('Error checking link status:', error);
    return NextResponse.json(
      { error: 'Failed to check link status' },
      { status: 500 }
    );
  }
}

// Unlink Telegram account
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const success = telegramStorage.unlinkUser(userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Account not linked' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlinking account:', error);
    return NextResponse.json(
      { error: 'Failed to unlink account' },
      { status: 500 }
    );
  }
}
