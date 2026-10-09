/**
 * TypeScript mirrors of the GraphQL types exposed by
 * apps/rareAppMn/rareAppMn-service's `src/graphql/typeDefs.ts`. Kept
 * hand-written (no codegen step in this project) so they must be updated
 * alongside the backend schema.
 */

export type UserRole = "STUDENT" | "ADMIN";
export type CompareType = "SCHOOL" | "MAJOR";

export interface AdmissionSchedule {
  id: string;
  schoolId: string;
  eventName: string;
  startDate: string | null;
  endDate: string | null;
}

export interface Dormitory {
  id: string;
  schoolId: string;
  capacity: number | null;
  feePerMonth: number | null;
  facilities: string[] | null;
}

export interface Scholarship {
  id: string;
  schoolId: string;
  name: string;
  coverage: string | null;
  requirements: string | null;
  deadline: string | null;
}

/** A school within a university (e.g. "Хууль зүйн сургууль"); `School` is the university. */
export interface Faculty {
  id: string;
  schoolId: string;
  name: string;
  /** Set only when it differs from the university's, e.g. a branch school in another aimag. */
  location: string | null;
  createdAt: string;
}

export interface Major {
  id: string;
  schoolId: string;
  facultyId: string | null;
  name: string;
  category: string | null;
  requiredSubjects: string[] | null;
  /** Суурь (70%) exam options; the student takes one of them. */
  primarySubjects: string[] | null;
  /** Дагалдах (30%) exam options; one, different from the суурь exam. */
  secondarySubjects: string[] | null;
  /** Shown with the exam subjects, e.g. when the суурь/дагалдах split is unknown. Never scored. */
  examNote: string | null;
  cutOffScore: number | null;
  degreeType: string | null;
  tuitionFee: number | null;
  /** `tuitionFee` is an estimated upper bound, not an official yearly fee. */
  tuitionIsEstimate: boolean;
  isSaved: boolean;
  school?: School;
}

export interface School {
  id: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  location: string | null;
  tuitionFee: number | null;
  dormAvailable: boolean;
  scholarshipAvailable: boolean;
  overview: string | null;
  website: string | null;
  phones: string[];
  email: string | null;
  isSaved: boolean;
  createdAt: string;
  faculties?: Faculty[];
  majors?: Major[];
  scholarships?: Scholarship[];
  dormitories?: Dormitory[];
  admissionSchedules?: AdmissionSchedule[];
}

export interface PageInfo {
  totalCount: number;
  limit: number;
  offset: number;
  hasNextPage: boolean;
}

export interface SchoolPage {
  items: School[];
  pageInfo: PageInfo;
}

export interface MajorPage {
  items: Major[];
  pageInfo: PageInfo;
}

export interface UserProfile {
  id: string;
  clerkUserId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  scores: Record<string, number> | null;
  preferences: Record<string, unknown> | null;
  savedSchools: School[];
  savedMajors: Major[];
  createdAt: string;
  updatedAt: string;
}

export interface SchoolFilterInput {
  search?: string;
  location?: string;
  dormAvailable?: boolean;
  scholarshipAvailable?: boolean;
  maxTuitionFee?: number;
  limit?: number;
  offset?: number;
}

export interface MajorFilterInput {
  schoolId?: string;
  category?: string;
  degreeType?: string;
  search?: string;
  minCutOffScore?: number;
  maxCutOffScore?: number;
  limit?: number;
  offset?: number;
}

export interface UserProfileInput {
  name?: string | null;
  avatarUrl?: string | null;
  scores?: Record<string, number> | null;
  preferences?: Record<string, unknown> | null;
}

export interface SchoolInput {
  name: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  location?: string | null;
  tuitionFee?: number | null;
  dormAvailable?: boolean | null;
  scholarshipAvailable?: boolean | null;
  overview?: string | null;
  website?: string | null;
  phones?: string[] | null;
  email?: string | null;
}

export interface FacultyInput {
  schoolId: string;
  name: string;
  location?: string | null;
}

export interface MajorInput {
  facultyId: string;
  name: string;
  category?: string | null;
  requiredSubjects?: string[] | null;
  primarySubjects?: string[] | null;
  secondarySubjects?: string[] | null;
  examNote?: string | null;
  cutOffScore?: number | null;
  degreeType?: string | null;
  tuitionFee?: number | null;
  tuitionIsEstimate?: boolean | null;
}

export type CompareItem =
  | (School & { __typename: "School" })
  | (Major & { __typename: "Major" });

/** `CHECK_WITH_SCHOOL`: the scores can't decide it, e.g. the дагалдах exam is the school's own skill test. */
export type ScoreMatchVerdict = "ELIGIBLE" | "BELOW_CUT_OFF" | "MISSING_SCORES" | "CHECK_WITH_SCHOOL";

export type Region = "ULAANBAATAR" | "OUTSIDE_ULAANBAATAR";

export interface ScoreMatchResult {
  school: School;
  major: Major;
  matchScore: number;
  eligible: boolean;
  verdict: ScoreMatchVerdict;
  reason: string;
}
