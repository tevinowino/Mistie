import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
});

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [networkState, setNetworkState] = useState<NetInfoState>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    details: null,
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value = {
    isConnected: networkState.isConnected ?? false,
    isInternetReachable: networkState.isInternetReachable ?? false,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}
