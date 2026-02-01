import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { order } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const endpointSecret = env.STRIPE_WEBHOOK_SECRET; 

export const POST = async ({ request }) => {
    const stripe = new Stripe(env.STRIPE_KEY);
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event;

    try {
        event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
    } catch (err) {
        console.error(`⚠️ Webhook Signature Error: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orderId = session.metadata?.orderId; 

        if (orderId) {
            console.log(`✅ Payment received for Order: ${orderId}`);
            await db.update(order)
                .set({ 
                    paymentStatus: true
                })
                .where(eq(order.id, orderId));
        }
    }

    return new Response();
};