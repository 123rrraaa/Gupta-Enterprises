# Cloudinary Setup Guide

## Step 1: Create Cloudinary Account
1. Go to https://cloudinary.com/
2. Sign up for a **free account**
3. Confirm your email

## Step 2: Get Your Credentials
1. Go to your Cloudinary **Dashboard**
2. Find your credentials:
   - **Cloud Name**: `your_cloud_name`
   - **API Key**: `your_api_key`
   - **API Secret**: `your_api_secret`

## Step 3: Add to Backend `.env`
Update `/backend/.env` with your Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## Step 4: Install Dependencies
In the backend folder, run:
```bash
cd backend
npm install
```

This installs:
- `cloudinary` - Cloud storage SDK
- `express-fileupload` - File upload middleware
- `dotenv` - Environment configuration

## Step 5: Restart Backend
```bash
npm start
```

You should see:
```
Connected to MongoDB
Server running on http://localhost:5000
```

## Step 6: Test Image Upload
1. Go to Admin Dashboard `/admin`
2. Click "Add New Product"
3. Select "Product Image" file input
4. Choose a JPG/PNG/GIF image
5. The system will:
   - ✓ Upload to Cloudinary automatically
   - ✓ Show "Image uploaded to Cloudinary" message
   - ✓ Store Cloudinary URL in MongoDB

## How It Works

```
User Form
    ↓
Select Image File
    ↓
Upload to Cloudinary (automatic)
    ↓
Get Cloudinary URL
    ↓
Save Product with URL in MongoDB
    ↓
Fetch from Cloudinary on Product Page
```

## Features

✓ Automatic image upload to Cloudinary
✓ Images stored in `gupta-enterprises/products` folder
✓ Free tier supports up to 75,000 images
✓ Fast CDN delivery
✓ Automatic image optimization
✓ No need for manual file management

## Troubleshooting

**"Failed to upload image to Cloudinary"**
- Check .env file has correct credentials
- Restart backend: `npm start`
- Verify file is JPG/PNG/GIF/WebP

**Backend won't start**
- Run: `npm install` first
- Check MONGO_URI in .env is correct
- Check no port conflicts on 5000

**Images not showing on product page**
- Verify image uploaded successfully (green message in form)
- Check Cloudinary dashboard for uploaded files
- Refresh browser cache

