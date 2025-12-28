import { useTheme } from '@/src/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Check, Droplets, Flame, Heart, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface WalkthroughModalProps {
  visible: boolean;
  onComplete: () => void;
}

const SLIDES = [
  {
    id: 'nugs',
    title: 'Send Some Love',
    subtitle: 'Nugs are small gestures of affection. Send a "tap" or a short note to let them know you\'re thinking of them.Tap to send a nug, and long-press to send a message.',
    icon: <Heart size={64} color="#FF4B7D" fill="#FF4B7D" />,
    color: '#FF4B7D',
  },
  {
    id: 'dew',
    title: 'Daily Dew',
    subtitle: 'Every day brings a new question. Answer it to unlock your partner\'s response and deepen your understanding.',
    icon: <Droplets size={64} color="#64B5F6" />,
    color: '#64B5F6',
  },
  {
    id: 'streaks',
    title: 'Build Your Streak',
    subtitle: 'Consistency is key. Connect daily by sending Nugs or doing the Daily Dew to keep your fire burning.',
    icon: <Flame size={64} color="#FF9800" fill="#FF9800" />,
    color: '#FF9800',
  },
  {
    id: 'ring',
    title: 'Harmony Ring',
    subtitle: 'Your bond health at a glance. Grow from New to Thriving by staying active together.',
    icon: <Sparkles size={64} color="#F1088C" />,
    color: '#F1088C',
    extraContent: (
      <View style={{ marginTop: 16, width: '100%', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
           <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' }} />
           <Text style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#666' }}>Thriving ({'>'}80%): You're on fire!</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
           <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFC107' }} />
           <Text style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#666' }}>Growing (60-80%): Solid connection.</Text>
        </View>
         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
           <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5722' }} />
           <Text style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#666' }}>Budding ({'<'}40%): Keep watering it.</Text>
        </View>
      </View>
    )
  },
];

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({ visible, onComplete }) => {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Complete
      await AsyncStorage.setItem('has_seen_intro', 'true');
      onComplete();
    }
  };

  if (!visible) return null;

  const currentSlide = SLIDES[currentIndex];

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        {/* Background Gradient */}
        <LinearGradient
          colors={isDark ? ['#1A0510', '#000000'] : ['#FFF0F5', '#FFFFFF']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
            {/* PROGRESS BAR */}
            <View style={styles.progressContainer}>
                {SLIDES.map((_, idx) => (
                    <View 
                        key={idx} 
                        style={[
                            styles.progressBar, 
                            { 
                                backgroundColor: idx <= currentIndex ? currentSlide.color : (isDark ? '#333' : '#EEE'),
                                flex: idx === currentIndex ? 2 : 1 
                            }
                        ]} 
                    />
                ))}
            </View>

            {/* SLIDE CONTENT */}
            <Animated.View 
                key={currentIndex} 
                entering={FadeIn.springify()} 
                style={styles.slideWrapper}
            >
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }]}>
                    {currentSlide.icon}
                </View>
                
                <Text style={[styles.title, { color: isDark ? '#FFF' : '#333' }]}>
                    {currentSlide.title}
                </Text>
                
                <Text style={[styles.subtitle, { color: isDark ? '#CCC' : '#666' }]}>
                    {currentSlide.subtitle}
                </Text>

                {currentSlide.extraContent}
            </Animated.View>

            {/* BOTTOM BUTTON */}
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleNext}
                style={[styles.button, { backgroundColor: currentSlide.color }]}
            >
                <Text style={styles.buttonText}>
                    {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                </Text>
                {currentIndex === SLIDES.length - 1 ? (
                    <Check color="white" size={20} />
                ) : (
                    <ArrowRight color="white" size={20} />
                )}
            </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: width * 0.9,
    height: height * 0.7,
    justifyContent: 'space-between',
    padding: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  slideWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Quicksand',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '90%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  }
});
