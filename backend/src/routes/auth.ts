import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import * as passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { authService } from '../services/auth.service';

export const router = Router();

// Configure Google OAuth strategy
console.log('Configuring Google OAuth strategy:', {
  hasClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  hasCallbackUrl: !!process.env.GOOGLE_CALLBACK_URL,
  callbackUrl: process.env.GOOGLE_CALLBACK_URL
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || ''
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google strategy callback executed');
    console.log('Profile received:', { id: profile.id, email: profile.emails?.[0]?.value });
    
    const { id: googleId, emails, displayName, photos } = profile;
    const email = emails?.[0]?.value;
    const name = displayName;
    const image = photos?.[0]?.value;

    if (!email) {
      console.log('Error: No email provided by Google');
      return done(new Error('Email not provided by Google'), undefined);
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { googleId },
      include: {
        Tenant: {
          include: {
            Plan: true
          }
        }
      }
    });

    // If user doesn't exist, create them
    if (!user) {
      // Get or create Free plan
      let freePlan = await prisma.plan.findUnique({
        where: { name: 'Free' }
      });

      if (!freePlan) {
        freePlan = await prisma.plan.create({
          data: {
            name: 'Free',
            priceMonthly: 0,
            seatLimit: 1,
            clientLimit: 5,
            hasTrial: false,
            features: {
              basicCRM: true,
              emailIntegration: true,
              standardSupport: true
            }
          }
        });
      }

      // Create tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: null,
          planId: freePlan.id,
          isOnboardingComplete: false
        }
      });

      // Create user
      user = await prisma.user.create({
        data: {
          googleId,
          email,
          name,
          image,
          role: 'OWNER',
          tenantId: tenant.id
        },
        include: {
          Tenant: {
            include: {
              Plan: true
            }
          }
        }
      });
    }

    return done(null, user);
  } catch (error) {
    return done(error as Error, undefined);
  }
}));

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

router.get('/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.CORS_ORIGIN}/auth/login`,
    session: false
  }),
  async (req: Request, res: Response) => {
    try {
      console.log('OAuth callback reached');
      console.log('User from passport:', req.user ? 'exists' : 'null');
      
      const user = req.user as any;
      
      if (!user) {
        console.log('No user found, redirecting to login');
        return res.redirect(`${process.env.CORS_ORIGIN}/auth/login?error=auth_failed`);
      }
      
      console.log('User found, generating tokens for:', user.email);

      // Generate JWT tokens
      const tokens = authService.generateTokens(user.id, user.tenantId, user.role);

      // Store refresh token in database
      const hashedRefreshToken = authService.hashToken(tokens.refreshToken);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      // TODO: Store refresh token in database when RefreshToken model is added
      // await prisma.refreshToken.create({
      //   data: {
      //     tokenHash: hashedRefreshToken,
      //     userId: user.id,
      //     expiresAt
      //   }
      // });

      // Set tokens in httpOnly cookies
      // Use sameSite='none' for cross-origin, requires secure=true in production
      console.log('Setting cookies with domain:', process.env.COOKIE_DOMAIN);
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: true, // Always use secure for sameSite=none
        sameSite: 'none',
        domain: process.env.COOKIE_DOMAIN || undefined,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: true, // Always use secure for sameSite=none
        sameSite: 'none',
        domain: process.env.COOKIE_DOMAIN || undefined,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Redirect based on onboarding status
      const corsOrigin = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:3000';
      console.log('Redirecting to:', user.Tenant.isOnboardingComplete ? `${corsOrigin}/dashboard` : `${corsOrigin}/auth/welcome`);
      
      if (!user.Tenant.isOnboardingComplete) {
        return res.redirect(`${corsOrigin}/auth/welcome`);
      } else {
        return res.redirect(`${corsOrigin}/dashboard`);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.CORS_ORIGIN}/auth/login?error=callback_error`);
    }
  }
);

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // TODO: Revoke refresh token in database
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      const hashedToken = authService.hashToken(refreshToken);
      // await prisma.refreshToken.update({
      //   where: { tokenHash: hashedToken },
      //   data: { revokedAt: new Date() }
      // });
    }

    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
      error: null
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error during logout'
      }
    });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '') || req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided'
        }
      });
    }

    const decoded = authService.verifyAccessToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        Tenant: {
          include: {
            Plan: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role
        },
        tenant: {
          id: user.Tenant.id,
          name: user.Tenant.name,
          isOnboardingComplete: user.Tenant.isOnboardingComplete,
          plan: user.Tenant.Plan
        }
      },
      error: null
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No refresh token provided'
        }
      });
    }

    // Verify refresh token
    const decoded = authService.verifyRefreshToken(refreshToken);

    // TODO: Check if refresh token is revoked
    // const hashedToken = authService.hashToken(refreshToken);
    // const storedToken = await prisma.refreshToken.findUnique({
    //   where: { tokenHash: hashedToken }
    // });
    // if (!storedToken || storedToken.revokedAt) {
    //   return res.status(401).json({...});
    // }

    // Generate new tokens
    const tokens = authService.generateTokens(decoded.userId, decoded.tenantId, decoded.role);

    // Store new refresh token
    const hashedRefreshToken = authService.hashToken(tokens.refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // TODO: Revoke old and store new refresh token
    // await prisma.refreshToken.update({...});

    // Set new tokens
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      data: { message: 'Tokens refreshed' },
      error: null
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid refresh token'
      }
    });
  }
});

