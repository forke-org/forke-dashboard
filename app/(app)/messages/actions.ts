'use server'

import { db } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { eq, and, or, asc, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function ensureMessagesTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "sender_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "receiver_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "content" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `)
  } catch (error) {
    console.error('Failed to ensure messages table exists:', error)
  }
}

export async function getMessagesBetweenUsers(userId1: string, userId2: string) {
  await ensureMessagesTable()
  try {
    const list = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(asc(messages.createdAt))
    return { success: true, messages: list }
  } catch (e) {
    console.error('Failed to get messages:', e)
    return { success: false, messages: [], error: 'Failed to retrieve conversation history.' }
  }
}

export async function sendMessageAction(senderId: string, receiverId: string, content: string) {
  await ensureMessagesTable()
  if (!content || !content.trim()) {
    return { success: false, error: 'Message content cannot be empty.' }
  }
  try {
    await db.insert(messages).values({
      senderId,
      receiverId,
      content: content.trim(),
    })
    revalidatePath('/messages')
    return { success: true }
  } catch (e) {
    console.error('Failed to send message:', e)
    return { success: false, error: 'Database error. Failed to dispatch message.' }
  }
}
