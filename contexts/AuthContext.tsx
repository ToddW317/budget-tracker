'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface UserProfile {
  phoneNumber: string | null
  notificationsEnabled: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  userProfile: UserProfile | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userProfile: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateUserProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Error signing in with Google:', error)
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    if (!user) return
    try {
      // Implement your profile update logic here
      setUserProfile(prev => ({ ...prev!, ...profile }))
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      userProfile, 
      signInWithGoogle, 
      signOut,
      updateUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)