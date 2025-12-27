import { GlassCard } from '@/src/components/ui/GlassCard';
import { MistButton } from '@/src/components/ui/MistButton';
import { colors } from '@/src/theme/colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type DewState = 'not_started' | 'waiting' | 'revealed';

interface DewStatusCardProps {
  state: DewState;
  partnerName: string;
  onPress: () => void;
}

export const DewStatusCard: React.FC<DewStatusCardProps> = ({ state, partnerName, onPress }) => {
  
  const getContent = () => {
    switch (state) {
      case 'not_started':
        return {
          title: "The Mist is thick.",
          subtitle: "Swipe to clear today's Dew.",
          button: "Clear Mist"
        };
      case 'waiting':
        return {
          title: "Mist cleared.",
          subtitle: `Waiting for ${partnerName} to answer...`,
          button: "Nudge Partner"
        };
      case 'revealed':
        return {
          title: "Clarity achieved.",
          subtitle: "See what you both shared today.",
          button: "View Answer"
        };
    }
  };

  const content = getContent();

  return (
    <GlassCard style={styles.card} variant="solid">
      <View style={styles.textContainer}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.subtitle}</Text>
      </View>
      <MistButton 
        title={content.button} 
        onPress={onPress} 
        style={styles.button}
        textStyle={{ fontSize: 14 }}
      />
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 100, // Space for Bottom Nav
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: '#FFF0F5',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontFamily: 'Outfit',
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    color: colors.muted,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    height: 44,
  }
});
