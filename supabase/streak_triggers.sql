-- Function to handle streak updates when a Daily Dew is revealed
CREATE OR REPLACE FUNCTION handle_dew_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if transitioning from unrevealed to revealed
  IF OLD.is_revealed = false AND NEW.is_revealed = true THEN
    
    UPDATE bonds
    SET 
      streak_count = COALESCE(streak_count, 0) + 1,
      best_streak = GREATEST(COALESCE(best_streak, 0), COALESCE(streak_count, 0) + 1),
      last_activity = NOW() -- Track activity for resets
    WHERE id = NEW.bond_id;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to fire after update on daily_dews
DROP TRIGGER IF EXISTS on_dew_reveal ON daily_dews;
CREATE TRIGGER on_dew_reveal
  AFTER UPDATE OF is_revealed ON daily_dews
  FOR EACH ROW
  EXECUTE FUNCTION handle_dew_completion();
