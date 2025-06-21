'use client';

import { Select, FormControl, FormLabel, Text } from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { PeriodDays } from '@/hooks/useStats';

interface DateRangeSelectProps {
  value: PeriodDays;
  onChange: (value: PeriodDays) => void;
  isLoading?: boolean;
}

/**
 * Period selector for stats page
 * Allows choosing between 7, 30, or 90 days of data
 */
export default function DateRangeSelect({ value, onChange, isLoading = false }: DateRangeSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(Number(e.target.value) as PeriodDays);
  };

  return (
    <FormControl maxWidth="300px">
      <FormLabel display="flex" alignItems="center">
        <CalendarIcon mr={2} />
        <Text>Période</Text>
      </FormLabel>
      <Select 
        value={value}
        onChange={handleChange}
        isDisabled={isLoading}
      >
        <option value="7">7 jours</option>
        <option value="30">30 jours</option>
        <option value="90">90 jours</option>
      </Select>
    </FormControl>
  );
}
