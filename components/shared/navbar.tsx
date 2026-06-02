'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bell, PlusCircle, User2 } from 'lucide-react'
import { Bell, PlusCircle, User2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, List } from 'lucide-react'
import { Search, List } from 'lucide-react'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetAllEmployees,
  useGetNotificationsByUserId,
  useMarksAsRead,
} from '@/hooks/use-api'

export default function Navbar() {
  useInitializeUser()

  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)

  const { data: notificationsResponse, refetch } = useGetNotificationsByUserId(
    userData?.userId || 0
  )

  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const notificationRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const companiesRef = useRef<HTMLDivElement>(null)

  const router = useRouter()

  const notifications = Array.isArray(notificationsResponse?.data)
    ? notificationsResponse.data
    : []

  const unreadCount =
    notifications.filter((notif: any) => !notif.isRead).length || 0

  const markAsReadMutation = useMarksAsRead({
    onClose: () => setIsNotificationOpen(false),
    reset: () => {},
  })

  // -------------------------
  // ROUTING LOGIC (EXTENDABLE)
  // -------------------------
  const getNotificationRoute = (notification: any) => {
    const msg = notification.notification?.toLowerCase() || ''

    if (msg.includes("you've been assigned a checklist")) {
      return '/dashboard/employee-management/checklists'
    }

    return '/dashboard'
  }

  // -------------------------
  // CLICK NOTIFICATION
  // -------------------------
  const handleNotificationClick = async (notification: any) => {
    setIsNotificationOpen(false)

    try {
      if (!notification.isRead) {
        await markAsReadMutation.mutateAsync({
          data: [notification.notificationId],
        })
      }

      refetch()

      const route = getNotificationRoute(notification)
      router.push(route)
    } catch (err) {
      console.error(err)

      const route = getNotificationRoute(notification)
      router.push(route)
    }
  }

  // -------------------------
  // MARK ALL AS READ
  // -------------------------
  const handleMarkAllAsRead = async () => {
    const allIds = notifications.map((n: any) => n.notificationId)

    markAsReadMutation.mutate({
      data: allIds,
    })

    refetch()
  }

  // -------------------------
  // SIGN OUT (UNCHANGED)
  // -------------------------
  const handleSignOut = () => {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('authToken')
    setIsProfileOpen(false)
    router.push('/')
  }

  const formatDate = (date: any) => {
    if (!date) return 'Just now'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()

    const diffMs = now.getTime() - dateObj.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return dateObj.toLocaleDateString()
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (userData?.userId) {
        refetch()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [userData?.userId, refetch])

  useEffect(() => {
    const checkUserData = () => {
      const storedUserData = localStorage.getItem('currentUser')
      const storedToken = localStorage.getItem('authToken')

      if (!storedUserData || !storedToken) {
        router.push('/')
      }
    }

    checkUserData()
  }, [userData, token, router])

  // Handle click outside for both dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false)
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false)
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node) &&
        companiesRef.current &&
        !companiesRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 border-b">
        <div className="flex items-center justify-between h-16">
          {/* LOGO */}
          <div className="flex-shrink-0 flex items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-800">Biz</span>
              <span className="text-2xl font-bold text-blue-500">Flow</span>
            </div>
          </div>

          <div className="flex items-center ml-4 gap-2">
            {/* NOTIFICATION */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative w-10 h-10"
              >
                <Bell className="h-9 w-9 text-gray-600 border border-gray-600 p-1 rounded-full" />

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md z-50">
                  <div className="px-4 py-2 border-b flex justify-between">
                    <h3 className="text-sm font-semibold">Notifications</h3>

                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-blue-600"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification: any) => (
                        <div
                          key={notification.notificationId}
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                        >
                          <p className="text-sm text-gray-900">
                            {notification.notification}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE (UNCHANGED + LOGOUT KEPT) */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10"
              >
                <User2 className="h-9 w-9 text-gray-600 border border-gray-600 p-1 rounded-full" />
              </button>


              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md">
                  <Link
                    href="/change-password"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Change Password
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
