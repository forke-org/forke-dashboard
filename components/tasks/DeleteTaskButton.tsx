'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/components/shared/Toast'
import { deleteTask } from '@/lib/actions/tasks'

interface DeleteTaskButtonProps {
  taskId: string
  isClaimed: boolean
}

export default function DeleteTaskButton({ taskId, isClaimed }: DeleteTaskButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleDelete = async () => {
    if (isClaimed) {
      toast('The task cannot be deleted as it is already accepted by a developer', 'error')
      return
    }

    if (!confirming) {
      setConfirming(true)
      toast('Click again to confirm deleting this mission.', 'info')
      return
    }

    setLoading(true)
    try {
      const res = await deleteTask(taskId)
      if (res.success) {
        router.push('/tasks?toast=deleted')
      } else {
        toast(res.error || 'Failed to delete task', 'error')
        setConfirming(false)
      }
    } catch (error) {
      console.error(error)
      toast('Failed to delete task due to connection issue.', 'error')
      setConfirming(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={cn(
        "w-full h-11 border rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50",
        confirming 
          ? "border-rose-500 bg-rose-500 text-black hover:bg-rose-600" 
          : "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-450 hover:text-rose-400"
      )}
    >
      <Trash2 className="w-3.5 h-3.5" />
      {loading ? 'Deleting...' : confirming ? 'Confirm Delete' : 'Delete Mission'}
    </button>
  )
}
