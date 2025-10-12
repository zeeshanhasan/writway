// Get current user endpoint
export default async function handler(req: any, res: any) {
  // Dynamic imports from dist in production, src in development
  const isProd = process.env.NODE_ENV === 'production';
  const prismaModule = isProd 
    ? await import('../../../../dist/config/prisma')
    : await import('../../../../src/config/prisma');
  const jwt = isProd
    ? await import('jsonwebtoken')
    : await import('jsonwebtoken');

  const { prisma } = prismaModule;
  
  try {
    // Extract token from cookies
    const token = req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided'
        }
      });
    }

    // Verify JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string; tenantId: string; role: string };

    // Fetch user with tenant
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { Tenant: { include: { Plan: true } } }
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

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role
        },
        tenant: user.Tenant
      },
      error: null
    });
  } catch (error) {
    console.error('Auth me error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token'
        }
      });
    }

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

