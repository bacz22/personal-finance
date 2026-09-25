export interface UserSummary {
  id: number
  fullName: string
  email: string
  currency: string
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe: boolean
}

export interface LoginResponse {
  accessToken: string
  tokenType: 'Bearer' | string
  expiresIn: number
  user: UserSummary
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

export interface RegisterResponse extends UserSummary {
  createdAt: string
}

export interface UpdateProfileRequest {
  fullName: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ApiFieldError {
  field: string
  code?: string
  message: string
}

interface ApiErrorResponse {
  message?: string
  errorCode?: string
  fieldErrors?: ApiFieldError[]
}

export class ApiError extends Error {
  readonly status: number
  readonly errorCode?: string
  readonly fieldErrors: ApiFieldError[]

  constructor(
    message: string,
    status: number,
    errorCode?: string,
    fieldErrors: ApiFieldError[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errorCode = errorCode
    this.fieldErrors = fieldErrors
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
const API_REQUEST_TIMEOUT_MS = 90_000
let accessToken: string | null = null
let authEpoch = 0
let refreshInFlight: { epoch: number; promise: Promise<string | null> } | null = null

export function setAccessToken(token: string | null) {
  authEpoch += 1
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

async function readError(response: Response): Promise<ApiError> {
  let payload: ApiErrorResponse = {}
  try {
    payload = (await response.json()) as ApiErrorResponse
  } catch {
    // Some proxies return an empty or non-JSON error response.
  }
  return new ApiError(
    payload.message || `Yêu cầu không thành công (${response.status}).`,
    response.status,
    payload.errorCode,
    payload.fieldErrors || [],
  )
}

async function fetchJson<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  const controller = new AbortController()
  let timedOut = false
  const timeoutId = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, API_REQUEST_TIMEOUT_MS)
  const abortFromCaller = () => controller.abort()
  if (init.signal?.aborted) controller.abort()
  else init.signal?.addEventListener('abort', abortFromCaller, { once: true })

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
      credentials: 'include',
    })
  } catch (error) {
    if (timedOut) {
      throw new ApiError(
        'Máy chủ không phản hồi trong 90 giây. Hãy kiểm tra trạng thái yêu cầu rồi thử lại thủ công.',
        0,
        'REQUEST_TIMEOUT',
      )
    }
    if (init.signal?.aborted) throw error
    throw new ApiError('Không thể kết nối backend. Hãy kiểm tra backend và địa chỉ API.', 0, 'NETWORK_ERROR')
  } finally {
    window.clearTimeout(timeoutId)
    init.signal?.removeEventListener('abort', abortFromCaller)
  }

  if (!response.ok) throw await readError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function refreshAccessToken(): Promise<string | null> {
  const epoch = authEpoch
  if (!refreshInFlight || refreshInFlight.epoch !== epoch) {
    const promise = fetchJson<{ accessToken: string }>('/api/v1/auth/refresh', {
      method: 'POST',
    })
      .then((response) => {
        if (authEpoch !== epoch) return null
        accessToken = response.accessToken
        return response.accessToken
      })
      .catch(() => {
        if (authEpoch === epoch) accessToken = null
        return null
      })
      .finally(() => {
        if (refreshInFlight?.epoch === epoch) refreshInFlight = null
      })
    refreshInFlight = { epoch, promise }
  }
  return refreshInFlight.promise
}

async function restoreAccessTokenForBootstrap(): Promise<string> {
  const response = await fetchJson<{ accessToken: string }>('/api/v1/auth/refresh', { method: 'POST' })
  setAccessToken(response.accessToken)
  return response.accessToken
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { authenticated?: boolean; retryUnauthorized?: boolean } = {},
): Promise<T> {
  const authenticated = options.authenticated ?? true
  const retryUnauthorized = options.retryUnauthorized ?? true
  const tokenUsed = authenticated ? accessToken : null
  const requestEpoch = authEpoch
  const assertCurrentSession = () => {
    if (authenticated && authEpoch !== requestEpoch) {
      throw new ApiError('Phiên đăng nhập đã thay đổi. Vui lòng thử lại.', 401, 'SESSION_CHANGED')
    }
  }

  try {
    const result = await fetchJson<T>(path, init, tokenUsed)
    assertCurrentSession()
    return result
  } catch (error) {
    assertCurrentSession()
    if (!(error instanceof ApiError) || error.status !== 401 || !authenticated || !retryUnauthorized) {
      throw error
    }

    // Reuse a token another concurrent request may already have refreshed.
    const nextToken = tokenUsed !== accessToken ? accessToken : await refreshAccessToken()
    assertCurrentSession()
    if (!nextToken) throw error
    const result = await fetchJson<T>(path, init, nextToken)
    assertCurrentSession()
    return result
  }
}

export const authApi = {
  login: (request: LoginRequest) =>
    apiRequest<LoginResponse>(
      '/api/v1/auth/login',
      { method: 'POST', body: JSON.stringify(request) },
      { authenticated: false, retryUnauthorized: false },
    ),
  register: (request: RegisterRequest) =>
    apiRequest<RegisterResponse>(
      '/api/v1/auth/register',
      { method: 'POST', body: JSON.stringify(request) },
      { authenticated: false, retryUnauthorized: false },
    ),
  refresh: refreshAccessToken,
  restoreForBootstrap: restoreAccessTokenForBootstrap,
  logout: (token: string | null) =>
    fetchJson<void>('/api/v1/auth/logout', { method: 'POST' }, token),
  me: () => apiRequest<UserSummary>('/api/v1/users/me'),
  updateProfile: (request: UpdateProfileRequest) =>
    apiRequest<UserSummary>('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),
  changePassword: (request: ChangePasswordRequest) =>
    apiRequest<void>('/api/v1/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),
}
