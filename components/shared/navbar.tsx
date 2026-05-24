'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bell, PlusCircle, User2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, List } from 'lucide-react'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetAllEmployees,
  useGetNotificationsByUserId,
  useMarksAsRead, // ✅ ADDED ONLY
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

  // Extract notifications array from response
  const notifications = Array.isArray(notificationsResponse?.data)
    ? notificationsResponse.data
    : []

  // Calculate unread notifications count
  const unreadCount =
    notifications.filter((notif: any) => !notif.isRead).length || 0

  // ✅ ADDED: mutation (NO UI CHANGE)
  const markAsReadMutation = useMarksAsRead({
    onClose: () => setIsNotificationOpen(false),
    reset: () => {},
  })

  // Auto-refetch notifications every 30 seconds
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
        return
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
        profileRef.current &&
        !profileRef.current.contains(event.target as Node) &&
        companiesRef.current &&
        !companiesRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('authToken')
    setIsProfileOpen(false)
    router.push('/')
  }

  // ✅ FIXED: mark single notification (NO UI CHANGE)
  const handleMarkAsRead = async (notificationId: number) => {
    markAsReadMutation.mutate({
      data: [notificationId],
    })

    refetch()
  }

  // ✅ FIXED: mark all notifications (NO UI CHANGE)
  const handleMarkAllAsRead = async () => {
    const allIds = notifications.map((n: any) => n.notificationId)

    markAsReadMutation.mutate({
      data: allIds,
    })

    refetch()
  }

  const handleNotificationClick = (notification: any) => {
    setIsNotificationOpen(false)
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

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 border-b">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-800">Biz</span>
              <span className="text-2xl font-bold text-blue-500">Flow</span>
            </div>
          </div>

          <div className="flex items-center ml-4 gap-2">
            {/* Notification Bell Icon */}
            <div className="relative" ref={notificationRef}>
              <button
                className="flex items-center justify-center w-10 h-10 text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-gray-300 transition duration-500 ease-in-out relative"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              >
                <Bell className="h-9 w-9 text-gray-600 border border-gray-600 p-1 rounded-full" />

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown (UNCHANGED UI) */}
              {isNotificationOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg z-50">
                  <div className="py-2 rounded-md bg-white shadow-xs">
                    <div className="px-4 py-2 border-b flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Notifications
                      </h3>

                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications && notifications.length > 0 ? (
                        notifications.map((notification: any) => (
                          <div
                            key={notification.notificationId}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                              !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm text-gray-900">
                                  {notification.notification}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(notification.createdAt)}
                                </p>
                              </div>

                              {!notification.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkAsRead(
                                      notification.notificationId!
                                    )
                                  }}
                                  className="ml-2 text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                          No notifications
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-2 border-t">
                      <Link
                        href="/notifications"
                        className="text-xs text-blue-600 hover:text-blue-800 block text-center"
                        onClick={() => setIsNotificationOpen(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Icon (UNCHANGED UI) */}
            <div className="relative" ref={profileRef}>
              <button
                className="flex items-center justify-center w-10 h-10 text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-gray-300 transition duration-500 ease-in-out"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <User2 className="h-9 w-9 text-gray-600 border border-gray-600 p-1 rounded-full" />
              </button>

              {isProfileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg">
                  <div className="py-1 rounded-md bg-white shadow-xs">
                    <Link
                      href="/change-password"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Change Password
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
