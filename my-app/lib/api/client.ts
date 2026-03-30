import axios from "axios"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api",
  withCredentials: true,
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
