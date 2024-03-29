"use client";
import { SetStateAction, useCallback, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Avatar1 from "@/public/images/avatar1.jpeg";
import "./style.scss";
import { useCookies } from "react-cookie";
import {
  baseUrlUsers,
  getRequest,
  postFileRequest,
  postRequest,
  putRequest,
} from "@/app/context/utils/service";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/app/context/AuthContext";
import { LoginError, LoginErrorInit } from "@/app/context/utils/types";
import { showSnackbar } from "@/app/context/utils/showSnackBar";

export default function Complete() {
  // replacing
  const { user, fetchUserData} = useContext(AuthContext);
  const [loginError, setLoginError] = useState<LoginError>(LoginErrorInit);
  const usernameRef = useRef<HTMLDivElement>(null);
  const passwordRef = useRef<HTMLDivElement>(null);

  // errors usestate
  const [usernameMsg, setUsernameMsg] = useState<string>('');
  const [passwordMsg, setPasswordMsg] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const avatar  = useRef<HTMLImageElement>(user.avatar);
  const ErrorRef = useRef<HTMLDivElement>(null);

  const [image, setImage] = useState(user.avatar);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const router = useRouter();
  const [cookie, setCookie] = useCookies(["access_token"]);

  const RouteList = {
    Profile: "/profile",
    Login: "/login",
  };

  const uploadFile = async (e: any) => {
    const reader = new FileReader();
    reader.onload = async function(ev) {
    if (e.target.files && e.target.files[0]) {
      avatar.current.src =  e.target!.result as string;
      setImage(ev.target!.result as string);
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      const response = await postFileRequest(
        `${baseUrlUsers}/avatar`,
        formData
      );
      if (response?.error) 
      {
        if (response?.message === "Unauthorized"){
        showSnackbar("Unauthorized", false)
        return ;
        }
        showSnackbar("File format in not valide", false);
      }
    }
  }
  reader.readAsDataURL(e.target.files[0]);
  };

  const ErrorList = {
    Uauthorized: "Unauthorized",
  };

  const passwordCheck = () =>
  {
    if (password.length < 8) {
      setError(true);
      setPasswordMsg("Password must be at least 8 characters");
      showSnackbar("Password must be at least 8 characters", false);
      return false
    }
    if (password !== confirmPassword) {
      setError(true)
      setPasswordMsg("Password and confirm password do not match");
      showSnackbar("Password and confirm password do not match", false);
      return false
    }
    return true;
  }

  const updatingInfos = async  (username : string, password: string ) => {
    try{

    const response = await putRequest(
        `${baseUrlUsers}/user`,
        JSON.stringify({ username, password })
    );
    if (response?.error && response?.message === "Unauthorized"){
      showSnackbar("Unauthorized", false)
      return ;
  }
    if (response?.error)
    {
      setError(true);
        if (response?.message === 'Username you chosed already exist')
        {
          setUsernameMsg(response?.message);
          showSnackbar(response?.message, false);
        }
        else
        {
          setPasswordMsg("Password is not strong enough");
          showSnackbar("Password is not strong enough", false);
        }
          return false;
    }
    await fetchUserData();
    return true;
  }catch(err)
    {
      return false;
    }
};

  const reset = () =>
  {
    setUsernameMsg("");
    setPasswordMsg("");
    setError(false);
  }

  const handleSubmitClick = async (e: any) => {
    e.preventDefault();
    reset();
    if (username.indexOf(" ") >= 0) {
      setError(true);
      setUsernameMsg("Username must not contain spaces");
      return;
    }
    if (username.length < 6) {
      setError(true);
      setUsernameMsg("Username must be at least 6 characters");
      showSnackbar("Username must be at least 6 characters", false);
      return;
    }
    if (username.length > 15) {
      setError(true);
      setUsernameMsg("Username must be less than 15 characters");
      showSnackbar("Username must be less than 15 characters", false);
      return;
    }
    if (!passwordCheck())
      return ;
    const result = await updatingInfos(username, password);
    if (result)
    {
      showSnackbar("Your all setup now, Enjoy!", true);
      router.push("/profile");
    }
  };

  return (
    <div className="complete-info">
      <div className="container-box">
        <div className="complete-box">
          <h2>Set your Personal Details</h2>
          <p>
            feel free to edit you basic information such as username and
            password.
          </p>
          <form action="">
            <div className="input-fields">
              <div className="username">
                <label htmlFor="username">username</label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  autoComplete="off"
                />
              </div>
              {error ? (<div className="error username-error">{usernameMsg}</div>) : ""}
              <div className="password">
                <label htmlFor="password">password</label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  autoComplete="off"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
              </div>
              <div className="confirm-password">
                <label htmlFor="password">confirm password</label>
                <input
                  type="password"
                  name="confirm-password"
                  id="confirm-password"
                  autoComplete="off"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                />
              </div>
              {error ? (<div  className="error pass-error">{passwordMsg}</div>) : ""}
            </div>
            <div className="profile-box">
              <div className="current-pic">
                <Image
                  src={!image ? user.avatar: image}
                  ref={avatar}
                  width={200}
                  height={200}
                  alt="avatar"
                />
              </div>
              <div className="upload-pic">
                <span>upload new photo</span>
                <input
                  type="file"
                  name="profile-pic"
                  id="profile-pic"
                  accept="image/*"
                  autoComplete="off"
                  onChange={uploadFile}
                />
                {/* <input type="file" name="profile-pic" id="profile-pic" accept='image/*' /> */}
              </div>
            </div>
            <div className="submit">
              <input
                className="w-full p-2 uppercase font-semibold rounded-lg tracking-wider "
                type="submit"
                value="submit"
                autoComplete="off"
                onClick={handleSubmitClick}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
