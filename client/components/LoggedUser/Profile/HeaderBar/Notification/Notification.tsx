import React from 'react'
import { BsBellFill } from 'react-icons/bs'
import './Notification.scss'

export default function Notification() {
  return (
    <div className="notification">
      <div className="notif-icon">
        <BsBellFill />
      </div>
    </div>
  )
}
