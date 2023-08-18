import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { Response } from 'express';
import { CreateChannelDto, createMessageChannelDto, updateUserRoleDto, userBanMuteDto } from './dto/channel.dto';
export declare class ChannelService {
    private prismaService;
    constructor(prismaService: PrismaService);
    addChannel(createChannelDto: CreateChannelDto): Promise<{
        id: string;
    }>;
    deleteChannelById(channelId: string, res: Response): Promise<{
        id: string;
    }>;
    removeUserfromChannel(user_id: string, channel_id: string): Promise<{
        id: string;
    }>;
    getMembersOfChannel(channelId: string): Promise<{
        role: import(".prisma/client").$Enums.Role;
        userId: string;
    }[]>;
    updateUserRole(channelId: string, updateUserRoleDto: updateUserRoleDto): Promise<{
        id: string;
    }>;
    checkUserAvailability(userId: string): Promise<UserRole>;
    banMutePossibility(bannerRole: string, bannedRole: string): Boolean;
    function(userbanmuteDto: userBanMuteDto): Promise<void>;
    muteUser(userbanmuteDto: userBanMuteDto): Promise<{
        id: string;
    }>;
    unmuteUser(channelBlockId: string): Promise<void>;
    banUser(userbanmuteDto: userBanMuteDto): Promise<{
        id: string;
    }>;
    addMsgToChannel(createMsgDto: createMessageChannelDto): Promise<{
        id: string;
    }>;
    getChannelMessagesById(channelId: string): Promise<void>;
}
