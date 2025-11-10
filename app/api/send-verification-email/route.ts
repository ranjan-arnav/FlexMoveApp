// API Route: Send Verification Email
// Server-side only - handles email sending via Supabase Auth

import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, name, token } = await request.json()

    // Validate input
    if (!email || !name || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send verification email (server-side only)
    const result = await sendVerificationEmail(email, name, token)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Error sending verification email:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
