import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ResearcherType } from '../types/researcher-application.types';

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export class CreateResearcherApplicationDto {
  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEmail()
  institutionEmail?: string;

  @IsString()
  @MinLength(1)
  phoneCode!: string;

  @IsString()
  @MinLength(7)
  @MaxLength(20)
  mobileNumber!: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'password must include an uppercase letter' })
  @Matches(/[a-z]/, { message: 'password must include a lowercase letter' })
  @Matches(/[0-9]/, { message: 'password must include a number' })
  password!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsString()
  @MinLength(2)
  institution!: string;

  @IsString()
  @MinLength(2)
  department!: string;

  @IsString()
  @MinLength(2)
  roleTitle!: string;

  @IsEnum(ResearcherType)
  researcherType!: ResearcherType;

  @IsString()
  @MinLength(2)
  country!: string;

  @IsString()
  @MinLength(2)
  city!: string;

  @IsString()
  yearsOfExperience!: string;

  @IsString()
  @MinLength(3)
  researchArea!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(500)
  shortBio!: string;

  @IsString()
  @MinLength(20)
  researchInterests!: string;

  @IsString()
  @MinLength(20)
  platformPurpose!: string;

  @IsString()
  @MinLength(10)
  expectedDatasets!: string;

  @IsString()
  collaborationType!: string;

  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  featureNeeds!: string[];

  @IsString()
  usesSensitiveData!: string;

  @IsString()
  irbRequired!: string;

  @IsOptional()
  @IsString()
  irbProtocolNumber?: string;

  @IsString()
  dataSensitivityLevel!: string;

  @IsOptional()
  @IsString()
  fundingSource?: string;

  @IsString()
  @MinLength(2)
  supervisorName!: string;

  @IsEmail()
  supervisorEmail!: string;
}
