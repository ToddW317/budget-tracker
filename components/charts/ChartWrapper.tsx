'use client'

import { Line, Pie } from 'react-chartjs-2'
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
  Colors,
  ChartData,
  ChartOptions
} from 'chart.js'
import 'chartjs-adapter-date-fns'

// Register ChartJS components
ChartJS.register(
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
  Colors
)

interface LineChartProps {
  data: ChartData<'line' | 'bar'>
  options: ChartOptions
}

interface PieChartProps {
  data: ChartData<'pie'>
}

export function LineChart({ data, options }: LineChartProps) {
  return <Line data={data} options={options} />
}

export function PieChart({ data }: PieChartProps) {
  return <Pie data={data} />
} 