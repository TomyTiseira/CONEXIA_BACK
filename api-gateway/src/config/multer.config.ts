import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const deliveryMulterConfig = {
  storage: diskStorage({
    destination: './uploads/deliveries',
    filename: (req: Request, file: Express.Multer.File, cb) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB máximo
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Tipo de archivo no permitido. Solo se permiten imágenes, PDFs, documentos de Office y archivos comprimidos.',
        ),
        false,
      );
    }
  },
};
