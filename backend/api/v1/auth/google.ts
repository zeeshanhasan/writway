// Google OAuth redirect endpoint
export default async function handler(_req: any, res: any) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'https://api.writway.com/api/v1/auth/callback';
    
    if (!clientId) {
      return res.status(500).json({
        success: false,
        data: null,
        error: {
          code: 'MISSING_CONFIG',
          message: 'Google OAuth not configured'
        }
      });
    }

    // Redirect to Google OAuth consent screen
    const scopes = ['profile', 'email'];
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    })}`;

    return res.redirect(302, googleAuthUrl);
  } catch (error) {
    console.error('Google OAuth redirect error:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

