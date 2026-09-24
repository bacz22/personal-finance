import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: LucideIcon
  promptHint?: string
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  icon: Icon,
  promptHint,
}) => {
  return (
    <div className="space-y-6">
      {/* Header khu vực trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Icon className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {title}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Container placeholder tối giản theo quy chuẩn */}
      <div className="bg-white rounded-2xl p-8 md:p-12 border border-slate-200/80 shadow-sm text-center max-w-2xl mx-auto my-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          Khu vực {title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto mb-6">
          Khung trang đã được liên kết thành công vào App Layout và React Router.
          {promptHint && (
            <span className="block mt-2 font-medium text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-100 text-xs">
              {promptHint}
            </span>
          )}
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          Placeholder tối giản (Sẵn sàng triển khai nội dung)
        </div>
      </div>
    </div>
  )
}
