'use client'

import { useAuth } from '@/lib/auth-context'
import ExpenseTracker from '../expense-tracker'
import { LoginForm } from '@/components/auth/login-form'

export default function Page() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <ExpenseTracker userId={user.id} />
}
