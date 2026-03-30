import type { Request, Response } from 'express'
import { HttpError } from '../../utils/errors.js'
import { ProfileMapper } from './profile.mapper.js'
import { ProfileService } from './profile.service.js'
import { changePasswordSchema } from './dto/change-password.dto.js'
import { requestAccountDeletionSchema } from './dto/request-account-deletion.dto.js'
import { requestElevatedAccessSchema } from './dto/request-elevated-access.dto.js'
import { revokeSessionSchema } from './dto/revoke-session.dto.js'
import { toggleTwoFactorSchema } from './dto/toggle-two-factor.dto.js'
import { updateNotificationPreferencesSchema } from './dto/update-notification-preferences.dto.js'
import { updateProfileSchema } from './dto/update-profile.dto.js'

function requireUser(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required')
  }

  return {
    id: req.user.id,
    email: req.user.email,
  }
}

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  getProfile = async (req: Request, res: Response) => {
    const result = await this.profileService.getProfile(requireUser(req))
    res.json(ProfileMapper.toProfileDto(result))
  }

  updateProfile = async (req: Request, res: Response) => {
    const body = updateProfileSchema.parse(req.body)
    const result = await this.profileService.updateProfile(requireUser(req), body)
    res.json(ProfileMapper.toProfileDto(result))
  }

  getStats = async (req: Request, res: Response) => {
    const result = await this.profileService.getStats(requireUser(req))
    res.json(ProfileMapper.toStatsDto(result))
  }

  getSecurity = async (req: Request, res: Response) => {
    const result = await this.profileService.getSecurity(requireUser(req))
    res.json(ProfileMapper.toSecurityDto(result))
  }

  getWorkspaces = async (req: Request, res: Response) => {
    const result = await this.profileService.getWorkspaces(requireUser(req))
    res.json(ProfileMapper.toWorkspaceDto(result))
  }

  getActivity = async (req: Request, res: Response) => {
    const result = await this.profileService.getActivity(requireUser(req))
    res.json(result)
  }

  getNotifications = async (req: Request, res: Response) => {
    const result = await this.profileService.getNotificationPreferences(requireUser(req))
    res.json(result)
  }

  updateNotifications = async (req: Request, res: Response) => {
    const body = updateNotificationPreferencesSchema.parse(req.body)
    const result = await this.profileService.updateNotificationPreferences(requireUser(req), body)
    res.json(result)
  }

  listSessions = async (req: Request, res: Response) => {
    const result = await this.profileService.listSessions(requireUser(req))
    res.json(result)
  }

  revokeSession = async (req: Request, res: Response) => {
    const body = revokeSessionSchema.parse(req.body ?? {})
    const result = await this.profileService.revokeSession(requireUser(req), req.params.sessionId, body)
    res.json(result)
  }

  revokeOtherSessions = async (req: Request, res: Response) => {
    const body = revokeSessionSchema.parse(req.body ?? {})
    const result = await this.profileService.revokeOtherSessions(requireUser(req), body)
    res.json(result)
  }

  toggleTwoFactor = async (req: Request, res: Response) => {
    const body = toggleTwoFactorSchema.parse(req.body)
    const result = await this.profileService.setTwoFactor(requireUser(req), body)
    res.json(result)
  }

  changePassword = async (req: Request, res: Response) => {
    const body = changePasswordSchema.parse(req.body)
    const result = await this.profileService.changePassword(requireUser(req), {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    })
    res.json(result)
  }

  requestElevatedAccess = async (req: Request, res: Response) => {
    const body = requestElevatedAccessSchema.parse(req.body ?? {})
    const result = await this.profileService.requestElevatedAccess(requireUser(req), body)
    res.json(result)
  }

  listWorkspaceMemberships = async (req: Request, res: Response) => {
    const result = await this.profileService.listWorkspaceMemberships(requireUser(req))
    res.json(result)
  }

  listPendingInvitations = async (req: Request, res: Response) => {
    const result = await this.profileService.listPendingInvitations(requireUser(req))
    res.json(result)
  }

  getPrivacyPolicy = async (_req: Request, res: Response) => {
    const result = this.profileService.getPrivacyPolicy()
    res.json(result)
  }

  requestAccountDeletion = async (req: Request, res: Response) => {
    const body = requestAccountDeletionSchema.parse(req.body ?? {})
    const result = await this.profileService.requestAccountDeletion(requireUser(req), body)
    res.json(result)
  }
}
