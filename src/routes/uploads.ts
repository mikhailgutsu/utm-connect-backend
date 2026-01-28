import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate, getCurrentUser } from '@/middleware/authenticate';
import { FileService } from '@/services/FileService';
import { prisma } from '@/prisma/client';

const uploadsRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });
const fileService = new FileService();

/**
 * POST /api/uploads/avatar
 * Upload and set as profile picture (primary photo)
 */
uploadsRouter.post('/avatar', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userPayload = getCurrentUser(req);
    const userId = userPayload?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Save file
    const uploadedFile = fileService.saveFile(req.file);

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user: add to photoUrl[] and set as primaryPhotoUrl
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        photoUrl: [...(user.photoUrl || []), uploadedFile.url],
        primaryPhotoUrl: uploadedFile.url,
      },
    });

    return res.status(201).json({
      message: 'Avatar uploaded successfully',
      data: {
        filename: uploadedFile.filename,
        url: uploadedFile.url,
        primaryPhotoUrl: updatedUser.primaryPhotoUrl,
        allPhotos: updatedUser.photoUrl,
      },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return res.status(400).json({ error: (error as Error).message || 'Upload failed' });
  }
});

/**
 * POST /api/uploads/post/:postId
 * Upload image for post and add to user's photo gallery
 */
uploadsRouter.post('/post/:postId', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userPayload = getCurrentUser(req);
    const userId = userPayload?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { postId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Check if post exists and belongs to user
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'Cannot add images to posts of other users' });
    }

    // Save file
    const uploadedFile = fileService.saveFile(req.file);

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update post: add to photoUrls[]
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        photoUrls: [...post.photoUrls, uploadedFile.url],
      },
    });

    // Update user: add to photoUrl[]
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        photoUrl: [...(user.photoUrl || []), uploadedFile.url],
      },
    });

    return res.status(201).json({
      message: 'Image added to post successfully',
      data: {
        filename: uploadedFile.filename,
        url: uploadedFile.url,
        postPhotos: updatedPost.photoUrls,
        userPhotos: updatedUser.photoUrl,
      },
    });
  } catch (error) {
    console.error('Post image upload error:', error);
    return res.status(400).json({ error: (error as Error).message || 'Upload failed' });
  }
});

/**
 * DELETE /api/uploads/:fileUrl
 * Delete image file and remove from user's gallery
 */
uploadsRouter.delete('/:fileUrl', authenticate, async (req: Request, res: Response) => {
  try {
    const userPayload = getCurrentUser(req);
    const userId = userPayload?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { fileUrl } = req.params;
    const decodedUrl = decodeURIComponent(fileUrl);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user owns this image
    const fullUrl = `/uploads/${decodedUrl}`;
    const hasImage = user.photoUrl?.includes(fullUrl);

    if (!hasImage) {
      return res.status(403).json({ error: 'You do not own this image' });
    }

    // Delete file from storage
    fileService.deleteFile(decodedUrl);

    // Update user: remove from photoUrl[]
    const updatedPhotoUrl = (user.photoUrl || []).filter(url => url !== fullUrl);
    const newPrimaryPhoto = updatedPhotoUrl.length > 0 ? updatedPhotoUrl[0] : null;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        photoUrl: updatedPhotoUrl,
        // If deleted image was primary, set new primary to first remaining image
        primaryPhotoUrl: user.primaryPhotoUrl === fullUrl ? newPrimaryPhoto : user.primaryPhotoUrl,
      },
    });

    return res.status(200).json({
      message: 'Image deleted successfully',
      data: {
        deletedUrl: fullUrl,
        photoUrl: updatedUser.photoUrl,
        primaryPhotoUrl: updatedUser.primaryPhotoUrl,
      },
    });
  } catch (error) {
    console.error('Image deletion error:', error);
    return res.status(400).json({ error: (error as Error).message || 'Deletion failed' });
  }
});

/**
 * GET /api/uploads/gallery/:userId
 * Get all images of a user
 */
uploadsRouter.get('/gallery/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        primaryPhotoUrl: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        primaryPhoto: user.primaryPhotoUrl,
        photos: user.photoUrl || [],
        totalPhotos: (user.photoUrl || []).length,
      },
    });
  } catch (error) {
    console.error('Gallery fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

export default uploadsRouter;
