import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
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

interface AuthContextValue {
  user: UserSummary | null
  isLoading: boolean
  isAuthenticated: boolean
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
  const authGeneration = useRef(0)

  useEffect(() => {
    let isCurrent = true
    const generation = authGeneration.current
    const restoreSession = async () => {
      try {
        const token = await authApi.refresh()
        if (!token) return
        const currentUser = await authApi.me()
        if (isCurrent && generation === authGeneration.current) setUser(currentUser)
      } catch {
        if (isCurrent && generation === authGeneration.current) {
          setAccessToken(null)
          setUser(null)
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void restoreSession()
    return () => {
      isCurrent = false
    }
  }, [])

  const login = useCallback(async (request: LoginRequest) => {
    const generation = ++authGeneration.current
    const response = await authApi.login(request)
    if (generation !== authGeneration.current) throw new Error('Yêu cầu đăng nhập đã bị thay thế.')
    setAccessToken(response.accessToken)
    setUser(response.user)
    return response.user
  }, [])

  const register = useCallback((request: RegisterRequest) => authApi.register(request), [])

  const logout = useCallback(async () => {
    const token = getAccessToken()
    authGeneration.current += 1
    setAccessToken(null)
    setUser(null)
    await authApi.logout(token)
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
    login,
    register,
    logout,
    reloadUser,
    updateProfile,
    changePassword,
  }), [user, isLoading, login, register, logout, reloadUser, updateProfile, changePassword])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth phải được sử dụng bên trong AuthProvider.')
  return context
}
