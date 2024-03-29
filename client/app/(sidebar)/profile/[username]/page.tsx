"use client";
import { useContext, useEffect, useState } from "react";
import SideBar from "@/components/LoggedUser/SideBar/SideBar";
import ProfileCard from "@/components/LoggedUser/Profile/ProfileCard/ProfileCard";
import { AuthContext } from '@/app/context/AuthContext'
import HeaderBar from "@/components/LoggedUser/Profile/HeaderBar/HeaderBar";
import NavMenu from "@/components/LoggedUser/Profile/NavMenu/NavMenu";
import UserProfile from "@/components/LoggedUser/Profile/UserProfile/UserProfile";
import FriendsData from "@/components/LoggedUser/Profile/ProfileData/FriendsData";
import LeaderboardData from "@/components/LoggedUser/Profile/ProfileData/LeaderboardData";
import { baseUrlUsers, getRequest } from "@/app/context/utils/service";
import { showSnackbar } from "@/app/context/utils/showSnackBar";
import Game from "../../game/page";
import GameHistory from "@/components/MainPage/GameHistory/GameHistory";
import GameHistoryList from "@/components/LoggedUser/Profile/ProfileData/GameHistoryList";
import StatsData from "@/components/LoggedUser/Profile/ProfileData/StatsData";
import AchievementsData from "@/components/LoggedUser/Profile/ProfileData/AchievementsData";

export default function Page({params}: {params: {username: string} }) {
  const { username } = params;
  const { getUserData, user } = useContext(AuthContext);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [users, setUsers] = useState<[]>([]);
  const [selectedItem, setSelectedItem] = useState<number>(2);
  const [friendList, setFriendList] = useState<any>([]);
  const [gameList, setGameList] = useState<any>([]);
  const [achievements, setAchievements] = useState<any>({});

  const fetchUsers = async () => {
    try {
      const allUsers = await getRequest(`${baseUrlUsers}/allUsers`);
      let leaderBoardList = allUsers.sort((user1: any, user2: any) => {
        // console.log(`sorting ${user1.username} and ${user2.username}`);
        return user2.win - user1.win;
      })
      setUsers(leaderBoardList.slice(0, 15));
    } catch (error) {
    }
  };

  const fetchFriendList = async () => {
    try {
      const friendList = await getRequest(`${baseUrlUsers}/user/friends/${username}`);
      if (friendList.error && friendList.message === "Unauthorized") {
        showSnackbar("Unauthorized", false)
        return ;
      }
      setFriendList(friendList);
    } catch (err) {
      // console.log("");
    }
  }

  const fetchGameList = async () => {
    try {
      const gameList = await getRequest(`${baseUrlUsers}/user/matches/${username}`);
      if (gameList.error && gameList.message === "Unauthorized") {
        showSnackbar("Unauthorized", false)
        return ;
      }
      setGameList(gameList);
    } catch (err) {
      // console.log("");
    }
  }

  const fetchAchievements = async () => {
    try {
      const achievements = await getRequest(`${baseUrlUsers}/user/achievement/${username}`);
      if (achievements.error && achievements.message === "Unauthorized") {
        showSnackbar("Unauthorized", false)
        return ;
      }
      setAchievements(achievements);
    } catch (err) {
      // console.log(err);
    }
  }

  useEffect(() => {
    try {
      (async () =>{
      await fetchFriendList();
      })()
    }
    catch (error) {
      console.error('Error fetching friend list:', error);
    }

    const debouncedFetchUsers = setTimeout(async () => {
      await fetchUsers();
      await fetchFriendList();
      await fetchGameList();
      await fetchAchievements();
    }, 300);

    return () => {
      clearTimeout(debouncedFetchUsers);
    };
  }, []);

  useEffect(()=>
  {
    (async () =>{
      try{
          const response = await getRequest(`${baseUrlUsers}/users`);
          if (response?.error)
          {
            if (response.message ==="Unauthorized")
              showSnackbar("Unauthorized", false)
            return ;
          }
          setUsers(response)
      }catch(err)
      {

      }
    })()
  },[])

  return (
    <div className="profile-page text-white">
      <SideBar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      <div className={`profile ${isExpanded ? 'ml-12 md:ml-16': ''}`}>
        <div className="profile-content p-8">
          <HeaderBar data={user} />
          <UserProfile username={username} />
          <NavMenu setSelectedItem={setSelectedItem} />
          <div className="user-data">
            { selectedItem === 0 && <FriendsData friendList={friendList} /> }
              { selectedItem === 1 && <GameHistoryList gameList={gameList} /> }
              { selectedItem === 2 && <LeaderboardData users={users} /> }
              { selectedItem === 3 && <StatsData user={user} /> }
              { selectedItem === 4 && <AchievementsData achievements={achievements} /> }
          </div>
        </div>
      </div>
    </div>
  );
}