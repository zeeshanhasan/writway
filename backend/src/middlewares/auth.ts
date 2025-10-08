import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { prisma } from '../config/prisma';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header or cookies
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

    // Verify token
    const decoded = authService.verifyAccessToken(token);

    // Get user with tenant information
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
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found'
        }
      });
    }

    // Attach user to request
    (req as any).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenant: user.Tenant
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
};

