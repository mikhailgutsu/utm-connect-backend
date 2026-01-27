import express from 'express';
import { UserRepository } from '@/repositories';
import { prisma } from '@/prisma/client';
import { authenticate, getCurrentUser } from '@/middleware/authenticate';
import { z } from 'zod';

const router = express.Router();
const userRepository = new UserRepository();

const SendMessageSchema = z.object({
  text: z.string().min(1, 'Message text is required'),
});

/**
 * POST /api/messages/conversation/:userId
 * Create or get a conversation with a specific user
 */
router.post('/conversation/:userId', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { userId: targetUserId } = req.params;

    // Check that the user is not creating a conversation with themselves
    if (currentUser.userId === targetUserId) {
      res.status(400).json({ error: 'Cannot create conversation with yourself' });
      return;
    }

    // Check that the target user exists
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Search for an existing conversation
    const participants = [currentUser.userId, targetUserId].sort();

    let conversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          hasEvery: participants,
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    // If not found, create a new conversation
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants,
        },
        include: {
          messages: true,
        },
      });
    }

    // Get information about the other user
    const otherUser = await userRepository.findById(targetUserId);

    res.status(200).json({
      conversation,
      otherUser: otherUser
        ? {
            id: otherUser.id,
            name: otherUser.name,
            photoUrl: otherUser.photoUrl,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/messages/:conversationId
 * Send a message in a conversation
 */
router.post('/:conversationId', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { conversationId } = req.params;
    const { text } = SendMessageSchema.parse(req.body);

    // Verify conversation existence
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Verify that the user is a participant in the conversation
    if (!conversation.participants.includes(currentUser.userId)) {
      res.status(403).json({ error: 'You are not a participant of this conversation' });
      return;
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: currentUser.userId,
        text,
      },
    });

    // Update conversation's last message info
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: text,
        lastMessageAt: new Date(),
      },
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(500).json({ error: (error as Error).message });
    }
  }
});

/**
 * GET /api/messages/:conversationId
 * Get all messages in a conversation
 */
router.get('/:conversationId', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Verify conversation existence
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Verify that the user is a participant in the conversation
    if (!conversation.participants.includes(currentUser.userId)) {
      res.status(403).json({ error: 'You are not a participant of this conversation' });
      return;
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    });

    const total = await prisma.message.count({
      where: { conversationId },
    });

    // Get information about the other user
    const otherUserId = conversation.participants.find((id) => id !== currentUser.userId);
    const otherUser = otherUserId ? await userRepository.findById(otherUserId) : null;

    res.status(200).json({
      messages,
      otherUser: otherUser
        ? {
            id: otherUser.id,
            name: otherUser.name,
            photoUrl: otherUser.photoUrl,
          }
        : null,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/messages/conversations
 * Get a list of all user's conversations
 */
router.get('/conversations/list', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);

    // Get all user's conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          has: currentUser.userId,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Enrich conversations with other user info and unread message count
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId = conversation.participants.find((id) => id !== currentUser.userId);
        const otherUser = otherUserId ? await userRepository.findById(otherUserId) : null;

        // Count unread messages
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: currentUser.userId },
            isRead: false,
          },
        });

        return {
          id: conversation.id,
          participants: conversation.participants,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          createdAt: conversation.createdAt,
          unreadCount,
          otherUser: otherUser
            ? {
                id: otherUser.id,
                name: otherUser.name,
                photoUrl: otherUser.photoUrl,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      conversations: conversationsWithUsers,
      total: conversationsWithUsers.length,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * PUT /api/messages/:conversationId/read
 * Mark all messages in a conversation as read
 */
router.put('/:conversationId/read', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { conversationId } = req.params;

    // Verify conversation existence
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Verify that the user is a participant in the conversation
    if (!conversation.participants.includes(currentUser.userId)) {
      res.status(403).json({ error: 'You are not a participant of this conversation' });
      return;
    }

    // Mark all messages as read (except own)
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: currentUser.userId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
