import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  registerDecorator,
  ValidateNested,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

// Validador personalizado para documento según tipo
function IsValidDocumentNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidDocumentNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const obj = args.object as any;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const documentTypeId = obj.documentTypeId;

          if (!value) return false;

          // DNI: 7-8 dígitos
          if (documentTypeId === 1) {
            return /^\d{7,8}$/.test(value);
          }

          // Pasaporte: 6-9 alfanuméricos
          if (documentTypeId === 3) {
            return /^[A-Z0-9]{6,9}$/i.test(value);
          }

          return false;
        },
        defaultMessage(args: ValidationArguments) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const obj = args.object as any;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const documentTypeId = obj.documentTypeId;

          if (documentTypeId === 1) {
            return 'DNI must be 7 or 8 digits';
          }
          if (documentTypeId === 3) {
            return 'Passport must be 6 to 9 alphanumeric characters';
          }
          return 'Invalid document number format';
        },
      },
    });
  };
}

export class ExperienceItem {
  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title is required' })
  title: string;

  @IsString({ message: 'project must be a string' })
  @IsNotEmpty({ message: 'project is required' })
  project: string;

  @IsDateString(undefined, {
    message: 'startDate must be a valid ISO date (YYYY-MM-DD)',
  })
  @IsNotEmpty({ message: 'startDate is required' })
  startDate: string;

  @IsDateString(undefined, {
    message: 'endDate must be a valid ISO date (YYYY-MM-DD)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return value;
  })
  endDate?: string;

  @IsBoolean({ message: 'isCurrent must be a boolean' })
  @IsNotEmpty({ message: 'isCurrent is required' })
  isCurrent: boolean;
}

export class SocialLink {
  @IsString({ message: 'platform must be a string' })
  @IsNotEmpty({ message: 'platform is required' })
  platform: string;

  @IsString({ message: 'url must be a string' })
  @IsNotEmpty({ message: 'url is required' })
  url: string;
}

export class EducationItem {
  @IsString({ message: 'institution must be a string' })
  @IsNotEmpty({ message: 'institution is required' })
  institution: string;

  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title is required' })
  title: string;

  @IsDateString(undefined, {
    message: 'startDate must be a valid ISO date (YYYY-MM-DD)',
  })
  @IsNotEmpty({ message: 'startDate is required' })
  startDate: string;

  @IsDateString(undefined, {
    message: 'endDate must be a valid ISO date (YYYY-MM-DD)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return value;
  })
  endDate?: string;

  @IsBoolean({ message: 'isCurrent must be a boolean' })
  @IsNotEmpty({ message: 'isCurrent is required' })
  isCurrent: boolean;
}

export class Certification {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @IsString({ message: 'url must be a string' })
  @IsNotEmpty({ message: 'url is required' })
  url: string;
}

export class CreateProfileDto {
  @IsNotEmpty({ message: 'userId is required' })
  @IsNumber({}, { message: 'userId must be a number' })
  @Type(() => Number)
  userId: number;

  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @IsString({ message: 'lastName must be a string' })
  @IsNotEmpty({ message: 'lastName is required' })
  lastName: string;

  @IsString({ message: 'documentNumber must be a string' })
  @IsNotEmpty({ message: 'documentNumber is required' })
  @IsValidDocumentNumber()
  documentNumber: string;

  @IsNumber({}, { message: 'documentTypeId must be a number' })
  @IsNotEmpty({ message: 'documentTypeId is required' })
  @IsIn([1, 3], {
    message: 'documentTypeId must be 1 (DNI) or 3 (Pasaporte)',
  })
  @Type(() => Number)
  documentTypeId: number;

  @IsString({ message: 'profession must be a string' })
  @IsNotEmpty({ message: 'profession is required' })
  profession: string;

  @IsString({ message: 'areaCode must be a string' })
  @IsOptional()
  @Matches(/^\+\d{1,4}$/, {
    message: 'areaCode must be in format +XX (e.g., +54, +1)',
  })
  areaCode?: string;

  @IsString({ message: 'phoneNumber must be a string' })
  @IsOptional()
  @Matches(/^[0-9]{6,15}$/, {
    message: 'phoneNumber must be 6 to 15 digits without area code',
  })
  phoneNumber?: string;

  @IsString({ message: 'country must be a string' })
  @IsOptional()
  country: string;

  @IsString({ message: 'state must be a string' })
  @IsOptional()
  state: string;

  // Campos opcionales
  @IsDateString({}, { message: 'birthDate must be a valid date' })
  @IsNotEmpty({ message: 'birthDate is required' })
  birthDate: string;

  @IsString({ message: 'profilePicture must be a string' })
  @IsOptional()
  profilePicture?: string;

  @IsString({ message: 'coverPicture must be a string' })
  @IsOptional()
  coverPicture?: string;

  @IsArray()
  @IsNumber({}, { each: true, message: 'skillIds must be an array of numbers' })
  @ArrayMaxSize(20, { message: 'skillIds must have at most 20 items' })
  @IsOptional()
  skills?: number[];

  @IsString({ message: 'description must be a string' })
  @MaxLength(500, { message: 'description must have at most 500 characters' })
  @IsOptional()
  description?: string;

  @IsArray({ message: 'experience must be an array' })
  @ValidateNested({
    each: true,
    message: 'each experience must be an object',
  })
  @Type(() => ExperienceItem)
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value;
  })
  experience?: ExperienceItem[];

  @IsArray({ message: 'socialLinks must be an array' })
  @ValidateNested({
    each: true,
    message: 'each socialLink must be an object',
  })
  @Type(() => SocialLink)
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value;
  })
  socialLinks?: SocialLink[];

  @IsArray({ message: 'education must be an array' })
  @ValidateNested({
    each: true,
    message: 'each education must be an object',
  })
  @Type(() => EducationItem)
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value;
  })
  education?: EducationItem[];

  @IsArray({ message: 'certifications must be an array' })
  @ValidateNested({
    each: true,
    message: 'each certification must be an object',
  })
  @Type(() => Certification)
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value;
  })
  certifications?: Certification[];
}
