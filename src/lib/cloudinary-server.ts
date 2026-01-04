/**
 * Server-side utility for uploading files to Cloudinary using the Node.js SDK
 * This file should ONLY be imported in server actions or API routes
 */

import { CloudinaryUploadOptions, CloudinaryUploadResult } from './cloudinary';

/**
 * Upload a buffer directly to Cloudinary using the Node.js SDK
 * This is efficient for server-generated files like PDFs
 */
export async function uploadBufferToCloudinary(
    buffer: Buffer,
    options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
    try {
        // Import SDK directly where needed to ensure this code only runs on server
        const { v2: cloudinary } = await import('cloudinary');

        // Configure Cloudinary
        cloudinary.config({
            cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        return new Promise((resolve, reject) => {
            const uploadOptions: any = {
                folder: options.folder,
                public_id: options.publicId || options.public_id,
                resource_type: options.resource_type || 'auto',
                format: options.format,
            };

            // Add overwrite option if public_id is provided
            if (uploadOptions.public_id) {
                uploadOptions.overwrite = true;
            }

            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload stream error:', error);
                        reject(error);
                        return;
                    }

                    if (!result) {
                        reject(new Error('No result from Cloudinary upload'));
                        return;
                    }

                    resolve({
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                        resource_type: result.resource_type,
                        format: result.format,
                        width: result.width,
                        height: result.height,
                        bytes: result.bytes,
                        original_filename: result.original_filename,
                    });
                }
            );

            // Write buffer to stream
            uploadStream.end(buffer);
        });
    } catch (error) {
        console.error('Error uploading buffer to Cloudinary:', error);
        throw error;
    }
}

/**
 * Upload a file path or URL to Cloudinary from the server using SDK
 * More robust than client-side fetch for server actions
 */
export async function uploadToServerCloudinary(
    fileIdentifier: string,
    options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
    try {
        const { v2: cloudinary } = await import('cloudinary');

        cloudinary.config({
            cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const uploadOptions: any = {
            folder: options.folder,
            public_id: options.publicId || options.public_id,
            resource_type: options.resource_type || 'auto',
            format: options.format,
        };

        const result = await cloudinary.uploader.upload(fileIdentifier, uploadOptions);

        return {
            secure_url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            original_filename: result.original_filename,
        };
    } catch (error) {
        console.error('Error uploading to server Cloudinary:', error);
        throw error;
    }
}
