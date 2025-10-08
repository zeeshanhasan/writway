import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const router = Router();

// Get all available plans
router.get('/list', async (_req: Request, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { priceMonthly: 'asc' }
    });

    res.json({
      success: true,
      data: {
        plans: plans.map(plan => ({
          id: plan.id,
          name: plan.name,
          priceMonthly: plan.priceMonthly,
          seatLimit: plan.seatLimit,
          clientLimit: plan.clientLimit,
          hasTrial: plan.hasTrial,
          trialDays: plan.trialDays,
          features: plan.features
        }))
      },
      error: null
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching plans'
      }
    });
  }
});

// Get plan by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({
      where: { id }
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

    res.json({
      success: true,
      data: {
        plan: {
          id: plan.id,
          name: plan.name,
          priceMonthly: plan.priceMonthly,
          seatLimit: plan.seatLimit,
          clientLimit: plan.clientLimit,
          hasTrial: plan.hasTrial,
          trialDays: plan.trialDays,
          features: plan.features
        }
      },
      error: null
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching plan'
      }
    });
  }
});

