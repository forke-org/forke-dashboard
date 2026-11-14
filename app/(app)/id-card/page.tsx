import { redirect } from 'next/navigation'

// The ID card settings live in the profile editor now.
export default function IdCardPage() {
  redirect('/profile#id-card')
}
