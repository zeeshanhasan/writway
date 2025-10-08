import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { z } from 'zod';

export const router = Router();

// Validation schema for tenant onboarding completion
const completeOnboardingSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  address: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  businessType: z.string().optional(),
  practiceAreas: z.string().optional(),
  activeClients: z.number().int().min(0).optional(),
  goals: z.string().optional()
});

// Complete tenant onboarding
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userTenantId = user?.tenantId;

    // Verify user owns this tenant
    if (id !== userTenantId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update your own tenant'
        }
      });
    }

    // Validate input
    const validatedData = completeOnboardingSchema.parse(req.body);

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...validatedData,
        isOnboardingComplete: true,
        updatedAt: new Date()
      },
      include: {
        Plan: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        tenant: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          address: updatedTenant.address,
          country: updatedTenant.country,
          city: updatedTenant.city,
          businessType: updatedTenant.businessType,
          practiceAreas: updatedTenant.practiceAreas,
          activeClients: updatedTenant.activeClients,
          goals: updatedTenant.goals,
          isOnboardingComplete: updatedTenant.isOnboardingComplete,
          plan: updatedTenant.Plan,
          users: updatedTenant.users
        }
      },
      error: null
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }

    console.error('Tenant onboarding completion error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while completing onboarding'
      }
    });
  }
});

// Get tenant details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userTenantId = user?.tenantId;

    // Verify user owns this tenant
    if (id !== userTenantId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only access your own tenant'
        }
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        Plan: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Tenant not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          address: tenant.address,
          country: tenant.country,
          city: tenant.city,
          businessType: tenant.businessType,
          practiceAreas: tenant.practiceAreas,
          activeClients: tenant.activeClients,
          goals: tenant.goals,
          isOnboardingComplete: tenant.isOnboardingComplete,
          plan: tenant.Plan,
          users: tenant.users,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt
        }
      },
      error: null
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching tenant details'
      }
    });
  }
});

// Update tenant settings
router.patch('/:id/settings', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userTenantId = user?.tenantId;

    // Verify user owns this tenant and has admin/owner role
    if (id !== userTenantId || !['OWNER', 'ADMIN'].includes(user?.role)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update tenant settings'
        }
      });
    }

    const validatedData = completeOnboardingSchema.partial().parse(req.body);

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        Plan: true
      }
    });

    res.json({
      success: true,
      data: {
        tenant: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          address: updatedTenant.address,
          country: updatedTenant.country,
          city: updatedTenant.city,
          businessType: updatedTenant.businessType,
          practiceAreas: updatedTenant.practiceAreas,
          activeClients: updatedTenant.activeClients,
          goals: updatedTenant.goals,
          isOnboardingComplete: updatedTenant.isOnboardingComplete,
          plan: updatedTenant.Plan
        }
      },
      error: null
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }

    console.error('Update tenant settings error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating tenant settings'
      }
    });
  }
});

