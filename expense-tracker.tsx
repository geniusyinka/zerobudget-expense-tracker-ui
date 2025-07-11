"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Lock, Shield, Plus, TrendingUp, Calculator, Filter, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ChatBot } from "@/components/chat-bot"
import { ExpensePieChart } from "@/components/expense-pie-chart"
import { BudgetTracker } from "@/components/budget-tracker"
import { useAuth } from "@/lib/auth-context"
import { getUserProfile, createExpenseMetadata, getExpenseMetadata, deleteExpenseMetadata } from "@/lib/supabase"

interface RawNillionExpense {
  _id?: string
  id?: string
  amount: number
  cat?: string
  category?: string
  desc?: string
  description?: string
  timestamp?: string
  date?: string
  userId?: string
  supabaseUserId?: string
  data?: any
}

interface ProcessedNillionExpense {
  _id: string
  amount: number
  cat?: string
  category?: string
  desc?: string
  description?: string
  timestamp?: string
  date?: string
  userId: string
  supabaseUserId: string
  data?: any
}

interface Expense {
  _id?: string
  amount: number
  cat: string
  desc: string
  timestamp?: string
  supabaseUserId: string
}

interface DisplayExpense {
  id: string
  amount: number
  category: string
  description: string
  date: Date
  supabaseUserId: string
}

const categories = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Other",
]

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/vault"

interface ApiServiceProps {
  userId: string
  sessionToken: string
  collectionKey: string
}

const createApiService = ({ userId, sessionToken, collectionKey }: ApiServiceProps) => ({
  async createExpense(expense: Expense) {
    console.log('Creating expense with headers:', {
      Authorization: `Bearer ${sessionToken}`,
      'X-Collection-Key': collectionKey,
    })
    
    // Include userId in the actual expense data
    const expenseWithUser = {
      ...expense,
      userId: userId, // Add userId directly in the data
      supabaseUserId: userId,
      collectionKey: collectionKey,
      timestamp: new Date().toISOString()
    }
    
    console.log('Sending expense data:', expenseWithUser)
    
    const response = await fetch(`${API_BASE_URL}/write`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sessionToken}`,
        "X-Collection-Key": collectionKey,
      },
      body: JSON.stringify(expenseWithUser),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Failed to create expense: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('Nillion API response:', result)

    // Extract the expense ID from the createdIds array
    if (!result.createdIds || !result.createdIds[0]) {
      console.error('Unexpected API response structure:', result)
      throw new Error('Could not find expense ID in API response')
    }

    const expenseId = result.createdIds[0]
    console.log('Extracted expense ID:', expenseId)
    
    // Create metadata entry in Supabase
    try {
      const metadata = await createExpenseMetadata(userId, expenseId)
      console.log('Created expense metadata:', metadata)
    } catch (error) {
      console.error('Failed to create expense metadata:', error)
      throw new Error('Failed to create expense metadata')
    }
    
    // Return both the Nillion response and the first written expense data
    return {
      ...result,
      data: {
        ...expenseWithUser,
        _id: expenseId
      }
    }
  },

  async getExpenses() {
    console.log('Getting expenses with headers:', {
      Authorization: `Bearer ${sessionToken}`,
      'X-Collection-Key': collectionKey,
    })
    
    // Get metadata from Supabase first - this only returns the current user's expense IDs
    const metadata = await getExpenseMetadata(userId)
    console.log('Expense metadata for user:', { userId, metadata })
    
    if (metadata.length === 0) {
      console.log('No expenses found for user:', userId)
      return { data: [] }
    }

    // Fetch each expense from Nillion using the metadata IDs
    const expensePromises = metadata.map(async (meta) => {
      try {
        const response = await fetch(`${API_BASE_URL}/read/${meta.nillion_expense_id}`, {
          headers: {
            "Authorization": `Bearer ${sessionToken}`,
            "X-Collection-Key": collectionKey,
          }
        })
        
        if (!response.ok) {
          console.error(`Failed to fetch expense ${meta.nillion_expense_id}:`, response.statusText)
          return null
        }
        
        const result = await response.json()
        console.log(`Individual expense ${meta.nillion_expense_id} data:`, result)

        // Process the expense data
        const rawExpense: RawNillionExpense = result.data || result
        const processedExpense: ProcessedNillionExpense = {
          ...rawExpense,
          _id: meta.nillion_expense_id,
          userId: userId,
          supabaseUserId: userId,
          amount: rawExpense.amount || 0
        }
        return processedExpense
      } catch (error) {
        console.error(`Error fetching expense ${meta.nillion_expense_id}:`, error)
        return null
      }
    })
    
    const results = await Promise.all(expensePromises)
    const validResults = results.filter((result): result is ProcessedNillionExpense => result !== null)
    console.log('Valid expenses for user:', { userId, count: validResults.length })
    
    return { data: validResults }
  },

  async updateExpense(id: string, expense: Expense) {
    console.log('Updating expense with headers:', {
      Authorization: `Bearer ${sessionToken}`,
      'X-Collection-Key': collectionKey,
    })
    
    const response = await fetch(`${API_BASE_URL}/update/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sessionToken}`,
        "X-Collection-Key": collectionKey,
      },
      body: JSON.stringify({ 
        ...expense,
        supabaseUserId: userId,
        collectionKey: collectionKey,
        timestamp: new Date().toISOString()
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error("Failed to update expense")
    }
    
    return response.json()
  },

  async deleteExpense(id: string) {
    console.log('Deleting expense with headers:', {
      Authorization: `Bearer ${sessionToken}`,
      'X-Collection-Key': collectionKey,
    })
    
    const response = await fetch(`${API_BASE_URL}/delete/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${sessionToken}`,
        "X-Collection-Key": collectionKey,
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error("Failed to delete expense")
    }
    
    // Delete metadata from Supabase
    await deleteExpenseMetadata(userId, id)
    
    return response.json()
  },
})

function convertToDisplayExpense(apiExpense: ProcessedNillionExpense): DisplayExpense {
  console.log('Converting expense:', apiExpense)

  const displayExpense: DisplayExpense = {
    id: apiExpense._id,
    amount: apiExpense.amount,
    category: apiExpense.cat || apiExpense.category || '',
    description: apiExpense.desc || apiExpense.description || '',
    date: new Date(apiExpense.timestamp || apiExpense.date || Date.now()),
    supabaseUserId: apiExpense.userId || apiExpense.supabaseUserId
  }

  console.log('Final converted display expense:', displayExpense)
  return displayExpense
}

function convertToApiExpense(amount: string, category: string, description: string, userId: string): Expense {
  const apiExpense: Expense = {
    amount: parseFloat(amount),
    cat: category,
    desc: description,
    timestamp: new Date().toISOString(),
    supabaseUserId: userId
  }
  console.log('Converted to API expense:', apiExpense)
  return apiExpense
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<DisplayExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const { user, session, userProfile, signOut } = useAuth()

  // Create API service with user ID, session token, and collection key
  const apiService = user && session && userProfile ? createApiService({ 
    userId: user.id,
    sessionToken: session.access_token,
    collectionKey: userProfile.nillion_collection_key
  }) : null

  useEffect(() => {
    if (user && session && userProfile) {
      loadExpenses()
    } else {
      setExpenses([]) // Clear expenses when user logs out
    }
  }, [user, session, userProfile])

  const loadExpenses = async () => {
    if (!apiService || !user) return

    try {
      setLoading(true)
      setError(null)
      console.log('Fetching expenses for user:', user.id)
      const response = await apiService.getExpenses()
      console.log('Raw API Response:', response)
      
      if (!response || !response.data) {
        console.log('No data in response')
        setExpenses([])
        return
      }
      
      const expensesData = Array.isArray(response.data) ? response.data : [response.data]
      console.log('Expenses data array:', expensesData)
      
      const displayExpenses = expensesData
        .map(expense => {
          try {
            const converted = convertToDisplayExpense(expense as ProcessedNillionExpense)
            console.log('Converted expense:', converted)
            return converted
          } catch (error) {
            console.error('Error converting expense:', error)
            return null
          }
        })
        .filter((expense): expense is DisplayExpense => {
          if (!expense) {
            return false
          }
          
          // Validate the expense data
          const hasValidAmount = typeof expense.amount === 'number' && expense.amount > 0
          const hasValidCategory = typeof expense.category === 'string' && expense.category.length > 0
          const hasValidDescription = typeof expense.description === 'string' && expense.description.length > 0
          const belongsToUser = typeof expense.supabaseUserId === 'string' && expense.supabaseUserId === user.id
          
          const isValid = hasValidAmount && hasValidCategory && hasValidDescription && belongsToUser
          
          if (!isValid) {
            console.log('Filtered out expense:', {
              expense,
              reason: {
                invalidAmount: !hasValidAmount,
                missingCategory: !hasValidCategory,
                missingDescription: !hasValidDescription,
                wrongUser: !belongsToUser
              }
            })
          }
          return isValid
        })
      
      console.log('Final display expenses:', displayExpenses)
      setExpenses(displayExpenses)
    } catch (err) {
      console.error("Detailed error loading expenses:", err)
      setError("Failed to load expenses")
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category || !description || !user) return

    try {
      setError(null)
      const apiExpense = convertToApiExpense(amount, category, description, user.id)
      console.log('Submitting expense:', apiExpense)
      
      const result = await apiService?.createExpense(apiExpense)
      console.log('Create expense response:', result)

      await loadExpenses()

      setAmount("")
      setCategory("")
      setDescription("")
    } catch (err) {
      console.error("Detailed error saving expense:", err)
      setError("Failed to save expense")
    }
  }

  // If no user is authenticated, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>You need to be logged in to track expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/login'} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredExpenses = useMemo(() => {
    console.log('Filtering expenses:', { filterCategory, expenses })
    const filtered = filterCategory === "all" 
      ? expenses 
      : expenses.filter(expense => {
          const matches = expense.category === filterCategory
          console.log('Filtering expense:', { expense, filterCategory, matches })
          return matches
        })
    console.log('Filtered expenses:', filtered)
    return filtered
  }, [filterCategory, expenses])

  const totalSpent = useMemo(() => {
    const total = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    console.log('Calculated total spent:', total)
    return total
  }, [filteredExpenses])

  const averageSpend = useMemo(() => {
    const avg = filteredExpenses.length > 0 ? totalSpent / filteredExpenses.length : 0
    console.log('Calculated average spend:', avg)
    return avg
  }, [filteredExpenses, totalSpent])

  const safeTotalSpent = isNaN(totalSpent) ? 0 : totalSpent
  const safeAverageSpend = isNaN(averageSpend) ? 0 : averageSpend

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-emerald-600" />
              <h1 className="text-4xl font-bold text-slate-900">ZeroBudget</h1>
            </div>
            <Button 
              variant="outline" 
              size="default" 
              onClick={signOut}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Lock className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Track your expenses without giving up your data
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <Lock className="h-4 w-4" />
              <span>End-to-end encrypted • Privacy-first • Your data stays yours</span>
            </div>
          </div>
        </div>

        {/* Quick Income Setup */}
        {!localStorage.getItem("budget-income") && (
          <Card className="shadow-sm border border-emerald-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-emerald-900">
                <Wallet className="h-5 w-5" />
                Set Your Monthly Income
              </CardTitle>
              <CardDescription className="text-emerald-700">
                Set your monthly income to enable budget tracking and spending analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="quick-income" className="text-sm font-medium text-emerald-800">
                    Monthly Income
                  </Label>
                  <Input
                    id="quick-income"
                    type="number"
                    step="0.01"
                    placeholder="5000.00"
                    className="text-lg h-12 border-emerald-200 focus:border-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement
                        if (input.value) {
                          localStorage.setItem("budget-income", input.value)
                          window.location.reload()
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <Card className="shadow-sm border border-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Total Spent</Label>
                <div className="text-2xl font-bold">${safeTotalSpent.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Average Expense</Label>
                <div className="text-2xl font-bold">${safeAverageSpend.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter */}
        <Card className="shadow-sm border border-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Add Expense Form */}
        <Card className="shadow-sm border border-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter expense description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
              <Button type="submit" className="w-full">
                Add Expense
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Expense List */}
        <Card className="shadow-sm border border-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : error ? (
              <div className="text-center py-4 text-red-600">{error}</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-4 text-slate-500">
                {expenses.length === 0 ? 'No expenses found' : 'No expenses match the selected filter'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExpenses.map((expense) => {
                  console.log('Rendering expense:', expense)
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{expense.description}</div>
                        <div className="text-sm text-slate-500">
                          <Badge variant="secondary">{expense.category}</Badge>
                          <span className="mx-2">•</span>
                          {expense.date.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="font-bold">${expense.amount.toFixed(2)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <ExpensePieChart expenses={expenses} />
        <BudgetTracker expenses={expenses} />

        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mb-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>Your financial data is encrypted and stored locally</span>
          </div>
          <p className="text-xs text-slate-500">ZeroBudget • Privacy-first expense tracking • No data collection</p>
        </div>
      </div>

      {/* Chat Bot */}
      <ChatBot expenses={expenses} />
    </div>
  )
}


