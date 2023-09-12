import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { Achievement, Match, User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateMatchDto } from './dto/create-match.dto';
import { JwtAuthGuard } from 'src/auth/Guards/AuthGurad';
import { PutUserDto } from './dto/put-user-dto';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path = require('path');
import { UserService } from './user.service';
import { log } from 'console';

export const strorageCover = {
  storage: diskStorage({
    destination: './images/covers',
    filename: (req, file, cb) => {
      const filename: string =
        path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
      const extension: string = path.parse(file.originalname).ext;
      cb(null, `${filename}${extension}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) return cb(null, false);
    cb(null, true);
  },
};

export const strorageAvatar = {
  storage: diskStorage({
    destination: './images/avatars',
    filename: (req, file, cb) => {
      const filename: string =
        path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
      const extension: string = path.parse(file.originalname).ext;

      // console.log(file);

      cb(null, `${filename}${extension}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) return cb(null, false);
    cb(null, true);
  },
};

@Controller('/api')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/users/')
  async getAllUsers(): Promise<User[]> {
    return await this.userService.findAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('userNameCheck')
  async handleNickNameCheck(@Req() req, @Res() res) {
    try {
    } catch (err) {
      // console.log(err);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/user')
  async getUser(@Req() req, @Res() res): Promise<User> {
    try {
      const user = await this.userService.findUserById(req.user.id);
      if (user) return res.status(200).json(user);
      return res.status(400).json({ msg: 'ko' });
    } catch (err) {
      return res.status(400).json({ msg: 'user not found' });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/username')
  async getUseByName(@Req() req): Promise<User> {
    return await this.userService.findUserName(req.user.username);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/users/')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.userService.addUser(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/user')
  async deleteUser(@Req() req) {
    return await this.userService.deleteUserByUsername(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/user/achievement')
  async getUserAchievement(@Req() req, @Res() res) {
    const achievements = await this.userService.achievementById(req.user.id); 
    console.log(achievements);

    res.status(200).json(achievements);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/user/matches')
  async getMatches(@Req() req, @Res() res) {
    try {
      const allUserMatches = await this.userService.getMatchesByUserId(
        req.user.id,
      );
      const againstMatches = [];
      for (const match of allUserMatches) {
        if (match.loser_id == req.user.id) {
          const loser = await this.userService.findUserById(req.user.id);
          const winner = await this.userService.findUserById(match.loser_id);
          againstMatches.push({
            winnerScore: match.winner_score,
            loserScore: match.loser_score,
            loser: loser,
            winner: winner,
          });
        } else {
          const loser = await this.userService.findUserById(match.loser_id);
          const winner = await this.userService.findUserById(match.winner_id);
          againstMatches.push({
            winnerScore: match.winner_score,
            loserScore: match.loser_score,
            loser: loser,
            winner: winner,
          });
        }
      }
      res.status(200).json(againstMatches);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `UserNotFound`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/users/matches')
  async createMatch(@Body() createMatchDto: CreateMatchDto) {
    return await this.userService.createMatch(createMatchDto);
  }

  @Get('/users/avatar/:user_id')
  async getUserAvatar(@Param('user_id') user_id: string, @Res() res: Response) {
    try {
      const userAvatar = await this.userService.getAvatarById(user_id);
      res.status(200).json(userAvatar);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'User Avatar Not Found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/users/cover/:user_id')
  async getUserConver(@Param('user_id') user_id: string, @Res() res: Response) {
    try {
      const userCover = await this.userService.getCoverById(user_id);
      res.status(200).json(userCover);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'User Avatar Not Found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('users/changeUserName')
  async handleUserNameChange(@Body() user: PutUserDto, @Req() req, @Res() Res) {
    try {
      await this.userService.UpdateUserName(user, req.user.id);
      Res.status(200).json({ msg: 'Updated succefully' });
    } catch (err) {
      // console.log(err);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('/user')
  async handleUpdate(@Body() user: PutUserDto, @Req() req, @Res() response) {
    try {
      await this.userService.updateUser(user, req);
      return response.status(200).json('Information updated successfully');
    } catch (err) {
      return response.status(401).json('Username you chosed already exist');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('users/update')
  async HandleUpdate(@Body() user: PutUserDto, @Res() res, @Req() req) {
    const User = await this.userService.UpdateAllInfos(user, req.user.id);
    return user;
    // res.status(200).json({msg:"Ok"});
  }
  // avatar imagesss

  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', strorageAvatar))
  async uploadAvatart(
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response,
    @Req() req,
  ) {
    if (!file) return response.status(400).json({ msg: 'File is not Image' });
    try {
      this.userService.updateAvatarorCover(
        { avatar: file.filename, cover: '' },
        req.user.id,
        'avatar',
      );
      return response.status(200).json(file);
    } catch (err) {
      response.status(400).json({ message: err.message });
      // console.log('image rro', err.message);
      throw new err();
    }
  }

  //cover imagess
  @UseGuards(JwtAuthGuard)
  @Post('cover')
  @UseInterceptors(FileInterceptor('file', strorageCover))
  async uploadCover(
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response,
    @Req() req,
  ) {
    if (!file) return response.status(400).json({ msg: 'File is not Image' });
    try {
      this.userService.updateAvatarorCover(
        { avatar: '', cover: file.filename },
        req.user.id,
        'cover',
      );
      return response.status(200).json(file);
    } catch (err) {
      // console.log('image rro', err.message);
      throw new err();
    }
    return response.status(200).json(file.path);
  }

  /// this route in my opinion cant be proteted , pictures can be accessed from everywhere
  // @UseGuards(JwtAuthGuard)
  @Get('cover/pictures/:filename')
  async getCover(@Param('filename') filename: string, @Res() res) {
    // if (await this.userService.getFileUpload(filename, 'covers'))
    //   res.sendFile(filename, { root: './images/covers' });
    res.sendFile(filename, { root: './images/covers' });
  }

  @Get('avatar/pictures/:filename')
  async getAvatar(@Param('filename') filename: string, @Res() res) {
    // if (await this.userService.getFileUpload(filename, 'avatars'))
    //   res.sendFile(filename, { root: './images/avatars' });

    res.sendFile(filename, { root: './images/avatars' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('user/checkPassword')
  async handlePasswordCheck(@Res() res, @Req() req, @Body() body) {
    try {
      const checker = await this.userService.passWordCheck(body, req.user.id);
      if (!checker) return res.status(400).json({ msg: 'Incorrect Password' });
      return res.status(200).json({ msg: 'Password Correct' });
      // passwrod check for you if if matches return true else in doesn not matche
    } catch (err) {
      console.log(err);
    }
  }
  /// --------------------------------------------------Ranking--------------------------------------------------

  @Get('/users/rank/:user_id')
  async getUserRank(@Param('user_id') user_id: string, @Res() res) {
    try {
      const userRank = await this.userService.getUserRankById(user_id);
      return res.json({ user_id, userRank });
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: `UserNotFound`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
  @Get('/users/rank/')
  async getUsersRank() {
    return await this.userService.getUsersRank();
  }

  @UseGuards(JwtAuthGuard)
  @Put('/user/disable2fa')
  async handleDisable2fa(@Req() request, @Res() response)
  {
    await this.userService.disable2fa(request.user.id);
    response.status(200).json("Two factor authentication disabled successfully");
  }

  @UseGuards(JwtAuthGuard)
  @Put('/user/logout')
  async  handleLogout(@Req() request, @Res() response)
  {
    try{
      await this.userService.logOut(request.user.id);
      response.status(200).json("ok")
    }catch(err)
    {
    }
    }
}
