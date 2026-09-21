-- Migration number: 0003 	 2026-09-21T04:30:10.731Z
--
-- Recreates every table so createdAt/updatedAt are INTEGER (unix seconds)
-- instead of TEXT. This matches drizzle-orm/sqlite-core's
-- `integer(col, { mode: 'timestamp' })`, which is required now that the
-- backend actually reads/writes this database (Postgres has been dropped;
-- D1 is the real database). All tables are still empty, so this is a clean
-- drop + recreate rather than a data migration.

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS "AdmissionRequirementSubject";
DROP TABLE IF EXISTS "AdmissionRequirement";
DROP TABLE IF EXISTS "Program";
DROP TABLE IF EXISTS "Faculty";
DROP TABLE IF EXISTS "University";
DROP TABLE IF EXISTS "Subject";
DROP TABLE IF EXISTS "User";

PRAGMA foreign_keys = ON;

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "firstName" TEXT,
  "lastName" TEXT,
  "imageUrl" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "createdAt" INTEGER NOT NULL DEFAULT (unixepoch()),
  "updatedAt" INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE "University" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "shortName" TEXT,
  "description" TEXT,
  "logo" TEXT,
  "website" TEXT,
  "type" TEXT,
  "location" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "foundedYear" INTEGER,
  "isActive" INTEGER NOT NULL DEFAULT 1,
  "createdAt" INTEGER NOT NULL DEFAULT (unixepoch()),
  "updatedAt" INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE "Faculty" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "universityId" TEXT NOT NULL REFERENCES "University"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" INTEGER NOT NULL DEFAULT (unixepoch()),
  "updatedAt" INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX "Faculty_universityId_idx" ON "Faculty"("universityId");

CREATE TABLE "Program" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "universityId" TEXT NOT NULL REFERENCES "University"("id") ON DELETE CASCADE,
  "facultyId" TEXT NOT NULL REFERENCES "Faculty"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "degree" TEXT NOT NULL,
  "duration" TEXT,
  "description" TEXT,
  "language" TEXT,
  "isActive" INTEGER NOT NULL DEFAULT 1,
  "createdAt" INTEGER NOT NULL DEFAULT (unixepoch()),
  "updatedAt" INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX "Program_universityId_idx" ON "Program"("universityId");
CREATE INDEX "Program_facultyId_idx" ON "Program"("facultyId");

CREATE TABLE "AdmissionRequirement" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "programId" TEXT NOT NULL REFERENCES "Program"("id") ON DELETE CASCADE,
  "academicYear" TEXT NOT NULL,
  "minimumScore" REAL,
  "description" TEXT,
  "createdAt" INTEGER NOT NULL DEFAULT (unixepoch()),
  "updatedAt" INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX "AdmissionRequirement_programId_idx" ON "AdmissionRequirement"("programId");

CREATE TABLE "Subject" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL UNIQUE,
  "createdAt" INTEGER NOT NULL DEFAULT (unixepoch()),
  "updatedAt" INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE "AdmissionRequirementSubject" (
  "admissionRequirementId" TEXT NOT NULL REFERENCES "AdmissionRequirement"("id") ON DELETE CASCADE,
  "subjectId" TEXT NOT NULL REFERENCES "Subject"("id") ON DELETE CASCADE,
  PRIMARY KEY ("admissionRequirementId", "subjectId")
);
CREATE INDEX "AdmissionRequirementSubject_subjectId_idx" ON "AdmissionRequirementSubject"("subjectId");
