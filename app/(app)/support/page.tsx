import TopBar from '@/components/shared/TopBar'
import SupportForm from '@/components/support/SupportForm'

export default function SupportPage() {
  return (
    <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
      <TopBar title="Contact Support" />
      
      <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-8 select-none max-w-3xl mx-auto w-full flex flex-col justify-center">
        <SupportForm />
      </div>
    </div>
  )
}
