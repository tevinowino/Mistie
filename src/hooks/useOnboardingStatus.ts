import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { bondService } from '../services/bondService';
import { profileService } from '../services/profileService';

export const useOnboardingStatus = () => {
  const { user } = useAuth();
  const [isUserProfileComplete, setIsUserProfileComplete] = useState<boolean>(true);
  const [isBondProfileComplete, setIsBondProfileComplete] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);
  const [bond, setBond] = useState<any>(null);

  const checkStatus = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. Check User Profile
      // The user object from AuthContext might be the auth user, we need the profile table data
      const { data: profile } = await profileService.getProfile(user.id);
      
      if (profile) {
        // Check explicit flag OR if key fields are missing (fallback)
        const isComplete = profile.is_onboarding_complete; 
        // fallback: || (!!profile.display_name && !!profile.birth_date);
        
        setIsUserProfileComplete(!!isComplete);
      }

      // 2. Check Bond Profile
      const { data: bondData } = await bondService.getUserBond(user.id);
      setBond(bondData);

      if (bondData && bondData.status === 'couple') {
         const isComplete = bondData.is_onboarding_complete;
         setIsBondProfileComplete(!!isComplete);
      } else {
        // If no bond, or pending, we don't nag about bond profile yet
        setIsBondProfileComplete(true);
      }

    } catch (e) {
      console.error('Error checking onboarding status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [user]);

  return {
    isUserProfileComplete,
    isBondProfileComplete,
    isLoading,
    bond,
    refreshStatus: checkStatus
  };
};
