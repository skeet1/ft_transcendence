import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/Guards/AuthGurad';
import { UserInfo } from 'src/auth/decorator/user-decorator';
import { UserService } from 'src/user/user.service';
import { ChatService } from './chat.service';
import {
  actionsDto,
  channelSettings,
  createDmDto,
  createRoomDto,
  getChannelDmDto,
  MessageInfo,
} from './dto/chat.dto';
import { userInfo } from 'os';
import { channel } from 'diagnostics_channel';

//TODO: CREATE GET BOTH DM AND ROOMS MESSAGES IN ON REQUEST
@Controller('chat')
export class ChatController {
  constructor(
    private userService: UserService,
    private chatService: ChatService,
  ) {}

  @Post('create/dm')
  @UseGuards(JwtAuthGuard)
  async handleCreateChannelDm(
    @UserInfo() user: User,
    @Res() res: Response,
    @Body() createDm,
  ) {
    const result = await this.chatService.handleCreateDmChannel(
      user.id,
      createDm,
    );
    const members = [];
    members.push({
      username: result.user.username,
      avatar: result.user.avatar,
      status: result.user.status,
    });
    const data = {
      channel: result.channel,
      members: members,
      lastMessage: result.lastMessage
    };
    res.status(200).json(data);
  }
  @Post('create/room')
  @UseGuards(JwtAuthGuard)
  async handleCreateChannelRoom(
    @UserInfo() user: User,
    @Res() res: Response,
    @Body() createRoom: createRoomDto,
  ) {
    const result = await this.chatService.handleCreateRoomChannel(
      user.id,
      createRoom,
    );

    if (result.channel === undefined) return res.status(400).json(result.error);
    const members = [];
    members.push({
      name: result.user.username,
      avatar: result.user.avatar,
      status: result.user.status,
      role: 'Owner',
    });
    const data = {
      channel: result.channel,
      members: members,
      lastMessage: result.lastMessage
    };
    return res.status(200).json(data);
  }

  @Put('leaveChannel/:channelId')
  @UseGuards(JwtAuthGuard)
  async handleLeaveChannel(
    @Param('channelId') channel_id: string,
    @Res() res: Response,
    @UserInfo() user: User,
  ) {
    const result = await this.chatService.handleLeaveChannel(user, channel_id);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  }

  @Put('deleteChannel/:chennelID')
  @UseGuards(JwtAuthGuard)
  async handleDeleteChannel(
    @Param('chennelID') channel_id: string,
    @Res() res: Response,
    @UserInfo() user: User,
  ) {
    try {
      const currUser = await this.userService.findUserById(user.id);
      const result = await this.chatService.handleDeleteRoom(
        channel_id,
        currUser,
      );
      if (!result.success) return res.status(400).json(result);
      return res.status(200).json(result);
    } catch (err) {}
  }
  // get channels
  @Put('addMember/:channelId/:username')
  @UseGuards(JwtAuthGuard)
  async handleAddMemberToRoom(
    @Param('username') username: string,
    @Param('channelId') channelId: string,
    @UserInfo() user: any,
    @Res() res: Response,
  ) {
    const result = await this.chatService.handleAddMember(
      user,
      channelId,
      username,
    );
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  }
  @Put('joinroom/:name/:password')
  @UseGuards(JwtAuthGuard)
  async handleJoinChannelRoom(
    @Param('name') name: string,
    @Param('password') password: string,
    @UserInfo() user: User,
    @Res() res: Response,
  ) {
    const result = await this.chatService.handleJoinChannelRoom(
      name,
      user,
      password,
    );
    if (result.channel === undefined) return res.status(400).json(result);
    return res.status(200).json(result);
  }
  @UseGuards(JwtAuthGuard)
  @Get('getChannel/:channleId')
  async handlegetChannelById(
    @Param('channleId') channleId: string,
    @Res() res: Response,
  ) {
    // console.log('im here');

    const channel = await this.chatService.getChannelById(channleId);
    const members = [];
    let Key = 0;
    if (!channel)
      return [];
    if (channel.members != null &&  channel.members.length > 0)
    {
      for (const member of channel.members) {
      const user = await this.userService.findUserById(member.userId);
      let checker = 'Member';
      if (member.role === 'ADMIN') checker = 'Admin';
      if (member.role === 'OWNER') checker = 'Owner';
      members.push({
        id: Key++,
        name: user.username,
        avatar: user.avatar,
        status: user.status,
        role: checker,
      });
    }
  }
    const bannedUsers = [];
    for (const banned of channel.banedUsers) {
      const user = await this.userService.findUserById(banned.userId);
      bannedUsers.push({
        name: user.username,
        avatar: user.avatar,
      });
    }
    const data = {
      channel: channel,
      members: members,
      bannedUsers: bannedUsers,
    };
    res.status(200).json(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('saveMessage')
  async handleSaveMessageDm(
    @UserInfo() user: User,
    @Res() res: Response,
    @Body() messageInfo: MessageInfo,
  ) {
    await this.chatService.saveMessageToChannel(user, messageInfo);
    res.status(200).json('ok');
  }

  @UseGuards(JwtAuthGuard)
  @Get('getMessages/:channelId')
  async handleGetMessagesDm(
    @Param('channelId') channelId: string,
    @UserInfo() user: User,
    @Res() res: Response,
  ) {
    try{
    const result = await this.chatService.getChannelDmMessages(
      channelId,
      user.id,
    );
    res.status(200).json(result);
    }catch(err)
    {
      res.status(400).json("error");
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('getChannels')
  async handleGetChannels(@UserInfo() user: User, @Res() res: Response) {
    try{
    const result = await this.chatService.getAllChannels(user);
    res.status(200).json(result);
    }catch(err)
    {
      res.status(400).json("error");
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('channelsDm')
  async handleGetChannelsDm(@Res() res: Response, @UserInfo() user: User) {
    const currUser = await this.userService.findUserById(user.id);
    let result = (await this.chatService.getAllUserChannelsDm(currUser)) as any;

    const data = [];
    for (const channel of result) {
      const searchedUserName = channel.users.filter((id) => {
        if (id != currUser.id) return id;
      });

      const lastMessage = channel.messages[channel.messages.length - 1];
      if (!lastMessage) continue;
      const searchedUser = await this.userService.findUserById(
        searchedUserName[0],
      );
      data.push({
        type: 'dm',
        channel: {
          id: channel.id,
          username: searchedUser.username, /// it ay be deleteedd
          avatar: searchedUser.avatar,
          message: lastMessage.content,
          status: searchedUser.status,
          time: lastMessage.created_at,
        },
      });
    }
    res.status(200).json(data);
  }

  @Get('channelsRooms')
  @UseGuards(JwtAuthGuard)
  async handleGetChannelsRooms(@Res() res: Response, @UserInfo() user: User) {
    const result = await this.chatService.getAllChannelsRooms(user);

    const channels = [];
    for (const channel of result) {
      const lastMessage = channel.messages[channel.messages.length - 1];
      if (!lastMessage) {
        channels.push({
          type: 'room',
          channel: {
            id: channel.id,
            name: channel.name,
            avatar: channel.avatar,
            message: '',
            status: '',
          },
        });
        continue;
      }
      const searchedUser = await this.userService.findUserById(
        lastMessage.user_id,
      );
      channels.push({
        type: 'room',
        channel: {
          id: channel.id,
          name: channel.name, /// it ay be deleteedd
          avatar: channel.avatar,
          message: lastMessage.content,
          time: lastMessage.created_at,
          status: '',
        },
      });
    }
    res.status(200).json(channels);
    //TODO get all rooms user in
  }

  @Get('LastMessages')
  @UseGuards(JwtAuthGuard)
  async handleGetUserLastMessages(
    @UserInfo() suer: User,
    @Res() res: Response,
  ) {
    // todo get all last messages
  }

  @Put('mute')
  @UseGuards(JwtAuthGuard)
  async handleMuteUser(
    @UserInfo() user: User,
    @Res() res: Response,
    @Body() muteInfo: actionsDto,
  ) {
    const { channelId, username } = muteInfo;
    const result = await this.chatService.handleUserMute(
      user,
      channelId,
      username,
    );
    res.status(200).json(result);
  }
  @Put('ban')
  @UseGuards(JwtAuthGuard)
  async handleBanUser(
    @UserInfo() user: User,
    @Res() res: Response,
    @Body() body: actionsDto,
  ) {
    const { channelId, username } = body;
    const result = await this.chatService.handleBanUser(
      user,
      channelId,
      username,
    );
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  }
  @Put('unban')
  @UseGuards(JwtAuthGuard)
  async handleUnbanUser(
    @UserInfo() user: User,
    @Res() res: Response,
    @Body() body: actionsDto,
  ) {
    const { channelId, username } = body;
    const result = await this.chatService.handleUnbanUser(
      user,
      channelId,
      username,
    );
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  }
  @Put('kick')
  @UseGuards(JwtAuthGuard)
  async handleKickUser(
    @UserInfo() user: User,
    @Res() res: Response,
    @Body() body: actionsDto,
  ) {
    const { channelId, username } = body;
    const result = await this.chatService.handleKickUser(
      user,
      channelId,
      username,
    );
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  }
  @Put('channelSettings')
  @UseGuards(JwtAuthGuard)
  async handlechannelsettings(
    @UserInfo() user: User,
    @Body() Body: channelSettings,
    @Res() res,
  ) {
    const { channelId, type, password } = Body;
    const result = await this.chatService.handleChannelSettings(
      channelId,
      password,
      type,
      user,
    );
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  }
  @Put('setadmin/:channelId/:username')
  @UseGuards(JwtAuthGuard)
  async handleSetAdmin(
    @Param('username') username: string,
    @Param('channelId') channelId: string,
    @Res() res: Response,
    @UserInfo() user: User,
  ) {
    const result = await this.chatService.handleSetAsAdmin(
      user,
      channelId,
      username,
    );
    res.status(200).json(result);
    // handle set As Admin
  }
}
//TODO: GET ALL MESSAGES IN ON REQUEST

// TODO : CREATE ALL GET RQUESTS TO GET CHATS
//TODO: add time to messages senn
