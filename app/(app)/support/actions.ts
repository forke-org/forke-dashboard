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
import { supportEnquiries } from '@/lib/db/schema'
import { logAudit } from '@/lib/actions/audit-actions'

export async function submitSupportEnquiry(formData: FormData) {
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const contactEmail = formData.get('contactEmail') as string
  const contactNumber = formData.get('contactNumber') as string
  const message = formData.get('message') as string
  const errorType = formData.get('errorType') as string
  const relevantLinks = formData.get('relevantLinks') as string

  if (!firstName || !lastName || !contactEmail || !message) {
    return { success: false, error: 'Required fields are missing.' }
  }

  try {
    await db.insert(supportEnquiries).values({
      firstName,
      lastName,
      contactEmail,
      contactNumber: contactNumber || '',
      message,
      errorType: errorType || 'General',
      relevantLinks: relevantLinks || '',
      status: 'pending',
    })

    // Log the event explicitly for the activity feed
    await logAudit({
      category: 'support',
      action: 'support.enquiry',
      target: errorType ? `${contactEmail} · ${errorType}` : contactEmail,
      actorName: `${firstName} ${lastName}`
    })

    return { success: true }
  } catch (e) {
    console.error('Failed to submit support enquiry:', e)
    return { success: false, error: 'Database write error. Please try again.' }
  }
}
