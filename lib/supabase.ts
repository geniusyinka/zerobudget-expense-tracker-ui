import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing Supabase environment variables')
}

// Clear any existing Supabase data from localStorage
if (typeof window !== 'undefined') {
  const localStorageKeys = Object.keys(localStorage)
  localStorageKeys.forEach(key => {
    if (key.startsWith('sb-')) {
      localStorage.removeItem(key)
    }
  })
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  nillion_collection_key: string
  created_at: string
  updated_at: string
}

export interface ExpenseMetadata {
  id: string
  user_id: string
  nillion_expense_id: string
  created_at: string
  updated_at: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function createExpenseMetadata(userId: string, nillionExpenseId: string): Promise<ExpenseMetadata | null> {
  const { data, error } = await supabase
    .from('expense_metadata')
    .insert([
      {
        user_id: userId,
        nillion_expense_id: nillionExpenseId
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating expense metadata:', error)
    return null
  }

  return data
}

export async function getExpenseMetadata(userId: string): Promise<ExpenseMetadata[]> {
  const { data, error } = await supabase
    .from('expense_metadata')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching expense metadata:', error)
    return []
  }

  return data || []
}

export async function deleteExpenseMetadata(userId: string, nillionExpenseId: string): Promise<boolean> {
  const { error } = await supabase
    .from('expense_metadata')
    .delete()
    .eq('user_id', userId)
    .eq('nillion_expense_id', nillionExpenseId)

  if (error) {
    console.error('Error deleting expense metadata:', error)
    return false
  }

  return true
} 