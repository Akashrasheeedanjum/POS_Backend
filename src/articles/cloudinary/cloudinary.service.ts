import { Injectable, Inject } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
// import * as streamifier from 'streamifier';
import { CloudinaryResponse } from './cloudinary-response';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private readonly cloudinary) {}

  async uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        { folder: 'articles' },
        (error, result) => {
          if (error) return reject(error); 
          console.log("ERROR of Cloudinary",error)
          resolve(result as unknown as CloudinaryResponse);
        },
      );
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}