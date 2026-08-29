/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import TopBar from '@/components/shared/TopBar'
import SupportForm from '@/components/support/SupportForm'

export default function SupportPage() {
  return (
    <div className="flex flex-col h-full bg-transparent text-white font-sans">
      <TopBar title="Support" />

      <div className="flex-grow px-5 md:px-8 py-6 md:py-8 overflow-y-auto select-none max-w-2xl mx-auto w-full flex flex-col justify-center">
        <SupportForm />
      </div>
    </div>
  )
}
