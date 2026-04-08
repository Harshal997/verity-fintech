import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'

interface AuthState {
  initialized: boolean,
  session: Session | null
  user: User | null
  loading: boolean
  error: string | null
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setSession: (session: Session | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  initialized: false,
  session: null,
  user: null,
  loading: false,
  error: null,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, initialized: true }),

  clearError: () => set({ error: null }),

  signUp: async (email, password, fullName, phone) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    })
    console.log("Sign-up response:", data, error); // Debugging line
    if (error) set({ error: error.message, loading: false })
    else set({ session: data.session, user: data.user, loading: false })
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    console.log("Sign-in response:", data, error); // Debugging line
    if (error) set({ error: error.message, loading: false })
    else set({ session: data.session, user: data.user, loading: false })
  },

  signOut: async () => {
    set({ loading: true })
    await supabase.auth.signOut()
    set({ session: null, user: null, loading: false })
  },
}))