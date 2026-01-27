import type { IGroupRepository, GroupEntity } from '@/types';
import type { CreateGroupDTO } from '@/repositories/GroupRepository';

export class GroupService {
  constructor(private groupRepository: IGroupRepository) {}

  async createGroup(data: CreateGroupDTO): Promise<GroupEntity> {
    return this.groupRepository.create(data);
  }

  async getGroupById(id: string): Promise<GroupEntity> {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  }

  async addUserToGroup(groupId: string, userId: string): Promise<GroupEntity> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const updatedUserIds = Array.isArray(group.userIds) ? group.userIds : [];
    if (!updatedUserIds.includes(userId)) {
      updatedUserIds.push(userId);
    }

    return this.groupRepository.update(groupId, { userIds: updatedUserIds });
  }

  async removeUserFromGroup(groupId: string, userId: string): Promise<GroupEntity> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const updatedUserIds = (group.userIds || []).filter(id => id !== userId);
    return this.groupRepository.update(groupId, { userIds: updatedUserIds });
  }

  async updateGroup(id: string, data: Partial<GroupEntity>): Promise<GroupEntity> {
    return this.groupRepository.update(id, data);
  }

  async deleteGroup(id: string): Promise<void> {
    await this.groupRepository.delete(id);
  }
}
