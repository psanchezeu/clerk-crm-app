"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface MonthlySales {
  month: string
  total: number
}

interface DashboardOverviewProps {
  data: MonthlySales[]
}

export function DashboardOverview({ data }: DashboardOverviewProps) {
  // Format the data for the chart
  const chartData = data.map((item) => {
    const [year, month] = item.month.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
    const monthName = date.toLocaleString("default", { month: "short" })

    return {
      name: monthName,
      total: Number.parseFloat(item.total.toString()),
    }
  })

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip formatter={(value) => [`$${value}`, "Sales"]} labelFormatter={(label) => `Month: ${label}`} />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}
