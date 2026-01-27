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
 * Получить или создать беседу с пользователем
 */
router.post('/conversation/:userId', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { userId: targetUserId } = req.params;

    // Проверяем что пользователь не создает беседу с самим собой
    if (currentUser.userId === targetUserId) {
      res.status(400).json({ error: 'Cannot create conversation with yourself' });
      return;
    }

    // Проверяем существование целевого пользователя
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Ищем существующую беседу
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

    // Если беседы нет - создаем новую
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

    // Получаем информацию о собеседнике
    const otherUser = await userRepository.findById(targetUserId);

    res.status(200).json({
      conversation,
      otherUser: otherUser ? {
        id: otherUser.id,
        name: otherUser.name,
        photoUrl: otherUser.photoUrl,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/messages/:conversationId
 * Отправить сообщение в беседу
 */
router.post('/:conversationId', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { conversationId } = req.params;
    const { text } = SendMessageSchema.parse(req.body);

    // Проверяем существование беседы
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Проверяем что пользователь - участник беседы
    if (!conversation.participants.includes(currentUser.userId)) {
      res.status(403).json({ error: 'You are not a participant of this conversation' });
      return;
    }

    // Создаем сообщение
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: currentUser.userId,
        text,
      },
    });

    // Обновляем последнее сообщение в беседе
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
 * Получить все сообщения в беседе
 */
router.get('/:conversationId', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Проверяем существование беседы
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Проверяем что пользователь - участник беседы
    if (!conversation.participants.includes(currentUser.userId)) {
      res.status(403).json({ error: 'You are not a participant of this conversation' });
      return;
    }

    // Получаем сообщения
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    });

    const total = await prisma.message.count({
      where: { conversationId },
    });

    // Получаем информацию о собеседнике
    const otherUserId = conversation.participants.find(id => id !== currentUser.userId);
    const otherUser = otherUserId ? await userRepository.findById(otherUserId) : null;

    res.status(200).json({
      messages,
      otherUser: otherUser ? {
        id: otherUser.id,
        name: otherUser.name,
        photoUrl: otherUser.photoUrl,
      } : null,
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
 * Получить список всех бесед пользователя
 */
router.get('/conversations/list', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);

    // Получаем все беседы пользователя
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

    // Обогащаем данными о собеседниках
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId = conversation.participants.find(id => id !== currentUser.userId);
        const otherUser = otherUserId ? await userRepository.findById(otherUserId) : null;
        
        // Считаем непрочитанные сообщения
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
          otherUser: otherUser ? {
            id: otherUser.id,
            name: otherUser.name,
            photoUrl: otherUser.photoUrl,
          } : null,
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
 * Пометить все сообщения в беседе как прочитанные
 */
router.put('/:conversationId/read', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { conversationId } = req.params;

    // Проверяем существование беседы
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Проверяем что пользователь - участник беседы
    if (!conversation.participants.includes(currentUser.userId)) {
      res.status(403).json({ error: 'You are not a participant of this conversation' });
      return;
    }

    // Помечаем все сообщения как прочитанные (кроме собственных)
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
