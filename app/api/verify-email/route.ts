import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const result = await DatabaseService.verifyEmail(token)

    if (result.success) {
      // Redirect to signin page with success message
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('verified', 'true')
      return NextResponse.redirect(redirectUrl)
    } else {
      // Redirect to signin page with error message
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('verification_error', encodeURIComponent(result.error || 'Verification failed'))
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.error('Verification error:', error)
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('verification_error', 'An error occurred')
    return NextResponse.redirect(redirectUrl)
  }
}
