'use client'

function readPositiveIntegerEnv(name: string, fallback: number) {
  const raw = process.env[name]
  if (!raw) return fallback

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return parsed
}

function readBooleanEnv(name: string, fallback: boolean) {
  const raw = process.env[name]?.trim().toLowerCase()
  if (!raw) return fallback
  if (raw === 'true') return true
  if (raw === 'false') return false
  return fallback
}

const rawMonitoringApiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001'
const rawMonitoringWsBase = process.env.NEXT_PUBLIC_WS_BASE_URL ?? rawMonitoringApiBase

export const monitoringApiBase = rawMonitoringApiBase.replace(/\/+$/, '')
export const monitoringWsBase = rawMonitoringWsBase.replace(/\/+$/, '')
export const monitoringApiPrefix = '/api/v1'
export const monitoringWsAutoRecoverEnabled = readBooleanEnv('NEXT_PUBLIC_MONITORING_WS_AUTO_RECOVER', true)
export const monitoringWsRecoveryThreshold = readPositiveIntegerEnv('NEXT_PUBLIC_MONITORING_WS_RECOVERY_THRESHOLD', 3)
