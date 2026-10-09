import { relations, sql } from 'drizzle-orm';
import { blob, index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const isoNow = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

function uuid(columnName: string) {
  return text(columnName)
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
}

export const users = sqliteTable(
  'users',
  {
    id: uuid('id'),
    clerkUserId: text('clerk_user_id').notNull(),
    email: text('email').notNull(),
    name: text('name'),
    avatarUrl: text('avatar_url'),
    role: text('role', { enum: ['student', 'admin'] })
      .notNull()
      .default('student'),
    /** Map of subject/subcategory -> raw exam score, e.g. `{ "math": 92 }`. */
    scores: text('scores', { mode: 'json' }).$type<Record<string, number>>(),
    preferences: text('preferences', { mode: 'json' }).$type<Record<string, unknown>>(),
    createdAt: text('created_at').notNull().default(isoNow),
    updatedAt: text('updated_at').notNull().default(isoNow),
  },
  (table) => [
    uniqueIndex('users_clerk_user_id_idx').on(table.clerkUserId),
    uniqueIndex('users_email_idx').on(table.email),
  ]
);

/** Step-by-step dorm application guide shown on a university's dorm section. */
export interface DormGuide {
  /** Caveat shown with the dorm list, e.g. that prices come from an undated page. */
  note?: string | null;
  steps?: { title: string; text: string }[];
  priorityOrder?: string[];
  specialRooms?: string | null;
  documents?: string[];
  rules?: string[];
  links?: { title: string; url: string }[];
}

/** A university. (Called "school" throughout the API; its own schools are `faculties`.) */
export const schools = sqliteTable('schools', {
  id: uuid('id'),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  coverUrl: text('cover_url'),
  location: text('location'),
  tuitionFee: real('tuition_fee'),
  /** Shown instead of the formatted `tuitionFee` when set, e.g. a range; `tuitionFee` still sorts and filters. */
  tuitionText: text('tuition_text'),
  /** Null when unknown, so the site can say "Мэдээлэл удахгүй нэмэгдэнэ" instead of guessing. */
  dormAvailable: integer('has_dormitory', { mode: 'boolean' }),
  scholarshipAvailable: integer('has_scholarships', { mode: 'boolean' }),
  /**
   * @deprecated Replaced by `has_dormitory` / `has_scholarships`, which can be null.
   * Kept because SQLite can only drop NOT NULL by rebuilding the table, and
   * rebuilding `schools` would cascade-delete everything that references it.
   */
  legacyDormAvailable: integer('dorm_available', { mode: 'boolean' }).notNull().default(false),
  /** @deprecated See `legacyDormAvailable`. */
  legacyScholarshipAvailable: integer('scholarship_available', { mode: 'boolean' })
    .notNull()
    .default(false),
  overview: text('overview'),
  dormGuide: text('dorm_guide', { mode: 'json' }).$type<DormGuide>(),
  website: text('website'),
  /** Contact phone numbers as written, e.g. `["+976 7730-7730", "11-320159"]`. */
  phones: text('phones', { mode: 'json' }).$type<string[]>(),
  email: text('email'),
  createdAt: text('created_at').notNull().default(isoNow),
});

/** A school within a university (e.g. "Хууль зүйн сургууль"); every major belongs to one. */
export const faculties = sqliteTable(
  'faculties',
  {
    id: uuid('id'),
    schoolId: text('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** Set only when it differs from the university's, e.g. a branch school in another aimag. */
    location: text('location'),
    createdAt: text('created_at').notNull().default(isoNow),
  },
  (table) => [uniqueIndex('faculties_school_name_idx').on(table.schoolId, table.name)]
);

export const majors = sqliteTable(
  'majors',
  {
    id: uuid('id'),
    /** Always the faculty's university; kept on the major so catalog queries need no join. */
    schoolId: text('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    /**
     * Required by the API. Nullable in SQL only because SQLite can't add a
     * NOT NULL foreign key column to an existing table without rebuilding it.
     * Deleting a faculty that still has majors fails (no `onDelete` action).
     */
    facultyId: text('faculty_id').references(() => faculties.id),
    name: text('name').notNull(),
    category: text('category'),
    /** List of subject names required for admission, e.g. `["math", "physics"]`. */
    requiredSubjects: text('required_subjects', { mode: 'json' }).$type<string[]>(),
    /**
     * For admissions scored as 0.7 × суурь + 0.3 × дагалдах: the student takes
     * ONE exam from `primarySubjects` (суурь, 70%) and ONE different exam from
     * `secondarySubjects` (дагалдах, 30%), not every listed subject.
     */
    primarySubjects: text('primary_subjects', { mode: 'json' }).$type<string[]>(),
    secondarySubjects: text('secondary_subjects', { mode: 'json' }).$type<string[]>(),
    /**
     * Shown with the exam subjects, e.g. when the суурь/дагалдах split is
     * unknown. Never used for scoring.
     */
    examNote: text('exam_note'),
    cutOffScore: real('cut_off_score'),
    degreeType: text('degree_type'),
    tuitionFee: real('tuition_fee'),
    /** True when `tuitionFee` is an estimated upper bound rather than an official yearly fee. */
    tuitionIsEstimate: integer('tuition_is_estimate', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => [
    index('majors_school_id_idx').on(table.schoolId),
    index('majors_faculty_id_idx').on(table.facultyId),
  ]
);

export const scholarships = sqliteTable(
  'scholarships',
  {
    id: uuid('id'),
    schoolId: text('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    coverage: text('coverage'),
    requirements: text('requirements'),
    deadline: text('deadline'),
  },
  (table) => [index('scholarships_school_id_idx').on(table.schoolId)]
);

export const dormitories = sqliteTable(
  'dormitories',
  {
    id: uuid('id'),
    schoolId: text('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    /** e.g. "I байр"; null for a university that lists dorms without names. */
    name: text('name'),
    capacity: integer('capacity'),
    feePerMonth: real('fee_per_month'),
    feePerYear: real('fee_per_year'),
    /** ISO currency of the fees; null means MNT. */
    currency: text('currency'),
    facilities: text('facilities', { mode: 'json' }).$type<string[]>(),
  },
  (table) => [index('dormitories_school_id_idx').on(table.schoolId)]
);

export const admissionSchedules = sqliteTable(
  'admission_schedules',
  {
    id: uuid('id'),
    schoolId: text('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    eventName: text('event_name').notNull(),
    startDate: text('start_date'),
    endDate: text('end_date'),
  },
  (table) => [index('admission_schedules_school_id_idx').on(table.schoolId)]
);

/** Images uploaded from the admin dashboard, served by `GET /images/:id`. */
export const images = sqliteTable('images', {
  id: uuid('id'),
  contentType: text('content_type').notNull(),
  data: blob('data', { mode: 'buffer' }).notNull(),
  createdAt: text('created_at').notNull().default(isoNow),
});

export const savedSchools = sqliteTable(
  'saved_schools',
  {
    id: uuid('id'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    schoolId: text('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').notNull().default(isoNow),
  },
  (table) => [
    uniqueIndex('saved_schools_user_school_idx').on(table.userId, table.schoolId),
    index('saved_schools_school_id_idx').on(table.schoolId),
  ]
);

export const savedMajors = sqliteTable(
  'saved_majors',
  {
    id: uuid('id'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    majorId: text('major_id')
      .notNull()
      .references(() => majors.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').notNull().default(isoNow),
  },
  (table) => [
    uniqueIndex('saved_majors_user_major_idx').on(table.userId, table.majorId),
    index('saved_majors_major_id_idx').on(table.majorId),
  ]
);

export const usersRelations = relations(users, ({ many }) => ({
  savedSchools: many(savedSchools),
  savedMajors: many(savedMajors),
}));

export const schoolsRelations = relations(schools, ({ many }) => ({
  faculties: many(faculties),
  majors: many(majors),
  scholarships: many(scholarships),
  dormitories: many(dormitories),
  admissionSchedules: many(admissionSchedules),
  savedByUsers: many(savedSchools),
}));

export const facultiesRelations = relations(faculties, ({ one, many }) => ({
  school: one(schools, { fields: [faculties.schoolId], references: [schools.id] }),
  majors: many(majors),
}));

export const majorsRelations = relations(majors, ({ one, many }) => ({
  school: one(schools, { fields: [majors.schoolId], references: [schools.id] }),
  faculty: one(faculties, { fields: [majors.facultyId], references: [faculties.id] }),
  savedByUsers: many(savedMajors),
}));

export const scholarshipsRelations = relations(scholarships, ({ one }) => ({
  school: one(schools, { fields: [scholarships.schoolId], references: [schools.id] }),
}));

export const dormitoriesRelations = relations(dormitories, ({ one }) => ({
  school: one(schools, { fields: [dormitories.schoolId], references: [schools.id] }),
}));

export const admissionSchedulesRelations = relations(admissionSchedules, ({ one }) => ({
  school: one(schools, { fields: [admissionSchedules.schoolId], references: [schools.id] }),
}));

export const savedSchoolsRelations = relations(savedSchools, ({ one }) => ({
  user: one(users, { fields: [savedSchools.userId], references: [users.id] }),
  school: one(schools, { fields: [savedSchools.schoolId], references: [schools.id] }),
}));

export const savedMajorsRelations = relations(savedMajors, ({ one }) => ({
  user: one(users, { fields: [savedMajors.userId], references: [users.id] }),
  major: one(majors, { fields: [savedMajors.majorId], references: [majors.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
export type Faculty = typeof faculties.$inferSelect;
export type NewFaculty = typeof faculties.$inferInsert;
export type Major = typeof majors.$inferSelect;
export type NewMajor = typeof majors.$inferInsert;
export type Scholarship = typeof scholarships.$inferSelect;
export type NewScholarship = typeof scholarships.$inferInsert;
export type Dormitory = typeof dormitories.$inferSelect;
export type NewDormitory = typeof dormitories.$inferInsert;
export type AdmissionSchedule = typeof admissionSchedules.$inferSelect;
export type NewAdmissionSchedule = typeof admissionSchedules.$inferInsert;
export type SavedSchool = typeof savedSchools.$inferSelect;
export type SavedMajor = typeof savedMajors.$inferSelect;
