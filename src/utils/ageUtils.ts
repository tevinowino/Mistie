import { differenceInYears } from 'date-fns';

export const calculateAge = (birthDate?: string | Date | null): number => {
  if (!birthDate) return 18; // Default fallback matches Edge Function logic
  return differenceInYears(new Date(), new Date(birthDate));
};

export const calculateMinCoupleAge = (date1?: string | null, date2?: string | null): number => {
  const age1 = calculateAge(date1);
  const age2 = calculateAge(date2);
  return Math.min(age1, age2);
};
