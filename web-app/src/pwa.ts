import { registerSW } from 'virtual:pwa-register'

let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null

export function registerOfflineApp() {
  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('pwa-update-ready'))
    },
  })
}

export async function applyOfflineAppUpdate() {
  await updateServiceWorker?.(true)
}
