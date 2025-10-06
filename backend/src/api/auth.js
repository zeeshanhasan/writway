const express = require('express');
const passport = require('passport');
const { generateToken } = require('../middlewares/auth');
const prisma = require('../config/prisma');

const router = express.Router();

// Initialize passport
require('../config/passport');

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/callback', 
  passport.authenticate('google', { failureRedirect: `${process.env.CORS_ORIGIN}/auth/login` }),
  async (req, res) => {
    try {
      const user = req.user;
      
      // Generate JWT token
      const token = generateToken(user.id);
      
      // Store token in session
      req.session.token = token;
      req.session.userId = user.id;
      
      // Determine redirect based on onboarding status
      if (!user.Tenant.isOnboardingComplete) {
        return res.redirect(`${process.env.CORS_ORIGIN}/auth/welcome`);
      } else {
        return res.redirect(`${process.env.CORS_ORIGIN}/dashboard`);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.CORS_ORIGIN}/auth/login?error=callback_error`);
    }
  }
);

// Post-login logic endpoint
router.post('/post-login', async (req, res) => {
  try {
    const { googleId, email } = req.body;
    
    if (!googleId && !email) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Google ID or email is required'
      });
    }

    // Find user by Google ID or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email }
        ]
      },
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
        error: 'USER_NOT_FOUND',
        message: 'User not found. Please register first.',
        redirectTo: '/auth/register'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Determine redirect
    let redirectTo = '/dashboard';
    if (!user.Tenant.isOnboardingComplete) {
      redirectTo = '/auth/welcome';
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
        },
        token,
        redirectTo
      }
    });
  } catch (error) {
    console.error('Post-login error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An error occurred during login'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error during logout'
      });
    }
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Error destroying session'
        });
      }
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.session?.token;

    if (!token) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'No token provided'
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
        error: 'USER_NOT_FOUND',
        message: 'User not found'
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
      }
    });
  } catch (error) {
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token'
    });
  }
});

module.exports = router;
