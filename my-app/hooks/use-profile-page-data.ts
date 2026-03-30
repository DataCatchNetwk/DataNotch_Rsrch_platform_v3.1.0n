"use client"

import * as React from "react"

import {
  getProfile,
  getProfileActivity,
  getProfileNotificationPreferences,
  getProfileSecurity,
  getProfileStats,
  getProfileWorkspaces,
  updateProfileNotificationPreferences,
  type ActivityItemDto,
  type NotificationPreferenceDto,
  type ProfileDto,
  type ProfileSecurityDto,
  type ProfileStatsDto,
  type ProfileWorkspaceDto,
} from "@/src/lib/api/profile-api-client"

export function useProfilePageData() {
  const [profile, setProfile] = React.useState<ProfileDto | null>(null)
  const [stats, setStats] = React.useState<ProfileStatsDto | null>(null)
  const [security, setSecurity] = React.useState<ProfileSecurityDto | null>(null)
  const [workspaces, setWorkspaces] = React.useState<ProfileWorkspaceDto | null>(null)
  const [activity, setActivity] = React.useState<ActivityItemDto[]>([])
  const [prefs, setPrefs] = React.useState<NotificationPreferenceDto[]>([])
  const [loading, setLoading] = React.useState(true)
  const [savingPrefs, setSavingPrefs] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [profileRes, statsRes, securityRes, workspaceRes, activityRes, prefsRes] =
        await Promise.all([
          getProfile(),
          getProfileStats(),
          getProfileSecurity(),
          getProfileWorkspaces(),
          getProfileActivity(),
          getProfileNotificationPreferences(),
        ])

      setProfile(profileRes)
      setStats(statsRes)
      setSecurity(securityRes)
      setWorkspaces(workspaceRes)
      setActivity(activityRes)
      setPrefs(prefsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile page.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const togglePref = React.useCallback((key: string) => {
    setPrefs((current) =>
      current.map((item) =>
        item.key === key ? { ...item, enabled: !item.enabled } : item,
      ),
    )
  }, [])

  const savePrefs = React.useCallback(async () => {
    setSavingPrefs(true)
    try {
      const updated = await updateProfileNotificationPreferences({
        preferences: prefs.map((item) => ({
          key: item.key,
          enabled: item.enabled,
        })),
      })
      setPrefs(updated)
      return updated
    } finally {
      setSavingPrefs(false)
    }
  }, [prefs])

  return {
    profile,
    stats,
    security,
    workspaces,
    activity,
    prefs,
    loading,
    savingPrefs,
    error,
    reload: load,
    togglePref,
    savePrefs,
  }
}