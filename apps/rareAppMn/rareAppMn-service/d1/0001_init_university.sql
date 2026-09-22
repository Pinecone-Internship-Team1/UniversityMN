-- Cloudflare D1 (SQLite) mirror of the University table defined in
-- src/prisma/contract.prisma (the Postgres/Prisma migration is the source
-- of truth; this file is a hand-translated copy for the oyutan-mn-db D1
-- database, since Prisma 8's contract system does not target D1 directly).

CREATE TABLE IF NOT EXISTS university (
  id              TEXT PRIMARY KEY NOT NULL,
  name            TEXT NOT NULL,
  shortName       TEXT,
  logo            TEXT,
  description     TEXT,
  type            TEXT NOT NULL CHECK (type IN ('PUBLIC', 'PRIVATE')),
  location        TEXT,
  address         TEXT,
  website         TEXT,
  phone           TEXT,
  email           TEXT,
  establishedYear INTEGER,
  createdAt       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updatedAt       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
