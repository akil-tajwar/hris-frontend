'use client'

import { atom, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { User } from './type'
import { getCurrentUser } from '@/utils/api'

export const userDataAtom = atom<User | null>(null)
export const isUserLoadingAtom = atom(true)

export const useInitializeUser = () => {
  const setUserData = useSetAtom(userDataAtom)
  const setIsLoading = useSetAtom(isUserLoadingAtom)

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true)
      const response = await getCurrentUser()

      if (response.data?.user) {
        setUserData(response.data.user)
        console.log("🚀 ~ loadUser ~ response.data.user:", response.data.user)
      } else {
        setUserData(null)
      }
      setIsLoading(false)
    }

    loadUser()
  }, [setUserData, setIsLoading])
}
