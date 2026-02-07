import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Infinity, Moon, Sparkles, Zap } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface Props {
    title?: string;
    subtitle?: string;
    colors?: [string, string];
    gameSlug?: string;
}

const TIPS = [
    "Take a deep breath and connect.",
    "Honesty makes the bond stronger.",
    "Listen to understand, not to reply.",
    "Eye contact speaks louder than words.",
    "Be vulnerable. It's safe here.",
    "Have fun with it!",
    "Open your heart to new possibilities.",
    "Romance is in the details."
];

const ICONS: Record<string, any> = {
    'crush': Heart,
    'deep-night': Moon,
    'intimacy': Zap,
    'connected': Infinity,
    'default': Sparkles
};

export const GameLoadingScreen = ({ 
    title = "Loading...", 
    subtitle = "Preparing your experience", 
    colors = ['#FF6B94', '#FF8E53'],
    gameSlug = 'default'
}: Props) => {
    
    // Animation Values
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.5);
    const rotate = useSharedValue(0);

    useEffect(() => {
        // Pulse Effect
        scale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Glow opacity
        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500 }),
                withTiming(0.5, { duration: 1500 })
            ),
            -1,
            true
        );

        // Gentle rotation
        rotate.value = withRepeat(
            withTiming(360, { duration: 20000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const animatedGlowStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value * 1.5 }]
    }));
    
    const animatedBgStyle = useAnimatedStyle(() => ({
          transform: [{ rotate: `${rotate.value}deg` }]
    }));

    // Select Icon
    const IconComponent = ICONS[gameSlug] || ICONS['default'] || Sparkles;
    
    // Random Tip
    const [tip, setTip] = React.useState(TIPS[0]);
    useEffect(() => {
        setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
        const interval = setInterval(() => {
             setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
             {/* Background Gradient */}
            <LinearGradient
                colors={['#1a0510', '#230b14', '#0f0508']}
                style={StyleSheet.absoluteFillObject}
            />
            
            {/* Ambient Background Glow */}
            <Animated.View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }, animatedBgStyle]}>
                 <LinearGradient
                    colors={[colors[0], 'transparent']}
                    style={{ width: width * 1.5, height: width * 1.5, borderRadius: width, opacity: 0.1 }}
                 />
            </Animated.View>

            <BlurView intensity={20} style={StyleSheet.absoluteFillObject} tint="dark" />

            {/* Center Content */}
            <View style={styles.centerContent}>
                <View style={styles.iconContainer}>
                     <Animated.View style={[styles.glowRing, { borderColor: colors[0] }, animatedGlowStyle]} />
                     <Animated.View style={animatedIconStyle}>
                        <IconComponent color={colors[0]} size={64} fill={colors[0]} fillOpacity={0.2} />
                     </Animated.View>
                </View>

                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            {/* Footer Tip */}
            <View style={styles.footer}>
                <Text style={styles.tipLabel}>TIP</Text>
                <Animated.Text entering={Animated.FadeIn} key={tip} style={styles.tipText}>
                    "{tip}"
                </Animated.Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    iconContainer: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    glowRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        opacity: 0.5,
    },
    title: {
        fontFamily: 'Outfit',
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Quicksand',
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        left: 40,
        right: 40,
        alignItems: 'center',
    },
    tipLabel: {
        fontFamily: 'Outfit',
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.3)',
        marginBottom: 8,
        letterSpacing: 2,
    },
    tipText: {
        fontFamily: 'Quicksand',
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 22,
        fontStyle: 'italic',
    },
});
