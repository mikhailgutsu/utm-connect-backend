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
 * Send a friend request
 */
router.post('/request', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { targetUserId } = SendFriendRequestSchema.parse(req.body);

    // Check that the user is not sending a request to themselves
    if (currentUser.userId === targetUserId) {
      res.status(400).json({ error: 'Cannot send friend request to yourself' });
      return;
    }

    // Get both users
    const [sender, target] = await Promise.all([
      userRepository.findById(currentUser.userId),
      userRepository.findById(targetUserId),
    ]);

    if (!sender || !target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check that they are not already friends
    if (sender.friends.includes(targetUserId)) {
      res.status(400).json({ error: 'Already friends' });
      return;
    }

    // Check that the friend request has not already been sent
    if (sender.friendRequestsSent.includes(targetUserId)) {
      res.status(400).json({ error: 'Friend request already sent' });
      return;
    }

    // Update both profiles
    await Promise.all([
      // Add targetUserId to my outgoing requests
      userRepository.update(currentUser.userId, {
        friendRequestsSent: [...sender.friendRequestsSent, targetUserId],
      }),
      // Add my ID to the target user's incoming requests
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
 * Accept a friend request
 */
router.post('/accept', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { requesterId } = z
      .object({
        requesterId: z.string().min(1, 'Requester ID is required'),
      })
      .parse(req.body);

    // Get both users
    const [me, requester] = await Promise.all([
      userRepository.findById(currentUser.userId),
      userRepository.findById(requesterId),
    ]);

    if (!me || !requester) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check that the friend request actually exists
    if (!me.friendRequestsReceived.includes(requesterId)) {
      res.status(400).json({ error: 'Friend request not found' });
      return;
    }

    // Check that they are not already friends
    if (me.friends.includes(requesterId)) {
      res.status(400).json({ error: 'Already friends' });
      return;
    }

    // Update both profiles
    await Promise.all([
      // Update my profile: remove from incoming requests and add to friends
      userRepository.update(currentUser.userId, {
        friendRequestsReceived: me.friendRequestsReceived.filter((id) => id !== requesterId),
        friends: [...me.friends, requesterId],
      }),
      // Update requester's profile: remove from outgoing requests and add to friends
      userRepository.update(requesterId, {
        friendRequestsSent: requester.friendRequestsSent.filter((id) => id !== currentUser.userId),
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
 * Remove a friend
 */
router.post('/remove', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { friendId } = z
      .object({
        friendId: z.string().min(1, 'Friend ID is required'),
      })
      .parse(req.body);

    // Check that we are not trying to remove ourselves
    if (currentUser.userId === friendId) {
      res.status(400).json({ error: 'Cannot remove yourself' });
      return;
    }

    // Get both users
    const [me, friend] = await Promise.all([
      userRepository.findById(currentUser.userId),
      userRepository.findById(friendId),
    ]);

    if (!me || !friend) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check that they are actually friends
    if (!me.friends.includes(friendId)) {
      res.status(400).json({ error: 'Not friends' });
      return;
    }

    // Remove each other from friends arrays
    await Promise.all([
      userRepository.update(currentUser.userId, {
        friends: me.friends.filter((id) => id !== friendId),
      }),
      userRepository.update(friendId, {
        friends: friend.friends.filter((id) => id !== currentUser.userId),
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
