import React, { useEffect, useState } from 'react'
import { AlertTriangle, Check, Cloud, CloudOff, Download, RefreshCw, Smartphone } from 'lucide-react'
import { useAuth } from '../../AuthContext'
import { applyOfflineAppUpdate } from '../../pwa'
import { resolveConflict } from '../../offline/syncEngine'
import type { OfflineOperation } from '../../offline/types'

function localSummary(operation: OfflineOperation) {
  const payload = operation.payload ?? {}
  if (operation.entityType === 'CATEGORY') return String(payload.name ?? 'Danh mục')
  if (operation.entityType === 'TRANSACTION') {
    const title = String(payload.title ?? 'Giao dịch')
    const amount = payload.amount ? ` · ${payload.amount} ₫` : ''
    return `${title}${amount}`
  }
  return `Tháng ${String(payload.month ?? '')} · hạn mức ${String(payload.limitAmount ?? '0')} ₫`
}

function serverSummary(operation: OfflineOperation) {
  const current = operation.conflictCurrent as Record<string, unknown> | null | undefined
  if (!current) return 'Bản ghi này đã bị xóa trên web.'
  if (operation.entityType === 'CATEGORY') return String(current.name ?? 'Danh mục')
  if (operation.entityType === 'TRANSACTION') {
    return `${String(current.title ?? 'Giao dịch')} · ${String(current.amount ?? '0')} ₫`
  }
  return `Tháng ${String(current.month ?? '')} · hạn mức ${String(current.limitAmount ?? '0')} ₫`
}

export const OfflineStatusBanner: React.FC = () => {
  const { syncState, syncNow } = useAuth()
  const [updateReady, setUpdateReady] = useState(false)
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  const [isIOS] = useState(() => /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
  const [isInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)))

  useEffect(() => {
    const handleUpdate = () => setUpdateReady(true)
    window.addEventListener('pwa-update-ready', handleUpdate)
    return () => window.removeEventListener('pwa-update-ready', handleUpdate)
  }, [])

  const needsAttention = !syncState.online || syncState.syncing || syncState.pendingCount > 0
    || Boolean(syncState.lastError) || Boolean(syncState.conflict) || updateReady || (isIOS && !isInstalled)
  if (!needsAttention) return null

  return (
    <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white/75 p-3.5 text-sm text-slate-700 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          {syncState.online ? (
            <Cloud aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <CloudOff aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <div className="min-w-0">
            <p className="font-semibold">
              {!syncState.online
                ? 'Đang ngoại tuyến · thay đổi được lưu trên thiết bị'
                : syncState.syncing
                  ? 'Đang đồng bộ dữ liệu…'
                  : syncState.pendingCount > 0
                    ? `Có ${syncState.pendingCount} thay đổi đang chờ đồng bộ`
                    : syncState.lastError || 'Cần chú ý đến dữ liệu offline'}
            </p>
            {syncState.lastSyncedAt && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Đồng bộ gần nhất: {new Date(syncState.lastSyncedAt).toLocaleString('vi-VN')}
              </p>
            )}
            {syncState.lastError && !syncState.conflict && (
              <p role="alert" className="mt-1 text-xs text-rose-700 dark:text-rose-300">{syncState.lastError}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {syncState.online && (syncState.pendingCount > 0 || syncState.lastError) && !syncState.conflict && (
            <button
              type="button"
              onClick={() => void syncNow()}
              disabled={syncState.syncing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <RefreshCw aria-hidden="true" className={`h-3.5 w-3.5 ${syncState.syncing ? 'animate-spin' : ''}`} />
              {syncState.pendingCount > 0 ? 'Đồng bộ ngay' : 'Thử lại'}
            </button>
          )}
          {isIOS && !isInstalled && (
            <button
              type="button"
              aria-expanded={showInstallHelp}
              onClick={() => setShowInstallHelp((value) => !value)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-3.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <Smartphone aria-hidden="true" className="h-3.5 w-3.5" />
              Cài trên iPhone
            </button>
          )}
          {updateReady && (
            <button
              type="button"
              onClick={() => void applyOfflineAppUpdate()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
            >
              <Download aria-hidden="true" className="h-3.5 w-3.5" />
              Cập nhật app
            </button>
          )}
        </div>
      </div>

      {showInstallHelp && isIOS && !isInstalled && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs leading-relaxed text-blue-900 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-200">
          <Download aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Mở trang này bằng Safari, chạm nút Chia sẻ, chọn “Thêm vào Màn hình chính”, rồi mở app từ biểu tượng vừa tạo.</p>
        </div>
      )}

      {syncState.conflict && (
        <div role="alert" className="mt-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3 dark:border-amber-800 dark:bg-amber-950/35">
          <div className="flex items-start gap-2">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
            <div className="min-w-0">
              <p className="font-semibold text-amber-950 dark:text-amber-100">Bản ghi đã được sửa trên iPhone và web</p>
              <p className="mt-1 text-xs text-amber-900 dark:text-amber-200">iPhone: {localSummary(syncState.conflict)}</p>
              <p className="text-xs text-amber-900 dark:text-amber-200">Web: {serverSummary(syncState.conflict)}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 pl-6">
            <button
              type="button"
              onClick={() => void resolveConflict(true)}
              className="min-h-11 rounded-xl bg-amber-700 px-3.5 text-xs font-semibold text-white hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              Giữ bản iPhone
            </button>
            <button
              type="button"
              onClick={() => void resolveConflict(false)}
              className="min-h-11 rounded-xl border border-amber-400 bg-white/80 px-3.5 text-xs font-semibold text-amber-950 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:border-amber-700 dark:bg-slate-900 dark:text-amber-100"
            >
              Dùng bản web
            </button>
          </div>
        </div>
      )}

      {syncState.online && syncState.pendingCount === 0 && !syncState.lastError && !updateReady && !syncState.conflict && syncState.lastSyncedAt && (
        <p className="sr-only" role="status"><Check aria-hidden="true" /> Dữ liệu đã đồng bộ.</p>
      )}
    </section>
  )
}
