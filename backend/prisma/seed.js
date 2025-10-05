const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default plans
  const plans = [
    {
      name: 'Free',
      priceMonthly: 0,
      seatLimit: 1,
      clientLimit: 5,
      hasTrial: false,
      features: {
        basicCRM: true,
        emailIntegration: true,
        standardSupport: true,
        workflowTemplates: 3
      }
    },
    {
      name: 'Plus',
      priceMonthly: 29,
      seatLimit: 3,
      clientLimit: 50,
      hasTrial: true,
      trialDays: 30,
      features: {
        basicCRM: true,
        emailIntegration: true,
        prioritySupport: true,
        workflowTemplates: 10,
        advancedWorkflows: true,
        customTemplates: true,
        basicAnalytics: true
      }
    },
    {
      name: 'Pro',
      priceMonthly: 79,
      seatLimit: 10,
      clientLimit: 200,
      hasTrial: true,
      trialDays: 30,
      features: {
        basicCRM: true,
        emailIntegration: true,
        prioritySupport: true,
        workflowTemplates: 25,
        advancedWorkflows: true,
        customTemplates: true,
        advancedAnalytics: true,
        apiAccess: true,
        customBranding: true,
        automation: true
      }
    },
    {
      name: 'Enterprise',
      priceMonthly: 0, // Custom pricing
      seatLimit: -1, // Unlimited
      clientLimit: -1, // Unlimited
      hasTrial: true,
      trialDays: 30,
      features: {
        basicCRM: true,
        emailIntegration: true,
        dedicatedSupport: true,
        unlimitedWorkflows: true,
        customTemplates: true,
        advancedAnalytics: true,
        apiAccess: true,
        customBranding: true,
        automation: true,
        onPremiseDeployment: true,
        slaGuarantees: true,
        trainingOnboarding: true,
        whiteLabelSolution: true
      }
    }
  ];

  console.log('📋 Creating plans...');
  for (const planData of plans) {
    const existingPlan = await prisma.plan.findUnique({
      where: { name: planData.name }
    });

    if (!existingPlan) {
      const plan = await prisma.plan.create({
        data: planData
      });
      console.log(`✅ Created plan: ${plan.name}`);
    } else {
      console.log(`⏭️  Plan already exists: ${planData.name}`);
    }
  }

  // Create super admin user (if needed)
  const superAdminEmail = 'admin@writway.com';
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail }
  });

  if (!existingSuperAdmin) {
    // Create a tenant for super admin
    const superAdminTenant = await prisma.tenant.create({
      data: {
        name: 'WritWay Admin',
        businessType: 'Platform Administration',
        isOnboardingComplete: true,
        planId: (await prisma.plan.findUnique({ where: { name: 'Enterprise' } })).id
      }
    });

    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        tenantId: superAdminTenant.id
      }
    });

    console.log('✅ Created super admin user');
  } else {
    console.log('⏭️  Super admin already exists');
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
