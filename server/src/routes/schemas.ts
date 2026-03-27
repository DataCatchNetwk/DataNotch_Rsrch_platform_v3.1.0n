import { z } from 'zod';

/** Strip everything except digits from a string */
const digitsOnly = (v: string) => v.replace(/\D/g, '');

/** Check that a date string represents someone at least 18 years old */
function isAdult(dateString: string) {
  const dob = new Date(dateString);
  if (isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 18;
}

/** Coerce empty / whitespace-only strings to undefined so `.optional()` works */
const optionalString = z
  .string()
  .transform((v) => (v.trim() === '' ? undefined : v.trim()))
  .optional();

export const registerSchema = z.object({
  firstname: z.string().trim().min(1, 'First name is required').max(100),
  surname: z.string().trim().min(1, 'Surname is required').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  country_code: z.string().trim().min(1, 'Country code is required').max(10),
  mobile_number: z
    .string()
    .transform(digitsOnly)
    .pipe(z.string().length(10, 'Mobile number must be 10 digits')),
  referral_code: optionalString.pipe(
    z.string().max(50, 'Referral code too long').optional(),
  ),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  date_of_birth: z
    .string()
    .trim()
    .min(1, 'Date of birth is required')
    .refine(isAdult, 'User must be at least 18 years old'),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Token is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createHealthDataSchema = z.object({
  title: z.string().min(1),
  data_year: z.number().int().gte(1900).lte(2100),
  value: z.number().optional(),
  notes: z.string().optional(),
  domain_id: z.string().min(1),
  subdomain_id: z.string().min(1),
  category_id: z.string().min(1),
  subcategory_id: z.string().optional(),
  health_outcome_id: z.string().min(1),
  variable_id: z.string().min(1),
  demographic_id: z.string().min(1),
  geography_unit_id: z.string().min(1),
  data_unit_id: z.string().min(1),
  data_source_id: z.string().min(1),
  data_portal_id: z.string().optional(),
  data_format_id: z.string().optional(),
  data_location_id: z.string().optional(),
});
