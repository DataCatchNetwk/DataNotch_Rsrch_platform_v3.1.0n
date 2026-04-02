import axios from "axios"

function getAuthToken() {
  if (typeof window === "undefined") {
    return undefined
  }

  return localStorage.getItem("auth_token") ?? sessionStorage.getItem("auth_token") ?? undefined
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api",
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
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unexpected API error"
    return Promise.reject(new Error(message))
  }
)
