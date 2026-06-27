import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { ProfileController } from './profile.controller.js'
import { ProfileService } from './profile.service.js'

const profileService = new ProfileService()
const profileController = new ProfileController(profileService)

const profileRouter = Router()

profileRouter.use(authenticate)
profileRouter.get('/', asyncHandler(profileController.getProfile))
profileRouter.patch('/', asyncHandler(profileController.updateProfile))
profileRouter.get('/stats', asyncHandler(profileController.getStats))
profileRouter.get('/security', asyncHandler(profileController.getSecurity))
profileRouter.get('/workspaces', asyncHandler(profileController.getWorkspaces))
profileRouter.get('/activity', asyncHandler(profileController.getActivity))
profileRouter.get('/notifications', asyncHandler(profileController.getNotifications))
profileRouter.patch('/notifications', asyncHandler(profileController.updateNotifications))
profileRouter.get('/security/sessions', asyncHandler(profileController.listSessions))
profileRouter.post('/security/sessions/revoke-others', asyncHandler(profileController.revokeOtherSessions))
profileRouter.post('/security/sessions/:sessionId/revoke', asyncHandler(profileController.revokeSession))
profileRouter.patch('/security/2fa', asyncHandler(profileController.toggleTwoFactor))
profileRouter.post('/security/password', asyncHandler(profileController.changePassword))
profileRouter.post('/access/elevated-request', asyncHandler(profileController.requestElevatedAccess))
profileRouter.get('/workspaces/list', asyncHandler(profileController.listWorkspaceMemberships))
profileRouter.get('/workspaces/invitations', asyncHandler(profileController.listPendingInvitations))
profileRouter.get('/privacy/policy', asyncHandler(profileController.getPrivacyPolicy))
profileRouter.post('/privacy/request-deletion', asyncHandler(profileController.requestAccountDeletion))

export default profileRouter