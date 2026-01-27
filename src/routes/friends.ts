import express from 'express';
import { UserRepository } from '@/repositories';
import { authenticate, getCurrentUser } from '@/middleware/authenticate';
import { z } from 'zod';

const router = express.Router();
const userRepository = new UserRepository();

const SendFriendRequestSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
});

/**
 * POST /api/friends/request
 * Отправить запрос на дружбу
 */
router.post('/request', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { targetUserId } = SendFriendRequestSchema.parse(req.body);

    // Проверяем что пользователь не отправляет запрос самому себе
    if (currentUser.userId === targetUserId) {
      res.status(400).json({ error: 'Cannot send friend request to yourself' });
      return;
    }

    // Получаем обоих пользователей
    const [sender, target] = await Promise.all([
      userRepository.findById(currentUser.userId),
      userRepository.findById(targetUserId),
    ]);

    if (!sender || !target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Проверяем что уже не друзья
    if (sender.friends.includes(targetUserId)) {
      res.status(400).json({ error: 'Already friends' });
      return;
    }

    // Проверяем что запрос уже не отправлен
    if (sender.friendRequestsSent.includes(targetUserId)) {
      res.status(400).json({ error: 'Friend request already sent' });
      return;
    }

    // Обновляем оба профиля
    await Promise.all([
      // Добавляем targetUserId в мои исходящие запросы
      userRepository.update(currentUser.userId, {
        friendRequestsSent: [...sender.friendRequestsSent, targetUserId],
      }),
      // Добавляем мой ID в входящие запросы целевого пользователя
      userRepository.update(targetUserId, {
        friendRequestsReceived: [...target.friendRequestsReceived, currentUser.userId],
      }),
    ]);

    res.status(200).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(500).json({ error: (error as Error).message });
    }
  }
});

/**
 * POST /api/friends/accept
 * Принять запрос на дружбу
 */
router.post('/accept', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { requesterId } = z.object({
      requesterId: z.string().min(1, 'Requester ID is required'),
    }).parse(req.body);

    // Получаем обоих пользователей
    const [me, requester] = await Promise.all([
      userRepository.findById(currentUser.userId),
      userRepository.findById(requesterId),
    ]);

    if (!me || !requester) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Проверяем что запрос действительно существует
    if (!me.friendRequestsReceived.includes(requesterId)) {
      res.status(400).json({ error: 'Friend request not found' });
      return;
    }

    // Проверяем что уже не друзья
    if (me.friends.includes(requesterId)) {
      res.status(400).json({ error: 'Already friends' });
      return;
    }

    // Обновляем оба профиля
    await Promise.all([
      // Обновляю свой профиль: удаляю из входящих запросов и добавляю в друзья
      userRepository.update(currentUser.userId, {
        friendRequestsReceived: me.friendRequestsReceived.filter(id => id !== requesterId),
        friends: [...me.friends, requesterId],
      }),
      // Обновляю профиль отправителя: удаляю из исходящих запросов и добавляю в друзья
      userRepository.update(requesterId, {
        friendRequestsSent: requester.friendRequestsSent.filter(id => id !== currentUser.userId),
        friends: [...requester.friends, currentUser.userId],
      }),
    ]);

    res.status(200).json({ message: 'Friend request accepted' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(500).json({ error: (error as Error).message });
    }
  }
});

/**
 * POST /api/friends/remove
 * Удалить из друзей
 */
router.post('/remove', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { friendId } = z.object({
      friendId: z.string().min(1, 'Friend ID is required'),
    }).parse(req.body);

    // Проверяем что не пытаемся удалить самого себя
    if (currentUser.userId === friendId) {
      res.status(400).json({ error: 'Cannot remove yourself' });
      return;
    }

    // Получаем обоих пользователей
    const [me, friend] = await Promise.all([
      userRepository.findById(currentUser.userId),
      userRepository.findById(friendId),
    ]);

    if (!me || !friend) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Проверяем что действительно друзья
    if (!me.friends.includes(friendId)) {
      res.status(400).json({ error: 'Not friends' });
      return;
    }

    // Удаляем друг друга из массивов друзей
    await Promise.all([
      userRepository.update(currentUser.userId, {
        friends: me.friends.filter(id => id !== friendId),
      }),
      userRepository.update(friendId, {
        friends: friend.friends.filter(id => id !== currentUser.userId),
      }),
    ]);

    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(500).json({ error: (error as Error).message });
    }
  }
});

export default router;
