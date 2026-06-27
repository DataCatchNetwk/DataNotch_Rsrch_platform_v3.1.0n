import { prisma } from '../db/prisma.js';
import type { AccountStatus } from '@prisma/client';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { randomToken, sha256 } from '../utils/crypto.js';
import { signToken } from '../utils/jwt.js';
import { logAudit } from './audit.service.js';

type SsoProvider = 'google' | 'microsoft';

type RoleEntry = {
  role: {
    name: string;
  };
};

type UserWithRoles = {
  id: string;
  firstname: string;
  surname: string;
  email: string;
  countryCode: string;
  mobileNumber: string;
  accountStatus: AccountStatus;
  roles: RoleEntry[];
};

type RegisterInput = {
  firstname: string;
  surname: string;
  email: string;
  country_code: string;
  mobile_number: string;
  password: string;
  date_of_birth: string;
  referral_code?: string;
};

function getRoleNames(user: UserWithRoles) {
  return user.roles.map((entry: RoleEntry) => entry.role.name);
}

async function getLatestApprovalDecision(userId: string) {
  const decision = await prisma.approvalDecisionReason.findFirst({
    where: { accessRequest: { requesterId: userId } },
    orderBy: { createdAt: 'desc' },
  });

  if (!decision) return null;
  return {
    type: decision.decisionType,
    reason: decision.reason,
    createdAt: decision.createdAt,
  };
}

async function serializeUser(user: UserWithRoles) {
  const latestDecision = await getLatestApprovalDecision(user.id);
  return {
    id: user.id,
    firstname: user.firstname,
    surname: user.surname,
    email: user.email,
    country_code: user.countryCode,
    mobile_number: user.mobileNumber,
    roles: getRoleNames(user),
    accountStatus: user.accountStatus,
    latestDecision,
  };
}

async function createAuthResponse(user: UserWithRoles, message: string) {
  const roles = getRoleNames(user);
  const latestDecision = await getLatestApprovalDecision(user.id);

  return {
    message,
    token: signToken({ id: user.id, email: user.email, roles, accountStatus: user.accountStatus }),
    user: {
      id: user.id,
      firstname: user.firstname,
      surname: user.surname,
      email: user.email,
      roles,
      accountStatus: user.accountStatus,
      latestDecision,
    },
  };
}

async function findUserWithRolesById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
}

export async function registerUser(input: {
  firstname: string;
  surname: string;
  email: string;
  country_code: string;
  mobile_number: string;
  password: string;
  date_of_birth: string;
  referral_code?: string;
}) {
  return registerUserWithRole(input, 'PENDING');
}

export async function getPendingUsers() {
  const pendingRole = await prisma.role.findUnique({ where: { name: 'PENDING' } });
  if (!pendingRole) return [];

  const userRoles = await prisma.userRole.findMany({
    where: { roleId: pendingRole.id },
    include: { user: true },
  });

  return userRoles.map((ur) => ({
    id: ur.user.id,
    firstname: ur.user.firstname,
    surname: ur.user.surname,
    email: ur.user.email,
    createdAt: ur.user.createdAt,
  }));
}

export async function approveUser(userId: string) {
  const analystRole = await prisma.role.findUnique({ where: { name: 'ANALYST' } });
  const pendingRole = await prisma.role.findUnique({ where: { name: 'PENDING' } });
  if (!analystRole || !pendingRole) throw new HttpError(500, 'Roles not configured');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'User not found');

  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId, roleId: pendingRole.id } }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: analystRole.id } },
      update: {},
      create: { userId, roleId: analystRole.id },
    }),
  ]);

  await logAudit({ userId, action: 'APPROVE_USER', entity: 'User', entityId: userId });

  return { message: 'User approved successfully', userId };
}

async function registerUserWithRole(input: RegisterInput, roleName: 'ANALYST' | 'ADMIN' | 'PENDING') {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.email.toLowerCase() },
        { countryCode: input.country_code, mobileNumber: input.mobile_number },
      ],
    },
  });

  if (existing) throw new HttpError(409, 'User already exists');

  const userRole = await prisma.role.findUnique({ where: { name: roleName } });
  if (!userRole) throw new HttpError(500, 'Default role not configured');

  const createdUser = await prisma.user.create({
    data: {
      firstname: input.firstname,
      surname: input.surname,
      email: input.email.toLowerCase(),
      countryCode: input.country_code,
      mobileNumber: input.mobile_number,
      referralCode: input.referral_code,
      passwordHash: await hashPassword(input.password),
      passwordChangedAt: new Date(),
      dateOfBirth: new Date(input.date_of_birth),
      roles: {
        create: [{ roleId: userRole.id }],
      },
    },
    include: { roles: { include: { role: true } } },
  });

  await logAudit({ userId: createdUser.id, action: 'REGISTER', entity: 'User', entityId: createdUser.id });

  return createAuthResponse(createdUser, 'Account created successfully');
}

export async function registerAdminUser(input: RegisterInput) {
  const result = await registerUserWithRole(input, 'ADMIN');
  await logAudit({ userId: result.user.id, action: 'REGISTER_ADMIN', entity: 'User', entityId: result.user.id });
  return {
    message: 'Admin account created successfully',
    user: result.user,
  };
}

export async function loginUser(
  input: { identifier: string; password: string },
  metadata?: { userAgent?: string; ipAddress?: string }
) {
  const normalizedIdentifier = input.identifier.trim();
  const emailIdentifier = normalizedIdentifier.toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: emailIdentifier },
        { mobileNumber: normalizedIdentifier },
      ],
    },
    include: { roles: { include: { role: true } } },
  });

  if (!user) throw new HttpError(401, 'Invalid credentials');
  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw new HttpError(401, 'Invalid credentials');

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await logAudit({
    userId: user.id,
    action: 'LOGIN',
    entity: 'User',
    entityId: user.id,
    metadata,
  });

  return createAuthResponse(user, 'Login successful');
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return { message: 'If the email exists, a reset token has been generated.' };
  }

  const token = randomToken();
  const tokenHash = sha256(token);
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: tokenHash,
      resetTokenExpires: expires,
    },
  });

  await logAudit({ userId: user.id, action: 'FORGOT_PASSWORD', entity: 'User', entityId: user.id });
  return { message: 'Reset token generated', reset_token: token };
}

export async function resetPassword(input: { token: string; new_password: string }) {
  const tokenHash = sha256(input.token);
  const user = await prisma.user.findFirst({
    where: {
      resetToken: tokenHash,
      resetTokenExpires: { gt: new Date() },
    },
  });

  if (!user) throw new HttpError(400, 'Invalid or expired reset token');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(input.new_password),
      passwordChangedAt: new Date(),
      resetToken: null,
      resetTokenExpires: null,
    },
  });

  await logAudit({ userId: user.id, action: 'RESET_PASSWORD', entity: 'User', entityId: user.id });
  return { message: 'Password reset successfully' };
}

export async function getCurrentUser(userId: string) {
  const user = await findUserWithRolesById(userId);
  if (!user) throw new HttpError(404, 'User not found');

  return serializeUser(user);
}

export function getSsoAuthorizationUrl(provider: SsoProvider) {
  const state = randomToken();

  if (provider === 'google') {
    if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_REDIRECT_URI) {
      throw new HttpError(503, 'Google sign-in is not configured.');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.GOOGLE_OAUTH_CLIENT_ID,
      redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URI,
      scope: 'openid email profile',
      prompt: 'select_account',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  if (provider === 'microsoft') {
    if (!env.MICROSOFT_OAUTH_CLIENT_ID || !env.MICROSOFT_OAUTH_REDIRECT_URI) {
      throw new HttpError(503, 'Microsoft sign-in is not configured.');
    }

    const params = new URLSearchParams({
      client_id: env.MICROSOFT_OAUTH_CLIENT_ID,
      response_type: 'code',
      redirect_uri: env.MICROSOFT_OAUTH_REDIRECT_URI,
      response_mode: 'query',
      scope: 'openid profile email User.Read',
      state,
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  throw new HttpError(400, 'Unsupported SSO provider');
}
