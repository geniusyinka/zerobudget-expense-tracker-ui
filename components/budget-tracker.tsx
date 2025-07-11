"use client"

import React, { useState, useEffect } from "react"
import { DollarSign, TrendingUp, TrendingDown, Target, Wallet, Plus, Edit, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DisplayExpense {
  id: string
  amount: number
  category: string
  description: string
  date: Date
}

interface BudgetCategory {
  category: string
  budget: number
  spent: number
  remaining: number
  percentage: number
}

interface BudgetData {
  totalIncome: number
  totalBudget: number
  totalSpent: number
  remaining: number
  categories: BudgetCategory[]
}

interface BudgetTrackerProps {
  expenses: DisplayExpense[]
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

const defaultBudgetPercentages = {
  "Food & Dining": 15,
  "Transportation": 10,
  "Shopping": 10,
  "Entertainment": 5,
  "Bills & Utilities": 25,
  "Healthcare": 10,
  "Travel": 5,
  "Other": 20,
}

export function BudgetTracker({ expenses }: BudgetTrackerProps) {
  const [income, setIncome] = useState<string>("")
  const [isEditingIncome, setIsEditingIncome] = useState(false)
  const [budgetData, setBudgetData] = useState<BudgetData>({
    totalIncome: 0,
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0,
    categories: [],
  })

  // Load budget data from localStorage on component mount
  useEffect(() => {
    const savedIncome = localStorage.getItem("budget-income")
    if (savedIncome) {
      setIncome(savedIncome)
      calculateBudgetData(parseFloat(savedIncome), expenses)
    }
  }, [expenses])

  const calculateBudgetData = (incomeAmount: number, currentExpenses: DisplayExpense[]) => {
    const totalSpent = currentExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    // Calculate budget by category based on percentages
    const categories = Object.keys(defaultBudgetPercentages)
    const budgetCategories: BudgetCategory[] = categories.map(category => {
      const budget = (incomeAmount * defaultBudgetPercentages[category as keyof typeof defaultBudgetPercentages]) / 100
      const spent = currentExpenses
        .filter(expense => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0)
      const remaining = budget - spent
      const percentage = budget > 0 ? (spent / budget) * 100 : 0

      return {
        category,
        budget,
        spent,
        remaining,
        percentage: Math.min(percentage, 100), // Cap at 100%
      }
    })

    const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.budget, 0)
    const remaining = incomeAmount - totalSpent

    setBudgetData({
      totalIncome: incomeAmount,
      totalBudget,
      totalSpent,
      remaining,
      categories: budgetCategories,
    })
  }

  const handleIncomeSave = () => {
    const incomeAmount = parseFloat(income)
    if (isNaN(incomeAmount) || incomeAmount <= 0) {
      alert("Please enter a valid income amount")
      return
    }

    localStorage.setItem("budget-income", income)
    calculateBudgetData(incomeAmount, expenses)
    setIsEditingIncome(false)
  }

  const handleIncomeCancel = () => {
    const savedIncome = localStorage.getItem("budget-income")
    if (savedIncome) {
      setIncome(savedIncome)
    } else {
      setIncome("")
    }
    setIsEditingIncome(false)
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-orange-600"
    if (percentage >= 50) return "text-yellow-600"
    return "text-green-600"
  }

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <TrendingDown className="h-4 w-4 text-red-600" />
    if (percentage >= 75) return <TrendingUp className="h-4 w-4 text-orange-600" />
    if (percentage >= 50) return <Target className="h-4 w-4 text-yellow-600" />
    return <TrendingUp className="h-4 w-4 text-green-600" />
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 75) return "bg-orange-500"
    if (percentage >= 50) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <div className="space-y-6">
      {/* Income Section */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Wallet className="h-5 w-5 text-emerald-600" />
            Monthly Income & Budget
          </CardTitle>
          <CardDescription>Set your monthly income to track spending against your budget</CardDescription>
        </CardHeader>
        <CardContent>
          {!isEditingIncome ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Monthly Income</p>
                <p className="text-3xl font-bold text-slate-900">
                  ${budgetData.totalIncome.toFixed(2)}
                </p>
              </div>
              <Button
                onClick={() => setIsEditingIncome(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="income" className="text-sm font-medium">
                  Monthly Income
                </Label>
                <Input
                  id="income"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="text-lg h-12"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleIncomeSave} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button onClick={handleIncomeCancel} variant="outline" className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Overview */}
      {budgetData.totalIncome > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Budget</p>
                  <p className="text-2xl font-bold text-slate-900">${budgetData.totalBudget.toFixed(2)}</p>
                </div>
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Spent</p>
                  <p className="text-2xl font-bold text-slate-900">${budgetData.totalSpent.toFixed(2)}</p>
                </div>
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Remaining</p>
                  <p className={`text-2xl font-bold ${budgetData.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${budgetData.remaining.toFixed(2)}
                  </p>
                </div>
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Budget Used</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {budgetData.totalBudget > 0 ? ((budgetData.totalSpent / budgetData.totalBudget) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Budgets */}
      {budgetData.totalIncome > 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl">Category Budgets</CardTitle>
            <CardDescription>Track your spending against category-specific budgets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetData.categories.map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(category.percentage)}
                      <span className="font-medium">{category.category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {defaultBudgetPercentages[category.category as keyof typeof defaultBudgetPercentages]}%
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        ${category.spent.toFixed(2)} / ${category.budget.toFixed(2)}
                      </div>
                      <div className={`text-xs ${getStatusColor(category.percentage)}`}>
                        {category.percentage.toFixed(1)}% used
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={category.percentage} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Remaining: ${category.remaining.toFixed(2)}</span>
                    <span>{category.percentage.toFixed(1)}% of budget</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Tips */}
      {budgetData.totalIncome > 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-xl text-blue-900">Budget Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budgetData.categories
                .filter(cat => cat.percentage > 75)
                .map(category => (
                  <div key={category.category} className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="text-orange-800">
                      <strong>{category.category}</strong> is at {category.percentage.toFixed(1)}% of budget
                    </span>
                  </div>
                ))}
              {budgetData.categories.filter(cat => cat.percentage > 75).length === 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-800">Great job! All categories are within budget.</span>
                </div>
              )}
              {budgetData.remaining < 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-red-800">
                    You've exceeded your total budget by ${Math.abs(budgetData.remaining).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 