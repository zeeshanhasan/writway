import { prisma } from '../../../../src/config/prisma';
import { authService } from '../../../../src/services/auth.service';

// Google OAuth callback endpoint
export default async function handler(req: any, res: any) {
  try {
    const { code, error: oauthError } = req.query;

    if (oauthError) {
      const corsOrigin = process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:3000';
      return res.redirect(`${corsOrigin}/auth/login?error=${oauthError}`);
    }

    if (!code) {
      const corsOrigin = process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:3000';
      return res.redirect(`${corsOrigin}/auth/login?error=no_code`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Get user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await profileResponse.json();

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: profile.email },
      include: { Tenant: true }
    });

    if (!user) {
      // Create new user and tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: profile.email.split('@')[0],
          isOnboardingComplete: false
        }
      });

      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          tenantId: tenant.id,
          role: 'OWNER'
        },
        include: { Tenant: true }
      });
    }

    // Generate JWT tokens
    const jwtTokens = authService.generateTokens(user.id, user.tenantId, user.role);

    // Set cookies
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
    
    res.setHeader('Set-Cookie', [
      `access_token=${jwtTokens.accessToken}; HttpOnly; Secure; SameSite=None; Domain=${cookieDomain}; Max-Age=900; Path=/`,
      `refresh_token=${jwtTokens.refreshToken}; HttpOnly; Secure; SameSite=None; Domain=${cookieDomain}; Max-Age=604800; Path=/`
    ]);

    // Redirect based on onboarding status
    const corsOrigin = process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:3000';
    const redirectUrl = !user.Tenant.isOnboardingComplete 
      ? `${corsOrigin}/auth/welcome`
      : `${corsOrigin}/dashboard`;

    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const corsOrigin = process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:3000';
    return res.redirect(`${corsOrigin}/auth/login?error=callback_error`);
  }
}

