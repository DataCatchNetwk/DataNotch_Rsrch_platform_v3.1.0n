import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/errors.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { randomToken, sha256 } from '../utils/crypto.js';
import { signToken } from '../utils/jwt.js';
import { logAudit } from './audit.service.js';

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
  roles: RoleEntry[];
};

function getRoleNames(user: UserWithRoles) {
  return user.roles.map((entry: RoleEntry) => entry.role.name);
}

function serializeUser(user: UserWithRoles) {
  return {
    id: user.id,
    firstname: user.firstname,
    surname: user.surname,
    email: user.email,
    country_code: user.countryCode,
    mobile_number: user.mobileNumber,
    roles: getRoleNames(user),
  };
}

function createAuthResponse(user: UserWithRoles, message: string) {
  const roles = getRoleNames(user);

  return {
    message,
    token: signToken({ id: user.id, email: user.email, roles }),
    user: {
      id: user.id,
      firstname: user.firstname,
      surname: user.surname,
      email: user.email,
      roles,
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
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.email.toLowerCase() },
        { countryCode: input.country_code, mobileNumber: input.mobile_number },
      ],
    },
  });

  if (existing) throw new HttpError(409, 'User already exists');

  const userRole = await prisma.role.findUnique({ where: { name: 'ANALYST' } });
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

export async function loginUser(input: { identifier: string; password: string }) {
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

  await logAudit({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id });

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
