import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ApiError,
  authApi,
  getAccessToken,
  setAccessToken,
  type LoginRequest,
  type ChangePasswordRequest,
  type RegisterRequest,
  type RegisterResponse,
  type UpdateProfileRequest,
  type UserSummary,
} from './api'
import {
  activateUser,
  forgetCurrentUser,
  getSyncState,
  pendingOperationCount,
  restoreCachedUser,
  subscribeSyncState,
  syncNow,
  type SyncState,
} from './offline/syncEngine'

interface AuthContextValue {
  user: UserSummary | null
  isLoading: boolean
  isAuthenticated: boolean
  syncState: SyncState
  syncNow: () => Promise<void>
  login: (request: LoginRequest) => Promise<UserSummary>
  register: (request: RegisterRequest) => Promise<RegisterResponse>
  logout: () => Promise<void>
  reloadUser: () => Promise<UserSummary>
  updateProfile: (request: UpdateProfileRequest) => Promise<UserSummary>
  changePassword: (request: ChangePasswordRequest) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [syncState, setSyncState] = useState(getSyncState)
  const authGeneration = useRef(0)
  const resumeRestoreRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    let isCurrent = true
    const generation = authGeneration.current
    const restoreSession = async () => {
      try {
        if (!navigator.onLine) {
          const cachedUser = await restoreCachedUser()
          if (isCurrent && generation === authGeneration.current) setUser(cachedUser)
          return
        }
        await authApi.restoreForBootstrap()
        const currentUser = await authApi.me()
        await activateUser(currentUser)
        if (isCurrent && generation === authGeneration.current) setUser(currentUser)
      } catch (error) {
        if (isCurrent && generation === authGeneration.current) {
          setAccessToken(null)
          const canUseOfflineCache = error instanceof ApiError && (error.status === 0 || error.status >= 500)
          const cachedUser = canUseOfflineCache ? await restoreCachedUser().catch(() => null) : null
          setUser(cachedUser)
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void restoreSession()
    const unsubscribe = subscribeSyncState(() => setSyncState(getSyncState()))
    const handleExpiredSession = () => {
      setAccessToken(null)
      setUser(null)
    }
    window.addEventListener('offline-auth-required', handleExpiredSession)
    return () => {
      isCurrent = false
      unsubscribe()
      window.removeEventListener('offline-auth-required', handleExpiredSession)
    }
  }, [])

  useEffect(() => {
    const handleActiveUserChanged = (event: Event) => {
      const activeUserId = (event as CustomEvent<string | null>).detail
      if (user && activeUserId !== String(user.id)) {
        authGeneration.current += 1
        setAccessToken(null)
        setUser(null)
      }
    }
    window.addEventListener('offline-active-user-changed', handleActiveUserChanged)
    return () => window.removeEventListener('offline-active-user-changed', handleActiveUserChanged)
  }, [user])

  useEffect(() => {
    if (!user) return
    let isCurrent = true

    const restoreIfNeeded = () => {
      if (!navigator.onLine || getAccessToken() || resumeRestoreRef.current) return
      const generation = authGeneration.current
      const task = Promise.resolve().then(async () => {
        try {
          await authApi.restoreForBootstrap()
          const currentUser = await authApi.me()
          if (!isCurrent || generation !== authGeneration.current) return
          await activateUser(currentUser)
          if (isCurrent && generation === authGeneration.current) setUser(currentUser)
        } catch (error) {
          if (
            isCurrent
            && generation === authGeneration.current
            && error instanceof ApiError
            && error.status === 401
            && error.errorCode !== 'SESSION_CHANGED'
          ) {
            setAccessToken(null)
            setUser(null)
          }
        } finally {
          if (resumeRestoreRef.current === task) resumeRestoreRef.current = null
        }
      })
      resumeRestoreRef.current = task
    }

    window.addEventListener('online', restoreIfNeeded)
    window.addEventListener('focus', restoreIfNeeded)
    return () => {
      isCurrent = false
      window.removeEventListener('online', restoreIfNeeded)
      window.removeEventListener('focus', restoreIfNeeded)
    }
  }, [user])

  const login = useCallback(async (request: LoginRequest) => {
    const generation = ++authGeneration.current
    const response = await authApi.login(request)
    if (generation !== authGeneration.current) throw new Error('Yêu cầu đăng nhập đã bị thay thế.')
    setAccessToken(response.accessToken)
    await activateUser(response.user)
    setUser(response.user)
    return response.user
  }, [])

  const register = useCallback((request: RegisterRequest) => authApi.register(request), [])

  const logout = useCallback(async () => {
    const token = getAccessToken()
    if (navigator.onLine) await syncNow()
    const pending = await pendingOperationCount()
    let discardPending = false
    if (pending > 0) {
      discardPending = window.confirm(
        `Còn ${pending} thay đổi chưa đồng bộ. Bạn có muốn xóa bản lưu trên thiết bị và đăng xuất không?`,
      )
      if (!discardPending) throw new Error('Đã hủy đăng xuất để giữ lại các thay đổi chưa đồng bộ.')
    }
    authGeneration.current += 1
    setAccessToken(null)
    setUser(null)
    await forgetCurrentUser(discardPending || pending === 0)
    if (token) await authApi.logout(token)
  }, [])

  const reloadUser = useCallback(async () => {
    const generation = authGeneration.current
    const currentUser = await authApi.me()
    if (generation !== authGeneration.current) throw new Error('Phiên đăng nhập đã thay đổi.')
    setUser(currentUser)
    return currentUser
  }, [])

  const updateProfile = useCallback(async (request: UpdateProfileRequest) => {
    const generation = authGeneration.current
    const updatedUser = await authApi.updateProfile(request)
    if (generation !== authGeneration.current) throw new Error('Phiên đăng nhập đã thay đổi.')
    await activateUser(updatedUser)
    setUser(updatedUser)
    return updatedUser
  }, [])

  const changePassword = useCallback(async (request: ChangePasswordRequest) => {
    await authApi.changePassword(request)
    await reloadUser()
  }, [reloadUser])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isAuthenticated: user !== null,
    syncState,
    syncNow,
    login,
    register,
    logout,
    reloadUser,
    updateProfile,
    changePassword,
  }), [user, isLoading, syncState, login, register, logout, reloadUser, updateProfile, changePassword])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth phải được sử dụng bên trong AuthProvider.')
  return context
}
