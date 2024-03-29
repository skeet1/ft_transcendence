/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Body,
  HttpException,
  HttpStatus,
  Injectable,
  Param,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Achievement,
  Friendship,
  Match,
  Prisma,
  State,
  Status,
  User,
} from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { CreateMatchDto } from './dto/create-match.dto';
import { FileUserDto, PutUserDto } from './dto/put-user-dto';
import { generate } from 'rxjs';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async findAllUsers(user: any): Promise<User[]> {
    const Allusers = await this.prismaService.user.findMany({});
    const users = Allusers.filter((currUser) => {
      return currUser.id !== user.id;
    });
    return users;
  }
  async getAllUsers(): Promise<User[]> {
    return await this.prismaService.user.findMany({});
  }

  async findUserById(user_id: string): Promise<User> {
    return await this.prismaService.user.findUniqueOrThrow({
      where: {
        id: user_id,
      },
    });
  }

  async addUser(createUserDto: CreateUserDto) {
    const exist = !!(await this.prismaService.user.findFirst({
      where: {
        OR: [
          { username: createUserDto.username },
          { email: createUserDto.email },
        ],
      },
    }));
    if (exist) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: `This Username or email already used`,
        },
        HttpStatus.FORBIDDEN,
        {},
      );
    }

    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    try {
      return await this.prismaService.user.create({
        data: {
          email: createUserDto.email,
          username: createUserDto.username,
          password: createUserDto.password,
          achievement: {
            create: {
              accountCreationAchie: true,
            },
          },
        },
        select: {
          id: true,
        },
      });
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async deleteUserByUsername(user_id: string) {
    try {
      return await this.prismaService.user.delete({
        where: {
          id: user_id,
        },
        select: { id: true },
      });
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.NO_CONTENT,
          error: `There is no content for ${user_id}`,
        },
        HttpStatus.NO_CONTENT,
        {},
      );
    }
  }

  /// find user witth unique username
  async findUserName(username: string): Promise<User> {
    try {
      return await this.prismaService.user.findUniqueOrThrow({
        where: {
          username: username,
        },
      });
    } catch (error) {}
  }

  /// find user witth unique email
  async findUserEmail(email: string): Promise<User> {
    try {
      return await this.prismaService.user.findUniqueOrThrow({
        where: {
          email: email,
        },
      });
    } catch (error) {
      // throw new HttpException(
      //   {
      //     status: HttpStatus.NOT_FOUND,
      //     error: `This username :${username} is not found.`,
      //   },
      //   HttpStatus.NOT_FOUND,
      // );
    }
  }
  async achievementById(userId: string): Promise<Achievement> {
    try {
      return await this.prismaService.achievement.findUnique({
        where: {
          userId: userId,
        },
      });
    } catch (error) {}
  }

  async getMatchesByUserId(user_id: string): Promise<Match[]> {
    return await this.prismaService.match.findMany({
      where: {
        OR: [{ winner_id: user_id }, { loser_id: user_id }],
      },
      orderBy: {
        played_at: 'desc',
      },
    });
  }
  async handleGetUserStatus(user: any)
  {
    const currentUser = await this.findUserById(user.id);
    return currentUser.status; 
  }
  async getUserFriends(user_id: string): Promise<Friendship[]> {
    return await this.prismaService.friendship.findMany({
      where: { user_id: user_id },
    });
  }

  async getUserFriendsByName(user_name: string): Promise<Friendship[]> {
    const user = await this.findUserName(user_name);
    return await this.prismaService.friendship.findMany({
      where: { user_id: user.id },
    });
  }

  async createMatch(createMatchDto: CreateMatchDto) {
    await this.prismaService.user.update({
      where: { id: createMatchDto.winner_id },
      data: {
        win: { increment: 1 },
        totalGames: { increment: 1 },
      },
    });
    await this.prismaService.user.update({
      where: { id: createMatchDto.loser_id },
      data: {
        loss: { increment: 1 },
        totalGames: { increment: 1 },
      },
    });
    return await this.prismaService.match.create({
      data: {
        winner_id: createMatchDto.winner_id,
        loser_id: createMatchDto.loser_id,
        winner_score: createMatchDto.winner_score,
        loser_score: createMatchDto.loser_score,
      },
      select: {
        id: true,
      },
    });
  }

  async updateUser(body, req) {
    const hashedPass = await bcrypt.hash(body.password, 10);
    return await this.prismaService.user.update({
      where: { id: req.user.id },
      data: {
        password: hashedPass,
        username: body.username,
      },
    });
  }
  async updateAvatarorCover(
    infos: FileUserDto,
    userId: string,
    toBeUpdated: string,
  ) {
    if (toBeUpdated === 'avatar') {
      try {
        return await this.prismaService.user.update({
          where: { id: userId },
          data: {
            avatar:  process.env.HOSTNAME + `8080/api/avatar/pictures/${infos.avatar}`,
          },
        });
      } catch (err) {
        // // console.log(err);
      }
      {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: `Avatar image  error occured`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
    } else if (toBeUpdated === 'cover') {
      try {
        return await this.prismaService.user.update({
          where: { id: userId },
          data: {
            cover: process.env.HOSTNAME +  `8080/api/cover/pictures/${infos.cover}`,
          },
        });
      } catch (err) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: `Cover image  error occured`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
    }
  }

  async UpdateUserName(user: PutUserDto, UserId: string) {
    try {
      return await this.prismaService.user.update({
        where: { id: UserId },
        data: {
          username: user.username,
        },
      });
    } catch (err) {
      
    }
  }

  async UpdateAllInfos(user: PutUserDto, userId: string) {
    let hashedPass = null;
    const searchedUser = await this.findUserById(userId);
    if (
      user.username &&
      searchedUser.username === user.username &&
      (searchedUser.id === userId || searchedUser.id != userId)
    )
      return false;
    if (user.password) hashedPass = await bcrypt.hash(user.password, 10);

    try {
      if (user.username && user.password) {
        return await this.prismaService.user.update({
          where: { id: userId },
          data: {
            username: user.username,
            password: hashedPass,
          },
        });
      } else if (user.username) {
        return await this.prismaService.user.update({
          where: { id: userId },
          data: {
            username: user.username,
          },
        });
      } else if (user.password) {
        return await this.prismaService.user.update({
          where: { id: userId },
          data: {
            password: hashedPass,
          },
        });
      }
    } catch (err) {
      // // console.log(err);
    }
  }
  async passWordCheck(@Body() Body, userId: string) {
    try {
      const user = await this.findUserById(userId);
      return await bcrypt.compare(Body.password, user.password);
    } catch (err) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: `This User_id:${userId} is not found.`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async getAllUserRank() {
    const rankedUser = await this.prismaService.user.findMany({
      orderBy: {
        xp: 'desc',
      },
      select: {
        id: true,
        username: true,
        xp: true,
      },
    });
    return rankedUser;
  }

  async getUserRankById(user_id: string) {
    const user = await this.prismaService.user.findFirstOrThrow({
      where: {
        id: user_id,
      },
    });
    const rankedUsers = await this.getAllUserRank();
    let index = rankedUsers.findIndex((usr) => usr.id === user_id);
    if (index === 0) return 1;
    return index;
  }

  async getUsersRank() {
    const rankedUsers = await this.getAllUserRank();
    const Users = [];
    let index = 0;

    for (let user of rankedUsers) {
      user['index'] = index++;
      Users.push(user);
    }
    return Users;
  }

  async getAvatarById(user_id: string) {
    return await this.prismaService.user.findFirstOrThrow({
      where: {
        id: user_id,
      },
      select: {
        id: true,
        avatar: true,
      },
    });
  }

  async getCoverById(user_id: string) {
    return await this.prismaService.user.findFirstOrThrow({
      where: {
        id: user_id,
      },
      select: {
        id: true,
        cover: true,
      },
    });
  }

  async createFriendship(user_one_id: string, user_two_name: string) {
    const userOne = await this.findUserById(user_one_id);
    const userTwo = await this.findUserName(user_two_name);

    const isFriend = await this.prismaService.friendship.findFirst({
      where: {
        OR: [
          { user_id: userOne.id, friend_id: userTwo.id },
          { user_id: userTwo.id, friend_id: userOne.id },
        ],
      },
    });
    if (isFriend) return;
    await this.prismaService.friendship.create({
      data: {
        user_id: userOne.id,
        friend_id: userTwo.id,
      },
    });
    await this.creatFriendshipAchievements(userOne, userTwo);
  }

  async creatFriendshipAchievements(userOne: User, userTwo: User) {
    await this.prismaService.achievement.update({
      where: {
        userId: userOne.id,
      },
      data: {
        firstFriendAchie: true,
      },
    });
    await this.prismaService.achievement.update({
      where: {
        userId: userTwo.id,
      },
      data: {
        firstFriendAchie: true,
      },
    });
  }
  async handleUnFriendUser(user: any, username: string) {
    try {
      const currentUser = await this.findUserById(user.id);
      const Friendships = await this.prismaService.friendship.findMany({});
      const requests = await this.prismaService.friendRequest.findMany({});
      const otherUser = await this.findUserName(username);
      for (const friend of Friendships) {
        if (
          (friend.user_id == currentUser.id ||
            friend.user_id === otherUser.id) &&
          (friend.friend_id === currentUser.id ||
            friend.friend_id === otherUser.id)
        ) {
          await this.prismaService.friendship.delete({
            where: {
              id: friend.id,
            },
          });
        }
      }
      for (const request of requests) {
        if (
          (request.requested_id == currentUser.id ||
            request.requested_id === otherUser.id) &&
          (request.requester_id === currentUser.id ||
            request.requester_id === otherUser.id)
        ) {
          await this.prismaService.friendRequest.delete({
            where: {
              id: request.id,
            },
          });
        }
      }
      return { success: true, message: 'succeffully updated' };
    } catch (err) {
      // console.log('error occurred while unfriending user');
      return { success: false };
    }
  }
  async deleteFriendship(user_one: string, user_two: string) {
    const userOne = await this.findUserById(user_one);
    const userTwo = await this.findUserById(user_two);

    const friendshipId = await this.prismaService.friendship.findFirstOrThrow({
      where: {
        OR: [
          { user_id: user_one, friend_id: user_two },
          { user_id: user_two, friend_id: user_one },
        ],
      },
    });
    await this.prismaService.friendship.delete({
      where: {
        id: friendshipId.id,
      },
    });
  }

  //NOTICE: this fucntion not stablleeee
  async getFriendsByUserId(user_id: string) {
    return await this.prismaService.friendship.findMany({
      where: {
        OR: [{ user_id: user_id }, { friend_id: user_id }],
      },
    });
  }

  //TODO : THIS IS FOR UPDATING FRIEND REQUEST WHETHER THE REQUEST ACCEPTED OR REJECTED
  async updateFriendRequestState(
    user_one_id: string,
    user_two_name: string,
    state: State,
  ) {
    const userOne = await this.findUserById(user_one_id);
    const userTwo = await this.findUserName(user_two_name);

    const FriendRequestId =
      await this.prismaService.friendRequest.findFirstOrThrow({
        where: {
          requester_id: userTwo.id,
          requested_id: userOne.id,
        },
      });

    return await this.prismaService.friendRequest.update({
      where: {
        id: FriendRequestId.id,
      },
      data: {
        updated_at: new Date(),
        state: state,
      },
    });
  }

  async blockUser(user_blocker_id: string, user_blocked_id: string) {
    const blocker = await this.findUserById(user_blocker_id);
    const blocked = await this.findUserById(user_blocked_id);

    await this.prismaService.userBlock.create({
      data: {
        blockerId: blocker.id,
        blockedId: blocked.id,
      },
    });
  }

  async unblockUser(blockerId: string, blockedId: string) {
    const blocked = await this.findUserById(blockedId);
    const blocker = await this.findUserById(blockerId);

    const blockRelaId = await this.prismaService.userBlock.findFirstOrThrow({
      where: {
        blockerId: blocker.id,
        blockedId: blocked.id,
      },
    });
    await this.prismaService.userBlock.delete({
      where: {
        id: blockRelaId.id,
      },
    });
  }

  async searchUserStartWithPrefix(usernamePrefix: string) {
    return await this.prismaService.user.findMany({
      where: {
        username: {
          startsWith: usernamePrefix,
        },
      },
    });
  }
  async disable2fa(userId: string) {
    return await this.prismaService.user.update({
      where: { id: userId },
      data: {
        tfa: false,
        isTfaVerified: false,
        twoFactorAuthenticationSecret: null,
      },
    });
  }

  async handleUpdateStatus(currentStatus: Status, user_id: string) {
    return await this.prismaService.user.update({
      where: {
        id: user_id,
      },
      data: {
        status: currentStatus,
      },
    });
  }
  async updateIsVerified(user_id: string )
  {
    return await this.prismaService.user.update({
      where: {
        id: user_id,
      },
      data: {
        isTfaVerified:false
      },
    });
  }
  async logOut(userId: string) {
    return await this.prismaService.user.update({
      where: { id: userId },
      data: {
        isTfaVerified: false,
        status: 'OFFLINE',
      },
    });
  }
  async findUserByIdWithBlocked(user_id: string) {}
  async handleBlockUser(user: any, username: string) {
    try {
      const currUser = await this.prismaService.user.findUnique({
        where: {
          id: user.id,
        },
        include: {
          userBlock: true,
        },
      });

      const blockedUser = await this.findUserName(username);
      const checker = currUser.userBlock.filter((blocked: any) => {
        return blocked.blockedId === blockedUser.id;
      });
      if (checker[0]) throw BadRequestException;
      await this.prismaService.userBlock.create({
        data: {
          blockerId: currUser.id,
          blockedId: blockedUser.id,
        },
      });
      return { success: true, message: 'user blocked' };
    } catch (error) {
      return { success: false, error: 'error ocured' };
    }
  }

  async handleUnBlockUser(user: any, username: string) {
    try {
      const currUser = await this.prismaService.user.findUnique({
        where: {
          id: user.id,
        },
        include: {
          userBlock: true,
        },
      });
      const otherUser = await this.findUserName(username);
      const checker = currUser.userBlock.filter((blocked: any) => {
        return blocked.blockedId === otherUser.id;
      });
      if (!checker[0]) throw BadRequestException;
      await this.prismaService.userBlock.delete({
        where: {
          id: checker[0].id,
        },
      });
      return { success: true, message: 'user unblocked' };
    } catch (e) {
      return { success: false, error: 'error ocured' };
    }
  }

  async handleGetBlockedUsers(user: any) {
    const currUser = await this.prismaService.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        userBlock: true,
      },
    });
    const users = [];
    for (const block of currUser.userBlock) {
      const searchedUser = await this.prismaService.user.findUnique({
        where: {
          id: block.blockedId,
        },
      });
      users.push(searchedUser.username);
    }
    return users;
  }
  async handleGetUserblockedMe(user: any) {
    const currUser = await this.prismaService.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        blockedUser: true,
      },
    });
    const users = [];
    for (const block of currUser.blockedUser) {
      const searchedUser = await this.prismaService.user.findUnique({
        where: {
          id: block.blockedId,
        },
      });

      const otherUser = await this.findUserById(block.blockerId);
      users.push(otherUser.username);
    }
    return users;
  }

  async handleFriendRequest(user: any, username: string) {
    const requestedFriend = await this.findUserName(username);
    const currentUser = await this.prismaService.user.findUnique({
      where: { id: user.id },
      include: {
        OutgoingRequest: true,
      },
    });
    for (const request of currentUser.OutgoingRequest) {
      if (
        request.requester_id === currentUser.id &&
        request.requested_id === requestedFriend.id
      ) {
        // thats mean  already request has been send by the current user
        return {
          success: false,
          error: `${currentUser.username} you have already sent request to this user`,
        };
      }
    }
    try {
      await this.prismaService.friendRequest.create({
        data: {
          requester_id: currentUser.id,
          requested_id: requestedFriend.id,
          state: 'PENDING',
          updated_at: new Date(),
        },
      });
    } catch (err) {
      return {
        success: false,
        error: `error while adding your friend request ${err}`,
      };
    }
    return {
      success: true,
      message: `friend request successfully sent to ${username}`,
    };
  }

  async getFriendRequests(user: any) {
    const currentUser = await this.prismaService.user.findUnique({
      where: { id: user.id },
      include: {
        IncomingRequest: true,
      },
    });

    const requests = [];
    for (const request of currentUser.IncomingRequest) {
      if (
        request.requested_id === currentUser.id &&
        request.state === 'PENDING'
      ) {
        const otherUser = await this.findUserById(request.requester_id);
        requests.push({
          type: 1,
          username: otherUser.username,
          avatar: otherUser.avatar,
        });
      }
    }
    return requests;
  }

  async handleCancleFriendRequest(user: any, username: string) {
    try {
      const currentUser = await this.prismaService.user.findUnique({
        where: {
          id: user.id,
        },
        include: {
          IncomingRequest: true,
        },
      });
      const otherUser = await this.findUserName(username);
      for (const request of currentUser.IncomingRequest) {
        if (
          (request.requester_id === currentUser.id ||
            request.requested_id === currentUser.id) &&
          (request.requested_id === otherUser.id ||
            request.requester_id === otherUser.id) &&
          request.state === 'PENDING'
        ) {
          await this.prismaService.friendRequest.delete({
            where: {
              id: request.id,
            },
          });
        }
      }
      return { success: true, message: 'friend request deleted successfully' };
    } catch (err) {
      return { success: false };
    }
  }
  async getFriendRequestSent(user: any) {
    try {
      const currentUser = await this.prismaService.user.findUnique({
        where: {
          id: user.id,
        },
        include: {
          OutgoingRequest: true,
        },
      });
      const requests = [];
      for (const request of currentUser.OutgoingRequest) {
        if (
          request.requester_id === currentUser.id &&
          request.state === 'PENDING'
        ) {
          const otherUser = await this.findUserById(request.requested_id);
          requests.push(otherUser.username);
        }
      }
      // console.log('here request', requests);
      return { success: true, requests: requests };
    } catch (err) {
      return { success: false };
    }
  }
  async handleCreateGameInvitation(currentUser: User, otherUser: User) {
    try {
      const gameInvitations = await this.prismaService.gameInvite.findMany({});

      for (const invitation of gameInvitations) {
        if (
          (invitation.senderId === currentUser.id ||
            invitation.recieverId === currentUser.id) &&
          (invitation.senderId === otherUser.id ||
            invitation.recieverId === otherUser.id) &&
          invitation.state === 'PENDING'
        ) {
          return { success: false, error: 'invitation already sent!' };
        }
      }
      await this.prismaService.gameInvite.create({
        data: {
          senderId: currentUser.id,
          recieverId: otherUser.id,
          state: 'PENDING',
        },
      });
      return { success: true, message: 'game request sent successfully' };
    } catch (error) {
      // console.log('error occured heree');
      return { success: false, error: 'invitation already sent!' };
    }
  }

  async handleAccpetRequest(currentUser: User, otherUser: User) {
    try {
      const gameInvitations = await this.prismaService.gameInvite.findMany({});

      for (const invitation of gameInvitations) {
        if (
          (invitation.senderId === currentUser.id ||
            invitation.recieverId === currentUser.id) &&
          (invitation.senderId === otherUser.id ||
            invitation.recieverId === otherUser.id) &&
          invitation.state === 'PENDING'
        ) {
          await this.prismaService.gameInvite.update({
            where: {
              id: invitation.id,
            },
            data: {
              state: 'ACCEPTED',
            },
          });
          return { success: true, message: 'game request accepted' };
        }
      }
      return { success: false, message: 'no game request available' };
    } catch (err) {
      // console.log('error occured');
      return { success: false, message: 'error occured' };
    }
  }

  async handleDeleteGameRequest(currentUser: User, otherUser: User) {
    try {
      const gameInvitations = await this.prismaService.gameInvite.findMany({});

      for (const invitation of gameInvitations) {
        if (
          (invitation.senderId === currentUser.id ||
            invitation.recieverId === currentUser.id) &&
          (invitation.senderId === otherUser.id ||
            invitation.recieverId === otherUser.id) &&
          invitation.state === 'PENDING'
        ) {
          await this.prismaService.gameInvite.delete({
            where: {
              id: invitation.id,
            },
          });
          return {
            success: true,
            message: 'game request deleted successfully',
          };
        }
        return {
          success: false,
          message: 'no game request available to cancle',
        };
      }
    } catch (err) {
      // console.log('error occured');
      return { success: false, message: 'error occured' };
    }
  }
  async handleGetGamesReques(user: any) {
    try {
      const currentUser = await this.findUserById(user.id);
      const invitations = await this.prismaService.gameInvite.findMany({});

      const games = [];
      for (const invite of invitations) {
        if (
          invite.recieverId === currentUser.id &&
          invite.state === 'PENDING'
        ) {
          const otherUser = await this.findUserById(invite.senderId);
          games.push({
            type: 3,
            username: otherUser.username,
            avatar: otherUser.avatar,
          });
        }
      }
      return { success: true, games: games };
    } catch (err) {
      return { success: false, error: 'error occured' };
    }
  }

  async getInvitionAccpted(userid: string) {
    const currentUser = await this.findUserById(userid);
    const invitations = await this.prismaService.gameInvite.findMany({});
    let opponents = [];
    let invitationIds = [];
    for (const invite of invitations) {
      let user;
      if (
        (invite.senderId === currentUser.id ||
          invite.recieverId === currentUser.id) &&
        invite.state === 'ACCEPTED'
      ) {
        if (invite.senderId === currentUser.id)
          user = await this.findUserById(invite.recieverId);
        else user = await this.findUserById(invite.senderId);
        opponents.push(user);
        invitationIds.push(invite.id);
      }
    }
    if (opponents.length > 0)
      return {
        success: true,
        opponents: opponents,
        invitaionsId: invitationIds,
      };
    return { success: false };
  }

  async handleRemoveGameInvite(gameInviteId: string) {
    try {
      await this.prismaService.gameInvite.delete({
        where: {
          id: gameInviteId,
        },
      });
      return { success: true };
    } catch (err) {
      return { success: true, error: 'error ocured while deleting invitation' };
    }
  }
  // async getFileUpload(fileTarget, category) {
  //   let userFile: any = undefined;
  //   const assets = await readdir(`./images/${category}`);
  //   // loop over the files in './uploads' and set the userFile var to the needed file
  //   for (const file of assets) {
  //     const {base} = parse(file)
  //     if (base === fileTarget) {
  //       userFile = file;
  //       break;
  //     }
  //   }
  //   if (userFile) {
  //     // console.log("file found");
  //     return true
  //   }
  //   else
  //   {
  //     // console.log("file not found");
  //     return false
  //   }
  // }
}
