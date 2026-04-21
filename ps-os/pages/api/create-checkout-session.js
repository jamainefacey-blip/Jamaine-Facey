import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });
  }

  const { sessionId } = req.body || {};
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId required' });
  }

  const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency:     'gbp',
          unit_amount:  2900,
          product_data: {
            name:        'Pain System OS — Full Output Unlock',
            description: 'One-time unlock of full AVA analysis',
          },
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/build?unlocked=true&ps_session=${encodeURIComponent(sessionId)}`,
      cancel_url:  `${baseUrl}/build`,
    });
  } catch (err) {
    return res.status(502).json({ error: 'Stripe error', detail: err.message });
  }

  return res.status(200).json({ url: session.url });
}
