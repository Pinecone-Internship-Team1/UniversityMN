import { relations } from 'drizzle-orm';
import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Runtime schema for Cloudflare D1 (SQLite). Table/column names must match
// the migrations under apps/rareAppMn/rareAppMn-web/migrations exactly —
// those SQL files are the actual source of truth for the D1 database's
// structure; this file is the query layer on top of it.
//
// SQLite has no native boolean/timestamp/uuid types, so:
//   - booleans are `integer(..., { mode: 'boolean' })` (stored 0/1)
//   - timestamps are `integer(..., { mode: 'timestamp' })` (stored as unix
//     seconds; Drizzle supplies the value in JS via $defaultFn, not a
//     DB-side default)
//   - ids are plain `text` with a client-generated UUID, since D1 has no
//     gen_random_uuid()

function generatedId() {
  return text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
}

function timestamps() {
  return {
    createdAt: integer('createdAt', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  };
}

export const users = sqliteTable('User', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('firstName'),
  lastName: text('lastName'),
  imageUrl: text('imageUrl'),
  role: text('role').notNull().default('user'),
  ...timestamps(),
});

export const universities = sqliteTable('University', {
  id: generatedId(),
  name: text('name').notNull(),
  shortName: text('shortName'),
  description: text('description'),
  logo: text('logo'),
  website: text('website'),
  type: text('type'),
  location: text('location'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  foundedYear: integer('foundedYear'),
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
  ...timestamps(),
});

export const faculties = sqliteTable(
  'Faculty',
  {
    id: generatedId(),
    universityId: text('universityId')
      .notNull()
      .references(() => universities.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    ...timestamps(),
  },
  (table) => [index('Faculty_universityId_idx').on(table.universityId)],
);

export const programs = sqliteTable(
  'Program',
  {
    id: generatedId(),
    universityId: text('universityId')
      .notNull()
      .references(() => universities.id, { onDelete: 'cascade' }),
    facultyId: text('facultyId')
      .notNull()
      .references(() => faculties.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    degree: text('degree').notNull(),
    duration: text('duration'),
    description: text('description'),
    language: text('language'),
    isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    index('Program_universityId_idx').on(table.universityId),
    index('Program_facultyId_idx').on(table.facultyId),
  ],
);

export const admissionRequirements = sqliteTable(
  'AdmissionRequirement',
  {
    id: generatedId(),
    programId: text('programId')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),
    academicYear: text('academicYear').notNull(),
    minimumScore: real('minimumScore'),
    description: text('description'),
    ...timestamps(),
  },
  (table) => [index('AdmissionRequirement_programId_idx').on(table.programId)],
);

export const subjects = sqliteTable('Subject', {
  id: generatedId(),
  name: text('name').notNull().unique(),
  ...timestamps(),
});

export const admissionRequirementSubjects = sqliteTable(
  'AdmissionRequirementSubject',
  {
    admissionRequirementId: text('admissionRequirementId')
      .notNull()
      .references(() => admissionRequirements.id, { onDelete: 'cascade' }),
    subjectId: text('subjectId')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.admissionRequirementId, table.subjectId] }),
    index('AdmissionRequirementSubject_subjectId_idx').on(table.subjectId),
  ],
);

export const universitiesRelations = relations(universities, ({ many }) => ({
  faculties: many(faculties),
  programs: many(programs),
}));

export const facultiesRelations = relations(faculties, ({ one, many }) => ({
  university: one(universities, {
    fields: [faculties.universityId],
    references: [universities.id],
  }),
  programs: many(programs),
}));

export const programsRelations = relations(programs, ({ one, many }) => ({
  university: one(universities, {
    fields: [programs.universityId],
    references: [universities.id],
  }),
  faculty: one(faculties, {
    fields: [programs.facultyId],
    references: [faculties.id],
  }),
  admissionRequirements: many(admissionRequirements),
}));

export const admissionRequirementsRelations = relations(admissionRequirements, ({ one, many }) => ({
  program: one(programs, {
    fields: [admissionRequirements.programId],
    references: [programs.id],
  }),
  subjectLinks: many(admissionRequirementSubjects),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  requirementLinks: many(admissionRequirementSubjects),
}));

export const admissionRequirementSubjectsRelations = relations(
  admissionRequirementSubjects,
  ({ one }) => ({
    admissionRequirement: one(admissionRequirements, {
      fields: [admissionRequirementSubjects.admissionRequirementId],
      references: [admissionRequirements.id],
    }),
    subject: one(subjects, {
      fields: [admissionRequirementSubjects.subjectId],
      references: [subjects.id],
    }),
  }),
);
