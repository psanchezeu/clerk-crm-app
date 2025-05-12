"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  {
    name: "Jan",
    total: Math.floor(Math.random() * 5000) + 1000,
    opportunities: Math.floor(Math.random() * 10) + 5,
  },
  {
    name: "Feb",
    total: Math.floor(Math.random() * 5000) + 1000,
    opportunities: Math.floor(Math.random() * 10) + 5,
  },
  {
    name: "Mar",
    total: Math.floor(Math.random() * 5000) + 1000,
    opportunities: Math.floor(Math.random() * 10) + 5,
  },
  {
    name: "Apr",
    total: Math.floor(Math.random() * 5000) + 1000,
    opportunities: Math.floor(Math.random() * 10) + 5,
  },
  {
    name: "May",
    total: Math.floor(Math.random() * 5000) + 1000,
    opportunities: Math.floor(Math.random() * 10) + 5,
  },
  {
    name: "Jun",
    total: Math.floor(Math.random() * 5000) + 1000,
    opportunities: Math.floor(Math.random() * 10) + 5,
  },
  {
    name: "Jul",
    total: Math.floor(Math.random() * 5000) + 1000,
    opportunities: Math.floor(Math.random() * 10) + 5,
  },
  {
    name: "Aug",
    total: Math.floor(Math.random() * 5000) + 1000,
    opportunities: Math.floor(Math.random() * 10) + 5,
  },
  {
    name: "Sep",
    total: Math.floor(Math.random() * 5000) + 1000,
    opportunities: Math.floor(Math.random() * 10) + 5,
  },
  {
    name: "Oct",
    total: Math.floor(Math.random() * 5000) + 1000,
    opportunities: Math.floor(Math.random() * 10) + 5,
  },
  {
    name: "Nov",
    total: Math.floor(Math.random() * 5000) + 1000,
    opportunities: Math.floor(Math.random() * 10) + 5,
  },
  {
    name: "Dec",
    total: Math.floor(Math.random() * 5000) + 1000,
    opportunities: Math.floor(Math.random() * 10) + 5,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}
