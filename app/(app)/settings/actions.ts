'use server'

import { db } from '@/lib/db'
import { users, owners } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

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
