/**
 * Clerk Authentication Webhook Handler
 * 
 * Handles Clerk authentication events and logs them to the audit log.
 * This webhook is triggered by Clerk when users sign in or sign out.
 * 
 * Requirements: 6.2
 */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { logLogin, logLogout } from '@/lib/utils/audit-log';
import { db as prisma } from '@/lib/db';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occurred', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  try {
    if (eventType === 'session.created') {
      // User logged in
      const { user_id } = evt.data;
      
      if (user_id) {
        // Find the user in our database
        const user = await prisma.user.findFirst({
          where: { clerkId: user_id },
        });

        if (user) {
          await logLogin(user.id);
        }
      }
    } else if (eventType === 'session.ended' || eventType === 'session.removed' || eventType === 'session.revoked') {
      // User logged out or session ended
      const { user_id } = evt.data;
      
      if (user_id) {
        // Find the user in our database
        const user = await prisma.user.findFirst({
          where: { clerkId: user_id },
        });

        if (user) {
          await logLogout(user.id);
        }
      }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}
