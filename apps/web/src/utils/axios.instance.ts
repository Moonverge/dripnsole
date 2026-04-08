import axios from 'axios'
import { BASE_URL } from './api.routes'
import { CLIENT_VERSION } from './client-version'
import { clearAccessToken, getAccessToken, setAccessToken } from './access-token'

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'X-Client-Version': CLIENT_VERSION,
  },
})

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean }
    const status = error.response?.status
    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true
      try {
        const refreshRes = await axios.post<{ success: boolean; data?: { accessToken?: string } }>(
          `${BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: { 'X-Client-Version': CLIENT_VERSION },
          },
        )
        const token = refreshRes.data?.data?.accessToken
        if (refreshRes.data?.success && token) {
          setAccessToken(token)
          original.headers.Authorization = `Bearer ${token}`
          return axiosInstance(original)
        }
      } catch {
        void 0
      }
      clearAccessToken()
    }
    return Promise.reject(error)
  },
)
