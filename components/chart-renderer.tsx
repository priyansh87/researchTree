'use client'

import React from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area'
  title?: string
  data: any[]
  xAxis?: string
  yAxis?: string
  dataKey?: string
  categories?: string[]
  colors?: string[]
}

const DEFAULT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function ChartRenderer({ config }: { config: ChartConfig }) {
  if (!config.data || config.data.length === 0) {
    return <div className="text-zinc-400 text-sm">No data available for chart</div>
  }

  const colors = config.colors || DEFAULT_COLORS

  const commonProps = {
    data: config.data,
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
  }

  const chartContainerClass = 'w-full h-80 mb-4'

  switch (config.type) {
    case 'line':
      return (
        <div className="space-y-2">
          {config.title && <h4 className="text-sm font-semibold text-white">{config.title}</h4>}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis
                dataKey={config.xAxis || 'name'}
                stroke="#a1a1aa"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#a1a1aa" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              {config.categories ? (
                config.categories.map((category, idx) => (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))
              ) : (
                <Line
                  type="monotone"
                  dataKey={config.dataKey || 'value'}
                  stroke={colors[0]}
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )

    case 'bar':
      return (
        <div className="space-y-2">
          {config.title && <h4 className="text-sm font-semibold text-white">{config.title}</h4>}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis
                dataKey={config.xAxis || 'name'}
                stroke="#a1a1aa"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#a1a1aa" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              {config.categories ? (
                config.categories.map((category, idx) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    fill={colors[idx % colors.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))
              ) : (
                <Bar dataKey={config.dataKey || 'value'} fill={colors[0]} radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )

    case 'pie':
      return (
        <div className="space-y-2">
          {config.title && <h4 className="text-sm font-semibold text-white">{config.title}</h4>}
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={config.data}
                dataKey={config.dataKey || 'value'}
                nameKey={config.xAxis || 'name'}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {config.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: '#f1f5f9' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )

    case 'area':
      return (
        <div className="space-y-2">
          {config.title && <h4 className="text-sm font-semibold text-white">{config.title}</h4>}
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis
                dataKey={config.xAxis || 'name'}
                stroke="#a1a1aa"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#a1a1aa" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              {config.categories ? (
                config.categories.map((category, idx) => (
                  <Area
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={colors[idx % colors.length]}
                    fill={colors[idx % colors.length]}
                    fillOpacity={0.6}
                  />
                ))
              ) : (
                <Area
                  type="monotone"
                  dataKey={config.dataKey || 'value'}
                  stroke={colors[0]}
                  fill="url(#colorArea)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )

    default:
      return null
  }
}
