# Cloudinary Setup for Image Uploads

## Overview
This application now uses Cloudinary for image storage instead of local file storage. This is required for Vercel deployment since Vercel doesn't support persistent file storage.

## Setup Instructions

### 1. Create a Cloudinary Account
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your Cloudinary Credentials
1. After logging in, go to your Dashboard
2. You'll see your account details:
   - **Cloud Name**
   - **API Key** 
   - **API Secret**

### 3. Update Environment Variables
Update your `config/config.env` file with your Cloudinary credentials:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### 4. For Vercel Deployment
Add the same environment variables in your Vercel dashboard:
1. Go to your project in Vercel
2. Navigate to Settings > Environment Variables
3. Add these three variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

## What Changed

### Backend Changes
1. **New Dependencies**: Added `cloudinary` and `multer-storage-cloudinary`
2. **Upload Middleware**: Updated to use Cloudinary storage instead of local disk storage
3. **Product Upload Routes**: Modified to handle Cloudinary URLs and public IDs
4. **Product Image Model**: Added `public_id` field for Cloudinary image management
5. **Image Deletion**: Now deletes images from Cloudinary when removing products

### Image Management
- Images are now stored in Cloudinary under the folder `miorah-collections/products`
- Images are automatically optimized (quality and format)
- Maximum dimensions are limited to 1200x1200px
- Image URLs are now Cloudinary URLs (e.g., `https://res.cloudinary.com/your-cloud/image/upload/...`)

### File Size & Format Support
- Maximum file size: 15MB per image
- Supported formats: JPG, JPEG, PNG, WEBP
- Up to 10 images per product

## Benefits
1. **Vercel Compatible**: Works with serverless deployments
2. **Automatic Optimization**: Images are automatically optimized for web
3. **CDN Delivery**: Fast global image delivery
4. **Scalable**: No server storage limitations
5. **Backup**: Images are safely stored in the cloud

## Troubleshooting

### Common Issues
1. **Invalid Credentials**: Double-check your Cloudinary credentials in environment variables
2. **Upload Errors**: Ensure file size is under 15MB and format is supported
3. **Missing Images**: Check if environment variables are properly set in production

### Testing
You can test the upload functionality by:
1. Starting your server with the new Cloudinary configuration
2. Uploading a product image through your admin panel
3. Verifying the image appears correctly on the frontend
4. Checking your Cloudinary dashboard to see the uploaded images

## Migration Notes
- Existing local images will still work if you have them
- New uploads will go to Cloudinary
- You can manually migrate existing images by re-uploading them through the admin panel
