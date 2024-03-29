import React from 'react'
import { useState, useEffect } from 'react';
import { baseUrlUsers, getRequest } from '@/app/context/utils/service';
import Image from 'next/image';
import UserCard from './UserCard/UserCard';
import { showSnackbar } from '@/app/context/utils/showSnackBar';

export default function UserProfile({ username }: { username: string }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try{
    const fetchUsers = async () => {
        const allUsers = await getRequest(`${baseUrlUsers}/users`);
        if (allUsers.error && allUsers.message === "Unauthorized"){
          showSnackbar("Unauthorized", false)
          return ;
      }
        const currentUser = allUsers.filter((user: any) => user.username === username );
        if (currentUser.length === 0) return setUser(null)
        else {
          setUser(currentUser[0]);
        }
        setLoading(false);
    };

    (async () =>{
    await fetchUsers()
    })();

    const debouncedFetchUsers = setTimeout( async() => {
      await fetchUsers();
    }, 300);

    return () => {
      clearTimeout(debouncedFetchUsers);
    };
  }catch (error) {
  }
  }, [username]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;
  return (
    <div className='text-slate-50'>
      <UserCard user={user} />
    </div>
  )
}
