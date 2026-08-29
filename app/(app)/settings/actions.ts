'use server'

/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { db } from '@/lib/db'
import { users, owners, subscribers } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function ensureTelemetrySettingsColumns() {
  try {
    await db.execute(sql`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_alerts" boolean DEFAULT true;
    `)
    await db.execute(sql`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "slack_webhooks" boolean DEFAULT false;
    `)
    await db.execute(sql`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletion_scheduled_at" timestamp;
    `)
  } catch (error) {
    console.error('Failed to add telemetry columns to users table:', error)
  }
}

export async function updateTelemetrySettings(userId: string, type: 'emailAlerts' | 'slackWebhooks', enabled: boolean) {
  await ensureTelemetrySettingsColumns()
  try {
    if (type === 'emailAlerts') {
      await db.update(users).set({ emailAlerts: enabled }).where(eq(users.id, userId))
    } else {
      await db.update(users).set({ slackWebhooks: enabled }).where(eq(users.id, userId))
    }
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Failed to update telemetry setting:', error)
    return { success: false, error: 'Database update failed.' }
  }
}

export async function getSystemSpecs() {
  const start = Date.now()
  let databaseState = 'disconnected'
  
  try {
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
    ])
    databaseState = 'connected'
  } catch (error) {
    console.error('Database connection test failed:', error)
    databaseState = 'disconnected'
  }
  
  const latency = Date.now() - start
  
  return {
    databaseState,
    dbLatencyMs: latency,
    runtimeVersion: `nextjs v15.5.15`
  }
}


export async function updateProfileSettings(userId: string, role: 'developer' | 'owner', formData: FormData) {
  const name = formData.get('name') as string
  if (!name || !name.trim()) {
    return { success: false, error: 'Name is required.' }
  }

  try {
    // 1. Update user name
    await db.update(users).set({ name: name.trim() }).where(eq(users.id, userId))

    // 2. Role-specific updates
    if (role === 'owner') {
      const companyName = formData.get('companyName') as string
      const companyWebsite = formData.get('companyWebsite') as string
      const designation = formData.get('designation') as string
      const contactNumber = formData.get('contactNumber') as string
      const contactEmail = formData.get('contactEmail') as string
      const personalLinkedIn = formData.get('personalLinkedIn') as string

      const nameParts = name.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      await db
        .update(owners)
        .set({
          firstName,
          lastName,
          companyName: companyName?.trim() || '',
          companyWebsite: companyWebsite?.trim() || '',
          designation: designation?.trim() || '',
          contactNumber: contactNumber?.trim() || '',
          contactEmail: contactEmail?.trim() || '',
          personalLinkedIn: personalLinkedIn?.trim() || '',
        })
        .where(eq(owners.id, userId))
    } else {
      const bio = formData.get('bio') as string
      const githubUrl = formData.get('githubUrl') as string

      await db
        .update(users)
        .set({ 
          bio: bio?.trim() || '',
          githubUrl: githubUrl?.trim() || ''
        })
        .where(eq(users.id, userId))
    }

    revalidatePath('/settings')
    revalidatePath('/profile')
    revalidatePath('/dashboard')
    
    return { success: true }
  } catch (e) {
    console.error('Failed to update settings:', e)
    return { success: false, error: 'Failed to save settings to the database.' }
  }
}

export async function setupPasswordAction(userId: string, password: string) {
  if (!password || password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' }
  }
  
  try {
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)
    
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId))
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Failed to setup password:', error)
    return { success: false, error: 'Failed to save password.' }
  }
}

export async function scheduleAccountDeletionAction(userId: string) {
  try {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { email: true }
    })
    
    await db.update(users).set({ deletionScheduledAt: new Date() }).where(eq(users.id, userId))
    
    if (dbUser?.email) {
      const { sendAccountDeletionScheduledEmail } = await import('@/lib/email')
      await sendAccountDeletionScheduledEmail(dbUser.email)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to schedule account deletion:', error)
    return { success: false, error: 'Failed to schedule account deletion.' }
  }
}

export async function updatePromotionalSubscriptionAction(userId: string, subscribe: boolean) {
  try {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { email: true }
    })
    if (!dbUser?.email) {
      return { success: false, error: 'User email not found.' }
    }

    if (subscribe) {
      await db.insert(subscribers).values({
        email: dbUser.email,
        createdAt: new Date()
      }).onConflictDoNothing()
    } else {
      await db.delete(subscribers).where(eq(subscribers.email, dbUser.email))
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Failed to update promotional subscription:', error)
    return { success: false, error: 'Failed to update subscription.' }
  }
}

export async function changePasswordAction(userId: string, oldPass: string, newPass: string) {
  if (!oldPass || !newPass || newPass.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' }
  }

  try {
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { passwordHash: true }
    })

    if (!userRecord || !userRecord.passwordHash) {
      return { success: false, error: 'No password set for this account. Set a password first.' }
    }

    const isValid = await bcrypt.compare(oldPass, userRecord.passwordHash)
    if (!isValid) {
      return { success: false, error: 'Incorrect current password.' }
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(newPass, salt)

    await db.update(users).set({ passwordHash }).where(eq(users.id, userId))
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Failed to change password:', error)
    return { success: false, error: 'Database update failed.' }
  }
}
