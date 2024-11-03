'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ArcElement,
  BarController,
  Filler
} from 'chart.js'
import { Line, Pie, Bar } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
)

interface ChartProps {
  data: any
  options: any
}

export function LineChart({ data, options }: ChartProps) {
  return (
    <div className="w-full h-full">
      <Line data={data} options={options} />
    </div>
  )
}

export function PieChart({ data, options }: ChartProps) {
  return (
    <div className="w-full h-full">
      <Pie data={data} options={options} />
    </div>
  )
}

export function BarChart({ data, options }: ChartProps) {
  return (
    <div className="w-full h-full">
      <Bar data={data} options={options} />
    </div>
  )
} 