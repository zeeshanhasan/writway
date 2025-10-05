const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../config/prisma');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { id: googleId, emails, displayName, photos } = profile;
    const email = emails[0].value;
    const name = displayName;
    const image = photos[0]?.value;

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
          name: null, // Will be filled during onboarding
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
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        Tenant: {
          include: {
            Plan: true
          }
        }
      }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
