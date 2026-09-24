import React, { useEffect, useState } from 'react'
import { Clock3 } from 'lucide-react'

interface ColdStartNoticeProps {
  active?: boolean
}

export const ColdStartNotice: React.FC<ColdStartNoticeProps> = ({ active = true }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!active) return

    const timer = window.setTimeout(() => setIsVisible(true), 3000)
    return () => window.clearTimeout(timer)
  }, [active])

  if (!active || !isVisible) return null

  return (
    <div role="status" aria-live="polite" className="mt-4 flex items-start gap-2.5 rounded-2xl border border-sky-200 bg-sky-50/90 p-3 text-xs leading-relaxed text-sky-800 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-200">
      <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Máy chủ miễn phí có thể mất đến 90 giây để khởi động sau khi không hoạt động. Bạn có thể tiếp tục chờ; ứng dụng không tự gửi lại yêu cầu.</span>
    </div>
  )
}
