import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { catchError } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { CreateProfileHttpDto } from './dto/create-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyUserDto } from './dto/verify-user.dto';

@Controller('users')
export class UsersController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('ping')
  ping() {
    return this.client.send('ping', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.client.send('createUser', createUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('verify')
  verify(@Body() verifyUserDto: VerifyUserDto) {
    return this.client.send('verifyUser', verifyUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('resend-verification')
  resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.client.send('resendVerification', resendVerificationDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post(':userId/profile')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@UseInterceptors(
  FileFieldsInterceptor(
    [
      { name: 'profilePicture', maxCount: 1 },
      { name: 'coverPicture',   maxCount: 1 },
    ],
    { limits: { fileSize: 5 * 1024 * 1024 } }
  )
)
createProfile(
  @Param('userId') userId: string,
  @Body() dto: CreateProfileHttpDto,
  @UploadedFiles()
  files: {
    profilePicture?: Express.Multer.File[];
    coverPicture?:   Express.Multer.File[];
  }
) {
  const payload = {
    userId: +userId,
    ...dto,
    profilePicture: files.profilePicture?.[0]?.filename,
    coverPicture:   files.coverPicture?.[0]?.filename,
  };
  return this.client.send('createProfile', payload).pipe(
    catchError(error => {
      throw new RpcException(error);
    }),
  );
}

}
