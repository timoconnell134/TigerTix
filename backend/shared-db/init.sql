PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT NOT NULL,
  date    TEXT NOT NULL,
  tickets INTEGER NOT NULL CHECK (tickets >= 0)
);