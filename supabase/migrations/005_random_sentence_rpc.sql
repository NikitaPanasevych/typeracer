CREATE OR REPLACE FUNCTION get_random_sentence_id()
RETURNS uuid
LANGUAGE sql
AS $$
  SELECT id FROM sentences ORDER BY RANDOM() LIMIT 1;
$$;
