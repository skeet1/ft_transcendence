import { baseChatUrl, postRequest } from "@/app/context/utils/service";
import { Key, useContext, useState } from "react";
import {
  List,
  ListItem,
  ListItemPrefix,
  Avatar,
  Card,
  Typography,
} from "@material-tailwind/react";


import { AiOutlineMessage } from "react-icons/ai";
import {GiPingPongBat} from "react-icons/gi"
import { FaUserFriends } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/app/context/AuthContext";
import { showSnackbar } from "@/app/context/utils/showSnackBar";

const Friends = ({ channels,setChannels,setSelectedChannel, setSelectedChat, users }: any) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const router = useRouter();
  const { notifSocket }= useContext(AuthContext);
  const CreateChat = async (user: any) => {
    try{
    const response = await postRequest(
      `${baseChatUrl}/create/dm`,
      JSON.stringify({ username: user.username, memberLimit: 2 })
    );
    if (response?.error)
    {
        if(response?.message === "Unauthorized")
          showSnackbar("Unauthorized", false)
      return ;
    }
    setSelectedChannel(response); // to set selected channel after clicking a friend
    setSelectedChat(user); // to set the selected friend
    if (!channels.some((channel: any) => channel?.channel?.id === response?.lastMessage?.channel?.id))
      setChannels((prev: any) => [response.lastMessage, ...prev]);
  }catch(err)
  {

  }
  };

  const handleGameInvite = (user: any) =>
  {
    notifSocket.emit("gameInvite",{
      username: user.username
    })
  }
  return (
    <>
      {showSidebar ? (
        <button
          className="flex text-4xl text-white items-center cursor-pointer fixed right-10 top-10 z-50"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          x
        </button>
      ) : (
          <FaUserFriends onClick={() => setShowSidebar(!showSidebar)} className="fixed  z-30 flex items-center cursor-pointer right-10 top-17 text-white icon"/>
      )}

      <div
        className={`friends-bar top-0 right-0 p-10 pl-20 text-white fixed h-full z-40 ease-in-out duration-300 ${showSidebar ? "translate-x-0 " : "translate-x-full"
          }`}
      >
        <h3 className="mt-15 text-2xl font-semibold text-white">Friends</h3>
        {users?.length > 0 ? (
          <Card className="friends-list">
            <List className="gap-3.5">
              {users.length > 0 &&
                users.map((user: any, index: Key) => (
                  <ListItem
                    key={index}
                    className="border-b-2 p-4 flex justify-between friend-card"
                  >
                    <div className="flex flex-row items-center gap-3.5">
                      <ListItemPrefix>
                        <Avatar
                          variant="circular"
                          alt="candice"
                          src={user.avatar}
                        />
                      </ListItemPrefix>

                      <Typography variant="h6" color="blue-gray">
                        {user?.username}
                      </Typography>
                    </div>
                    <div className="flex flex-row gap-3.5 items-center">
                      <AiOutlineMessage className='icon cursor-pointer' onClick={() => CreateChat(user)} />
                      <GiPingPongBat className='icon cursor-pointer' onClick={() => handleGameInvite(user)}/> {/* TODO: Add onClick to invite to a game */}
                    </div>
                  </ListItem>
                ))}
            </List>
          </Card>
        ) : (
          <div className="friends-list">You need to Add new friends first</div>
        )}
      </div>
    </>
  );
};

export default Friends;