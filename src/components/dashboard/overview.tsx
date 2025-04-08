"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts"
import { formatCurrency } from "@/lib/utils"

const data = [
  {
    name: "Jan",
    total: Math.floor(Math.random() * 5000000) + 1000000,
  },
  {
    name: "Feb",
    total: Math.floor(Math.random() * 5000000) + 1000000,
  },
  {
    name: "Mar",
    total: Math.floor(Math.random() * 5000000) + 1000000,
  },
  {
    name: "Apr",
    total: Math.floor(Math.random() * 5000000) + 1000000,
  },
  {
    name: "May",
    total: Math.floor(Math.random() * 5000000) + 1000000,
  },
  {
    name: "Jun",
    total: Math.floor(Math.random() * 5000000) + 1000000,
  },
  {
    name: "Jul",
    total: Math.floor(Math.random() * 5000000) + 1000000,
  },
]

// Define a colorful gradient palette
const COLORS = [
  'rgba(255, 99, 132, 0.8)',
  'rgba(54, 162, 235, 0.8)',
  'rgba(255, 206, 86, 0.8)',
  'rgba(75, 192, 192, 0.8)',
  'rgba(153, 102, 255, 0.8)',
  'rgba(255, 159, 64, 0.8)',
  'rgba(255, 99, 132, 0.8)',
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white/20 dark:bg-black/80 backdrop-blur-sm p-3 shadow-lg border-white/30 dark:border-white/10">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-white/80">
              {label}
            </span>
            <span className="font-bold text-white">
              {formatCurrency(payload[0].value)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="rgba(255, 255, 255, 0.5)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="rgba(255, 255, 255, 0.2)" stopOpacity={0.2}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-white/20" />
        <XAxis
          dataKey="name"
          stroke="white"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value}
          tick={{ fill: "white" }}
        />
        <YAxis
          stroke="white"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value)}
          tick={{ fill: "white" }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="total"
          radius={[6, 6, 0, 0]}
          className="fill-white"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]} 
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth={1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
} 