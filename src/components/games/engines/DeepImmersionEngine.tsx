import { FlashCard } from '@/src/components/games/FlashCard';
import { TutorialOverlay } from '@/src/components/games/tutorials/TutorialOverlay';
import { getGameMeta } from '@/src/utils/gameImages';
import { Stars } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { GameEngineProps } from './types';

export const DeepImmersionEngine: React.FC<GameEngineProps> = ({
  prompts,
  currentIndex,
  onNext,
  onPrevious,
  hasSeenTutorial,
  markTutorialSeen,
  backgroundImage,
  session,
  gameTypeSlug,
}) => {
  const [showTutorial, setShowTutorial] = useState(!hasSeenTutorial);
  const currentPrompt = prompts[currentIndex];
  // prefer prop, fallback to nested if available (though type might not show it)
  const slug = gameTypeSlug || (session as any)?.game_types?.slug;
  const gameMeta = slug ? getGameMeta(slug) : null;

  useEffect(() => {
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial]);

  if (!currentPrompt) return <View />;

  const Content = (
    <View style={styles.container}>
      <FlashCard
        prompt={currentPrompt.prompt_text}
        cardNumber={currentIndex + 1}
        totalCards={prompts.length}
        gradientColors={gameMeta?.gradientColors ? [...gameMeta.gradientColors] : ['#7C4DFF', '#651FFF']}
        gameTitle={gameMeta?.title || 'Deep Night'}
        onNext={onNext}
        onPrevious={onPrevious}
        canGoBack={currentIndex > 0}
        // distinct card look:
        // If we want the card to look "like crush", we usually put the image ON the card.
        // But the user asked for "image of the game as background".
        // So we leave the card with gradient (default) or passing null/undefined for background.
      />

      {/* Tutorial */}
      {showTutorial && (
        <TutorialOverlay
          gameSlug="deep-immersion"
          onDismiss={() => {
            setShowTutorial(false);
            markTutorialSeen();
          }}
          content={{
            title: "Deep Night",
            description: "Take your time. Read slowly. Share deeply.",
            icon: <Stars color="white" size={40} />,
            gradientColors: ['#0F2027', '#2C5364']
          }}
        />
      )}
    </View>
  );

  if (backgroundImage) {
      return (
          <ImageBackground 
            source={backgroundImage} 
            style={styles.container} 
            resizeMode="cover"
            blurRadius={10} // Optional: blur the background slightly to make card pop
          >
              {Content}
          </ImageBackground>
      )
  }

  return (
    <View style={styles.container}>
      {Content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
