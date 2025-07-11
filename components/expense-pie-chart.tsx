"use client"

import React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"

interface DisplayExpense {
  id: string
  amount: number
  category: string
  description: string
  date: Date
}

interface ExpensePieChartProps {
  expenses: DisplayExpense[]
}

// Color palette for different categories
const COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
]

const chartConfig = {
  "Food & Dining": {
    label: "Food & Dining",
    color: "#3B82F6",
  },
  "Transportation": {
    label: "Transportation",
    color: "#10B981",
  },
  "Shopping": {
    label: "Shopping",
    color: "#F59E0B",
  },
  "Entertainment": {
    label: "Entertainment",
    color: "#EF4444",
  },
  "Bills & Utilities": {
    label: "Bills & Utilities",
    color: "#8B5CF6",
  },
  "Healthcare": {
    label: "Healthcare",
    color: "#06B6D4",
  },
  "Travel": {
    label: "Travel",
    color: "#F97316",
  },
  "Other": {
    label: "Other",
    color: "#84CC16",
  },
}

export function ExpensePieChart({ expenses }: ExpensePieChartProps) {
  // Group expenses by category and calculate totals
  const categoryData = React.useMemo(() => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.category
      acc[category] = (acc[category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    // Convert to array format for recharts
    return Object.entries(categoryTotals).map(([category, total]) => ({
      name: category,
      value: total,
      percentage: ((total / expenses.reduce((sum, exp) => sum + exp.amount, 0)) * 100).toFixed(1),
    }))
  }, [expenses])

  // Calculate total spent
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Get budget data from localStorage
  const [budgetData, setBudgetData] = React.useState<any>(null)
  
  React.useEffect(() => {
    const savedIncome = localStorage.getItem("budget-income")
    if (savedIncome) {
      const income = parseFloat(savedIncome)
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
      
      const budgetCategories = Object.entries(defaultBudgetPercentages).map(([category, percentage]) => ({
        category,
        budget: (income * percentage) / 100,
        spent: categoryData.find(cat => cat.name === category)?.value || 0,
      }))
      
      setBudgetData({
        totalIncome: income,
        categories: budgetCategories,
      })
    }
  }, [categoryData])

  if (expenses.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl">Expense Breakdown</CardTitle>
          <CardDescription>Visualize your spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <p>No expenses to display. Add some expenses to see the breakdown.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl">Expense Breakdown</CardTitle>
        <CardDescription>
          Total spent: ${totalSpent.toFixed(2)} • {expenses.length} transactions
          {budgetData && (
            <span className="ml-2 text-emerald-600">
              • Budget: ${budgetData.totalIncome.toFixed(2)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ChartContainer config={chartConfig}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    const budgetCategory = budgetData?.categories.find((cat: any) => cat.category === data.name)
                    const budgetInfo = budgetCategory ? ` (Budget: $${budgetCategory.budget.toFixed(2)})` : ''
                    return (
                      <ChartTooltipContent
                        active={active}
                        payload={payload}
                        label={data.name}
                        formatter={(value: any) => [`$${Number(value).toFixed(2)}${budgetInfo}`, data.name]}
                      />
                    )
                  }
                  return null
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => {
                  const data = categoryData.find(item => item.name === value)
                  const budgetCategory = budgetData?.categories.find((cat: any) => cat.category === value)
                  const budgetText = budgetCategory ? ` ($${budgetCategory.budget.toFixed(0)})` : ''
                  return [
                    <span key="label" className="text-sm font-medium">
                      {value}{budgetText}
                    </span>,
                    <span key="percentage" className="text-xs text-slate-500 ml-2">
                      {data?.percentage}%
                    </span>
                  ]
                }}
              />
            </PieChart>
          </ChartContainer>
        </div>
        
        {/* Category breakdown list with budget info */}
        <div className="mt-6 space-y-2">
          <h4 className="font-medium text-sm text-slate-700 mb-3">Category Details</h4>
          {categoryData.map((category, index) => {
            const budgetCategory = budgetData?.categories.find((cat: any) => cat.category === category.name)
            const isOverBudget = budgetCategory && category.value > budgetCategory.budget
            const budgetPercentage = budgetCategory ? (category.value / budgetCategory.budget) * 100 : 0
            
            return (
              <div key={category.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                  {budgetCategory && (
                    <Badge variant={isOverBudget ? "destructive" : "secondary"} className="text-xs">
                      {budgetPercentage.toFixed(0)}% of budget
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">${category.value.toFixed(2)}</div>
                  <div className="text-xs text-slate-500">
                    {category.percentage}% of total
                    {budgetCategory && (
                      <span className={`ml-1 ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                        • Budget: ${budgetCategory.budget.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 