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

type MixedChartData = ChartData<'line' | 'bar'>
type MixedChartOptions = ChartOptions<'line' | 'bar'>

interface LineChartProps {
  data: MixedChartData
  options: MixedChartOptions
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