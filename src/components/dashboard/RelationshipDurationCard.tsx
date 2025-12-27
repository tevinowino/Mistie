import { differenceInDays, differenceInHours, differenceInMinutes, differenceInMonths, differenceInSeconds, differenceInWeeks, differenceInYears, parseISO } from 'date-fns';
import { BlurView } from 'expo-blur';
import { CalendarHeart } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useColors } from '../../hooks/useColors';

interface Props {
  date: string; // YYYY-MM-DD
}

export const RelationshipDurationCard = ({ date }: Props) => {
  const colors = useColors();
  const { isDark } = useTheme();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const duration = useMemo(() => {
    if (!date) return null;
    
    let startDate;
    try {
      startDate = parseISO(date);
      // Ensure we start at 00:00:00 of that day
      startDate.setHours(0, 0, 0, 0);
    } catch (e) {
      return null;
    }

    // Cascade calculation
    let tempDate = new Date(startDate);
    
    const years = differenceInYears(now, tempDate);
    tempDate.setFullYear(tempDate.getFullYear() + years);
    
    const months = differenceInMonths(now, tempDate);
    tempDate.setMonth(tempDate.getMonth() + months);
    
    const weeks = differenceInWeeks(now, tempDate);
    tempDate.setDate(tempDate.getDate() + (weeks * 7));
    
    const days = differenceInDays(now, tempDate);
    tempDate.setDate(tempDate.getDate() + days);
    
    const hours = differenceInHours(now, tempDate);
    tempDate.setHours(tempDate.getHours() + hours);
    
    const minutes = differenceInMinutes(now, tempDate);
    tempDate.setMinutes(tempDate.getMinutes() + minutes);
    
    const seconds = differenceInSeconds(now, tempDate);

    return [
      { value: years, label: 'Yrs' },
      { value: months, label: 'Mo' },
      { value: weeks, label: 'Wks' },
      { value: days, label: 'Days' },
      { value: hours, label: 'Hrs' },
      { value: minutes, label: 'Min' },
      { value: seconds, label: 'Sec' }
    ];
  }, [date, now]);

  if (!duration) return null;

  return (
    <View 
      className="mb-8 rounded-full overflow-hidden border"
      style={{ 
        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)',
        backgroundColor: 'transparent'
      }} 
    >
      <BlurView 
        intensity={isDark ? 40 : 80} 
        tint={isDark ? 'dark' : 'light'}
        className="flex-row items-center justify-between px-5 py-3"
      >
        <View 
          className="flex-row items-center mr-3 p-2 rounded-full"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.card }}
        >
          <CalendarHeart size={18} color={colors.primary} />
        </View>
        
        <View className="flex-1 flex-row justify-between items-center">
          {duration.map((item, index) => {
            return (
              <View key={index} className="items-center px-[2px]">
                <Text 
                  className="text-base font-bold font-outfit tabular-nums leading-tight"
                  style={{ color: colors.text }}
                >
                  {item.value}
                </Text>
                <Text 
                  className="text-[9px] font-quicksand font-bold uppercase tracking-tight"
                  style={{ color: colors.muted }}
                >
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};
