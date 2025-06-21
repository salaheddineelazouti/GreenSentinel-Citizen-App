'use client';

import {
  Box,
  Heading,
  Text,
  useColorModeValue,
  useBreakpointValue,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useState } from 'react';

interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

interface KPIChartProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  valueKey: string;
  color?: string;
  type: 'line' | 'bar';
  metric: string;
  currentValue?: number;
  previousValue?: number;
  changeLabel?: string;
}

export default function KPIChart({
  title,
  description,
  data,
  valueKey,
  color = '#E63946',
  type = 'line',
  metric,
  currentValue,
  previousValue,
  changeLabel,
}: KPIChartProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subTextColor = useColorModeValue('gray.600', 'gray.400');
  const gridColor = useColorModeValue('#e0e0e0', '#4a5568');
  
  const chartHeight = useBreakpointValue({ base: 200, md: 300 });
  
  // Format x-axis ticks to be more readable
  const formatXAxis = (tickItem: string) => {
    // Assuming tickItem is a date string
    try {
      const date = new Date(tickItem);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return tickItem;
    }
  };
  
  // Calculate percent change for display in stat
  const percentChange = previousValue && currentValue 
    ? ((currentValue - previousValue) / previousValue * 100).toFixed(1)
    : null;
  
  const isIncrease = percentChange && parseFloat(percentChange) > 0;
  
  return (
    <Box
      p={5}
      borderWidth="1px"
      borderRadius="lg"
      bg={bg}
      borderColor={borderColor}
      boxShadow="sm"
      maxW="100%"
      mb={4}
    >
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" mb={4}>
        <Box mb={{ base: 3, md: 0 }}>
          <Heading size="md" color={textColor} mb={1}>
            {title}
          </Heading>
          {description && (
            <Text fontSize="sm" color={subTextColor}>
              {description}
            </Text>
          )}
        </Box>
        
        {currentValue !== undefined && (
          <Stat textAlign={{ base: 'left', md: 'right' }}>
            <StatLabel>{metric}</StatLabel>
            <StatNumber>{currentValue}</StatNumber>
            {percentChange && (
              <StatHelpText color={isIncrease ? 'green.500' : 'red.500'}>
                {isIncrease ? '↑' : '↓'} {Math.abs(parseFloat(percentChange))}% {changeLabel || 'vs. previous period'}
              </StatHelpText>
            )}
          </Stat>
        )}
      </Flex>
      
      <Box height={`${chartHeight}px`}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis} 
                tick={{ fontSize: 12 }}
                angle={-30}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [value, valueKey]}
                labelFormatter={(label) => {
                  try {
                    return new Date(label).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    });
                  } catch (e) {
                    return label;
                  }
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line 
                type="monotone" 
                dataKey={valueKey} 
                stroke={color} 
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={{ strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis} 
                tick={{ fontSize: 12 }}
                angle={-30}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [value, valueKey]}
                labelFormatter={(label) => {
                  try {
                    return new Date(label).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    });
                  } catch (e) {
                    return label;
                  }
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey={valueKey} fill={color} barSize={20} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
