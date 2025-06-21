'use client';

import { Box, useToken } from '@chakra-ui/react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { TypeStats } from '@/hooks/useStats';

interface TypeRadarChartProps {
  data: TypeStats[];
}

/**
 * Radar chart showing incident distribution by type
 */
export default function TypeRadarChart({ data }: TypeRadarChartProps) {
  // Get primary color from Chakra UI theme
  const [primaryColor] = useToken('colors', ['red.500']);

  // Format type names for better display (capitalize first letter)
  const formattedData = data.map(item => ({
    ...item,
    // Capitalize first letter of type
    formattedType: item.type.charAt(0).toUpperCase() + item.type.slice(1)
  }));

  return (
    <Box width="100%" height="300px" p={4}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart outerRadius={90} data={formattedData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="formattedType" />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
          <Radar
            name="Incidents"
            dataKey="count"
            stroke={primaryColor}
            fill={primaryColor}
            fillOpacity={0.3}
          />
          <Tooltip 
            formatter={(value: number) => [`${value} incidents`, 'Nombre']}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
}
