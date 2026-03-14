CREATE OR REPLACE FUNCTION update_player_stats(
  p_player_id uuid,
  p_new_wpm integer,
  p_new_accuracy float
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE players
  SET
    total_races  = total_races + 1,
    best_wpm     = GREATEST(best_wpm, p_new_wpm),
    avg_accuracy = (avg_accuracy * total_races + p_new_accuracy) / (total_races + 1),
    updated_at   = NOW()
  WHERE id = p_player_id;
END;
$$;
