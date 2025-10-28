import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
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

// Validador personalizado para documento según tipo (igual que en CreateProfileDto)
function IsValidDocumentNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidDocumentNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const documentTypeId = obj.documentTypeId;

          // Si no hay documentTypeId, no validamos (será validado por otros decoradores)
          if (documentTypeId === undefined || documentTypeId === null) {
            return true;
          }

          // Validar según el tipo de documento
          if (documentTypeId === 1) {
            // DNI: 7 u 8 dígitos numéricos
            return /^\d{7,8}$/.test(value);
          } else if (documentTypeId === 3) {
            // Pasaporte: 6-9 caracteres alfanuméricos
            return /^[A-Z0-9]{6,9}$/i.test(value);
          }

          return false;
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as any;
          const documentTypeId = obj.documentTypeId;

          if (documentTypeId === 1) {
            return 'DNI must be 7 or 8 digits';
          } else if (documentTypeId === 3) {
            return 'Pasaporte must be 6 to 9 alphanumeric characters';
          }

          return 'Invalid document number';
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

export class UpdateProfileDto {
  @IsNotEmpty({ message: 'userId is required' })
  @IsNumber({}, { message: 'userId must be a number' })
  userId: number;

  @IsString({ message: 'name must be a string' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'lastName must be a string' })
  @IsOptional()
  lastName?: string;

  @IsString({ message: 'profession must be a string' })
  @IsOptional()
  profession?: string;

  @IsString({ message: 'areaCode must be a string' })
  @IsOptional()
  @Matches(/^\+\d{1,4}$/, {
    message: 'areaCode must be in format +XX (e.g., +54, +1)',
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    return value;
  })
  areaCode?: string;

  @IsString({ message: 'phoneNumber must be a string' })
  @IsOptional()
  @Matches(/^[0-9]{6,15}$/, {
    message: 'phoneNumber must be 6 to 15 digits without area code',
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    return value;
  })
  phoneNumber?: string;

  @IsString({ message: 'country must be a string' })
  @IsOptional()
  country?: string;

  @IsString({ message: 'state must be a string' })
  @IsOptional()
  state?: string;

  @IsString({ message: 'profilePicture must be a string' })
  @IsOptional()
  profilePicture?: string;

  @IsString({ message: 'coverPicture must be a string' })
  @IsOptional()
  coverPicture?: string;

  @IsArray()
  @IsNumber({}, { each: true, message: 'skills must be an array of numbers' })
  @ArrayMaxSize(20, { message: 'skills must have at most 20 items' })
  @IsOptional()
  skills?: number[];

  @IsString({ message: 'description must be a string' })
  @MaxLength(500, { message: 'description must have at most 500 characters' })
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({
    each: true,
    message: 'experience must be an array of objects',
  })
  @Type(() => ExperienceItem)
  @IsOptional()
  experience?: ExperienceItem[];

  @IsArray()
  @ValidateNested({
    each: true,
    message: 'socialLinks must be an array of objects',
  })
  @Type(() => SocialLink)
  @IsOptional()
  socialLinks?: SocialLink[];

  @IsArray()
  @ValidateNested({
    each: true,
    message: 'education must be an array of objects',
  })
  @Type(() => EducationItem)
  @IsOptional()
  education?: EducationItem[];

  @IsArray()
  @ValidateNested({
    each: true,
    message: 'certifications must be an array of objects',
  })
  @Type(() => Certification)
  @IsOptional()
  certifications?: Certification[];
}
