/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication Error',
  description: 'There was a problem with your authentication. Please submit an enquiry to our support team.',
  robots: {
    index: false,
    follow: false,
  }
}

export default function AuthErrorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
