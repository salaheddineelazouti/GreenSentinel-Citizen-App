'use client';

import { Box, useToken } from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ResponseTimeStats } from '@/hooks/useStats';

interface ResponseTimeBarProps {
  data: ResponseTimeStats[];
}

/**
 * Bar chart showing average response times by time buckets
 */
export default function ResponseTimeBar({ data }: ResponseTimeBarProps) {
  // Get colors from Chakra UI theme
  const [yellow, orange, red] = useToken('colors', ['yellow.400', 'orange.400', 'red.500']);

  // Sort data by bucket for consistent display
  const sortedData = [...data].sort((a, b) => {
    // Extract the first number from each bucket (e.g., "0-15" => 0)
    const getFirstNumber = (bucket: string) => parseInt(bucket.split('-')[0], 10);
    return getFirstNumber(a.bucket) - getFirstNumber(b.bucket);
  });

  // Map bucket to appropriate color
  const getBucketColor = (bucket: string): string => {
    if (bucket.includes('0-15')) return yellow;
    if (bucket.includes('15-30')) return orange;
    return red; // 30-60 or other
  };

  return (
    <Box width="100%" height="300px" p={4}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="bucket" 
            label={{ value: 'Minutes', position: 'insideBottom', offset: -5 }} 
          />
          <YAxis 
            label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(1)} min`, 'Temps moyen']}
            labelFormatter={(label) => `Plage: ${label} min`}
          />
          <Legend />
          {sortedData.map((entry) => (
            <Bar 
              key={entry.bucket} 
              dataKey="avg" 
              name={`${entry.bucket} min`}
              fill={getBucketColor(entry.bucket)} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
