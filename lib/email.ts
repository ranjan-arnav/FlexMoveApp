// Email Service using Supabase Auth
// Uses Supabase's built-in email service to send verification emails

import { createClient } from '@supabase/supabase-js'

// Create admin client with service role key for sending emails
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/verify-email?token=${verificationToken}`

  try {
    // Use Supabase Auth's built-in invite user functionality
    // This will send an email using Supabase's email templates
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: verificationUrl,
      data: {
        name: name,
        verification_token: verificationToken
      }
    })

    if (error) {
      console.error('❌ Email sending failed:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Verification email sent to:', email)
    return { success: true, data }
  } catch (error: any) {
    console.error('❌ Email sending failed:', error)
    return { success: false, error: error.message }
  }
}

