const express = require('express');
const prisma = require('../config/prisma');

const router = express.Router();

// Create Stripe checkout session for plan upgrade
router.post('/upgrade', async (req, res) => {
  try {
    const { planId } = req.body;
    const tenantId = req.user.tenantId;

    if (!planId) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Plan ID is required'
      });
    }

    // Verify plan exists
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Plan not found'
      });
    }

    // Get current tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { Plan: true }
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Tenant not found'
      });
    }

    // TODO: Implement Stripe checkout session creation
    // For now, return a mock response
    res.json({
      success: true,
      data: {
        checkoutUrl: `https://checkout.stripe.com/mock-session-${planId}`,
        message: 'Stripe integration coming soon'
      }
    });
  } catch (error) {
    console.error('Plan upgrade error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An error occurred while processing upgrade'
    });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    
    // TODO: Implement Stripe webhook verification and processing
    // For now, just acknowledge the webhook
    console.log('Stripe webhook received:', req.body);
    
    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({
      error: 'WEBHOOK_ERROR',
      message: 'Webhook processing failed'
    });
  }
});

// Get billing information
router.get('/info', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { Plan: true }
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: {
        billing: {
          currentPlan: tenant.Plan,
          trialEndsAt: tenant.trialEndsAt,
          isOnTrial: tenant.trialEndsAt && new Date() < tenant.trialEndsAt
        }
      }
    });
  } catch (error) {
    console.error('Get billing info error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An error occurred while fetching billing information'
    });
  }
});

module.exports = router;
