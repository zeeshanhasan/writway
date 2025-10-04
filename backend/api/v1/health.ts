// Minimal serverless handler to avoid any Prisma import for liveness
export default function handler(req: any, res: any) {
  res.status(200).json({ success: true, data: { status: 'ok' }, error: null });
}

