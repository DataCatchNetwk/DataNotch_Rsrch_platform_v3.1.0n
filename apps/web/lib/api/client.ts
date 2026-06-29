import axios from "axios"

function normalizeApiBaseUrl(rawBaseUrl: string | undefined) {
  const fallback = "http://127.0.0.1:3001/api"
  const baseUrl = (rawBaseUrl ?? fallback).replace(/\/+$/, "")

  if (baseUrl.endsWith("/api/v1")) {
    return baseUrl.slice(0, -3)
  }

  if (baseUrl.endsWith("/v1")) {
    return `${baseUrl.slice(0, -3)}/api`
  }

  if (baseUrl.endsWith("/api")) {
    return baseUrl
  }

  return `${baseUrl}/api`
}

function getAuthToken() {
  if (typeof window === "undefined") {
    return undefined
  }

  return localStorage.getItem("auth_token") ?? sessionStorage.getItem("auth_token") ?? undefined
}

function clearExpiredAuth() {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem("auth_token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem("auth_user")
  sessionStorage.removeItem("auth_token")
  sessionStorage.removeItem("refresh_token")
  sessionStorage.removeItem("auth_user")

  if (window.location.pathname !== "/" && !window.location.pathname.startsWith("/login")) {
    const redirectTo = `${window.location.pathname}${window.location.search}`
    window.location.assign(`/?redirectTo=${encodeURIComponent(redirectTo)}`)
  }
}

export const api = axios.create({
  baseURL: normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (!token) {
    return config
  }

  config.headers = config.headers ?? {}
  if (!("Authorization" in config.headers)) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearExpiredAuth()
    }

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unexpected API error"
    return Promise.reject(new Error(message))
  }
)
