-- Migration number: 0002 	 2026-09-21T04:19:04.427Z
--
-- SQLite/D1 translation of the User model added to
-- apps/rareAppMn/rareAppMn-service/prisma/schema.prisma. Mirrors Clerk users
-- (id is the Clerk user id, not a generated value). See 0001_init_schema.sql
-- for the dialect notes that apply here too (booleans as INTEGER, timestamps
-- as TEXT, no DB-side id generation).

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "firstName" TEXT,
  "lastName" TEXT,
  "imageUrl" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
