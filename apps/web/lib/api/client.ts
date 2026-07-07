import axios from "axios"

import { apiPathUrl } from "@/lib/api-base"

const apiBaseUrl = apiPathUrl("/")

function normalizeRequestPath(url?: string) {
  if (!url || /^https?:\/\//i.test(url)) {
    return url
  }

  const basePath = new URL(apiBaseUrl).pathname.replace(/\/+$/, "")

  if (/\/api\/v\d+$/i.test(basePath)) {
    const version = basePath.match(/\/(v\d+)$/i)?.[1]
    if (url.toLowerCase().startsWith(`${basePath.toLowerCase()}/`)) {
      return url.slice(basePath.length) || "/"
    }
    if (version && url.toLowerCase().startsWith(`/api/${version.toLowerCase()}/`)) {
      return url.slice(`/api/${version}`.length) || "/"
    }
    if (version && url.toLowerCase().startsWith(`/${version.toLowerCase()}/`)) {
      return url.slice(version.length + 1) || "/"
    }
  }

  if (/\/api$/i.test(basePath) && url.toLowerCase().startsWith("/api/")) {
    return url.slice("/api".length) || "/"
  }

  return url
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
  baseURL: apiBaseUrl,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  config.url = normalizeRequestPath(config.url)

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
