ALTER TABLE players
  ALTER COLUMN id DROP DEFAULT,
  ADD CONSTRAINT players_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "players_select_all" ON players
  FOR SELECT USING (true);

CREATE POLICY "players_insert_own" ON players
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "players_update_own" ON players
  FOR UPDATE USING (id = auth.uid());