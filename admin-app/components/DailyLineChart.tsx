'use client';

import { Box, useToken } from '@chakra-ui/react';
import dayjs from 'dayjs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DailyStats } from '@/hooks/useStats';

interface DailyLineChartProps {
  data: DailyStats[];
}

/**
 * Line chart showing incidents per day
 */
export default function DailyLineChart({ data }: DailyLineChartProps) {
  // Get primary color from Chakra UI theme
  const [primaryColor] = useToken('colors', ['red.500']);

  // Format data for better display
  const formattedData = data.map(item => ({
    ...item,
    // Format date for x-axis
    formattedDate: dayjs(item.date).format('DD MMM')
  }));

  return (
    <Box width="100%" height="300px" p={4}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="formattedDate" 
            padding={{ left: 10, right: 10 }} 
          />
          <YAxis 
            allowDecimals={false} 
            domain={[0, 'auto']}
          />
          <Tooltip 
            formatter={(value: number) => [`${value} incidents`, 'Nombre']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            name="Incidents"
            stroke={primaryColor}
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
