import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const router = Router();

// Create Stripe checkout session for plan upgrade
router.post('/upgrade', async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;
    const user = (req as any).user;
    const tenantId = user?.tenantId;

    if (!planId) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Plan ID is required'
        }
      });
    }

    // Verify plan exists
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Plan not found'
        }
      });
    }

    // Get current tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { Plan: true }
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

    // TODO: Implement Stripe checkout session creation
    // For now, return a mock response
    res.json({
      success: true,
      data: {
        checkoutUrl: `https://checkout.stripe.com/mock-session-${planId}`,
        message: 'Stripe integration coming soon'
      },
      error: null
    });
  } catch (error) {
    console.error('Plan upgrade error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while processing upgrade'
      }
    });
  }
});

// Stripe webhook handler
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'];
    
    // TODO: Implement Stripe webhook verification and processing
    // For now, just acknowledge the webhook
    console.log('Stripe webhook received');
    
    res.json({ 
      success: true,
      data: { received: true },
      error: null
    });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'WEBHOOK_ERROR',
        message: 'Webhook processing failed'
      }
    });
  }
});

// Get billing information
router.get('/info', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = user?.tenantId;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { Plan: true }
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
        billing: {
          currentPlan: tenant.Plan,
          trialEndsAt: tenant.trialEndsAt,
          isOnTrial: tenant.trialEndsAt ? new Date() < tenant.trialEndsAt : false
        }
      },
      error: null
    });
  } catch (error) {
    console.error('Get billing info error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching billing information'
      }
    });
  }
});

