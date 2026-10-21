export const typeDefs = /* GraphQL */ `
  scalar JSON

  enum UserRole {
    STUDENT
    ADMIN
  }

  enum CompareType {
    SCHOOL
    MAJOR
  }

  "CHECK_WITH_SCHOOL: the scores can't decide it, e.g. the дагалдах exam is the school's own skill test."
  enum ScoreMatchVerdict {
    ELIGIBLE
    BELOW_CUT_OFF
    MISSING_SCORES
    CHECK_WITH_SCHOOL
  }

  enum Region {
    ULAANBAATAR
    OUTSIDE_ULAANBAATAR
  }

  type UserProfile {
    id: ID!
    clerkUserId: String!
    email: String!
    name: String
    avatarUrl: String
    role: UserRole!
    scores: JSON
    preferences: JSON
    savedSchools: [School!]!
    savedMajors: [Major!]!
    createdAt: String!
    updatedAt: String!
  }

  type School {
    id: ID!
    name: String!
    logoUrl: String
    coverUrl: String
    location: String
    tuitionFee: Float
    "Shown instead of the formatted tuitionFee when set, e.g. a range."
    tuitionText: String
    "Null when unknown."
    dormAvailable: Boolean
    "Null when unknown."
    scholarshipAvailable: Boolean
    overview: String
    website: String
    "Contact phone numbers, in display order; empty when none are known."
    phones: [String!]!
    email: String
    "Other names search finds it by: short names, slugs, English names (e.g. МУИС, muis, NUM)."
    aliases: [String!]!
    "How to apply for the university's dorms; null when not known."
    dormGuide: DormGuide
    "The university's schools (faculties), each holding its majors. search keeps the names that match it, like Query.majors."
    faculties(search: String): [Faculty!]!
    "search keeps the majors that match it, as Query.majors does, best match first."
    majors(search: String): [Major!]!
    scholarships: [Scholarship!]!
    dormitories: [Dormitory!]!
    admissionSchedules: [AdmissionSchedule!]!
    isSaved: Boolean!
    createdAt: String!
  }

  "A school within a university, e.g. Хууль зүйн сургууль."
  type Faculty {
    id: ID!
    schoolId: ID!
    name: String!
    "Set only when it differs from the university's, e.g. a branch school in another aimag."
    location: String
    createdAt: String!
  }

  type Major {
    id: ID!
    schoolId: ID!
    school: School!
    facultyId: ID
    "The school (faculty) that teaches it; null when none is set."
    faculty: Faculty
    name: String!
    category: String
    requiredSubjects: JSON
    "Суурь (70%) exam options; the student takes one of them."
    primarySubjects: [String!]
    "Дагалдах (30%) exam options; the student takes one, different from the суурь exam."
    secondarySubjects: [String!]
    "Shown with the exam subjects, e.g. when the суурь/дагалдах split is unknown. Never scored."
    examNote: String
    cutOffScore: Float
    "The дагалдах exam's own minimum; when set, cutOffScore is the суурь exam's minimum and both must be met."
    secondaryCutOffScore: Float
    "Weight of the суурь exam in the admission score; null means 0.7 (АШУҮИС adds the exams: 1)."
    primaryWeight: Float
    "Weight of the дагалдах exam; null means 0.3."
    secondaryWeight: Float
    "list: ranked by score among up to 8 choices; direct: anyone meeting the minimums can enrol. Null when unknown."
    selectionType: String
    degreeType: String
    tuitionFee: Float
    "True when tuitionFee is an estimated upper bound, not an official yearly fee."
    tuitionIsEstimate: Boolean!
    isSaved: Boolean!
  }

  type Scholarship {
    id: ID!
    schoolId: ID!
    school: School!
    name: String!
    coverage: String
    requirements: String
    deadline: String
  }

  type Dormitory {
    id: ID!
    schoolId: ID!
    school: School!
    "e.g. I байр"
    name: String
    capacity: Int
    feePerMonth: Float
    feePerYear: Float
    "ISO currency of the fees; null means MNT."
    currency: String
    facilities: JSON
  }

  type DormGuideStep {
    title: String!
    text: String!
  }

  type DormGuideLink {
    title: String!
    url: String!
  }

  type DormGuide {
    "Caveat shown with the dorm list, e.g. that prices come from an undated page."
    note: String
    steps: [DormGuideStep!]!
    priorityOrder: [String!]!
    specialRooms: String
    documents: [String!]!
    rules: [String!]!
    links: [DormGuideLink!]!
  }

  type AdmissionSchedule {
    id: ID!
    schoolId: ID!
    school: School!
    eventName: String!
    startDate: String
    endDate: String
  }

  type ScoreMatchResult {
    school: School!
    major: Major!
    matchScore: Float!
    eligible: Boolean!
    verdict: ScoreMatchVerdict!
    reason: String!
  }

  type PageInfo {
    totalCount: Int!
    limit: Int!
    offset: Int!
    hasNextPage: Boolean!
  }

  type SchoolPage {
    items: [School!]!
    pageInfo: PageInfo!
  }

  type MajorPage {
    items: [Major!]!
    pageInfo: PageInfo!
  }

  type UserPage {
    items: [UserProfile!]!
    pageInfo: PageInfo!
  }

  type DailyVisits {
    "Ulaanbaatar date, YYYY-MM-DD."
    day: String!
    views: Int!
    visitors: Int!
  }

  type PageVisits {
    path: String!
    views: Int!
  }

  "Page-view stats for a range of Ulaanbaatar days ending today."
  type SiteStats {
    from: String!
    to: String!
    views: Int!
    "Distinct anonymous browsers."
    visitors: Int!
    "Views by signed-in users."
    signedInViews: Int!
    todayViews: Int!
    todayVisitors: Int!
    "Every day in the range, oldest first; days without visits included."
    daily: [DailyVisits!]!
    "The 10 most viewed paths."
    topPages: [PageVisits!]!
  }

  union CompareItem = School | Major

  input UserProfileInput {
    name: String
    avatarUrl: String
    scores: JSON
    preferences: JSON
  }

  input SchoolInput {
    name: String!
    logoUrl: String
    coverUrl: String
    location: String
    tuitionFee: Float
    tuitionText: String
    "Null or omitted means unknown."
    dormAvailable: Boolean
    "Null or omitted means unknown."
    scholarshipAvailable: Boolean
    overview: String
    website: String
    phones: [String!]
    email: String
    "Omitted keeps the current aliases; null or [] clears them."
    aliases: [String!]
  }

  input FacultyInput {
    schoolId: ID!
    name: String!
    location: String
  }

  "A major's university is always its faculty's university."
  input MajorInput {
    facultyId: ID!
    name: String!
    category: String
    requiredSubjects: JSON
    primarySubjects: [String!]
    secondarySubjects: [String!]
    examNote: String
    cutOffScore: Float
    secondaryCutOffScore: Float
    primaryWeight: Float
    secondaryWeight: Float
    "list or direct"
    selectionType: String
    degreeType: String
    tuitionFee: Float
    tuitionIsEstimate: Boolean
  }

  input ScholarshipInput {
    schoolId: ID!
    name: String!
    coverage: String
    requirements: String
    deadline: String
  }

  input SchoolFilterInput {
    "Name, short name or alias, in Cyrillic or Latin letters (muis, МУИС, NUM, mongol ulsiin ih surguuli)."
    search: String
    location: String
    dormAvailable: Boolean
    scholarshipAvailable: Boolean
    maxTuitionFee: Float
    limit: Int
    offset: Int
  }

  input UserFilterInput {
    "Matches the name, email or Clerk user id."
    search: String
    role: UserRole
    limit: Int
    offset: Int
  }

  input MajorFilterInput {
    schoolId: ID
    category: String
    degreeType: String
    "Major name and/or the university's short name, in Cyrillic or Latin letters (programm hangamj, muis huuli)."
    search: String
    minCutOffScore: Float
    maxCutOffScore: Float
    limit: Int
    offset: Int
  }

  type Query {
    me: UserProfile
    userByClerkId(clerkUserId: String!): UserProfile
    "Admin only: every user, newest first."
    users(filter: UserFilterInput): UserPage!
    "Admin only: visit stats for the last N days (default 30, max 365)."
    siteStats(days: Int): SiteStats!
    school(id: ID!): School
    schools(filter: SchoolFilterInput): SchoolPage!
    major(id: ID!): Major
    majors(filter: MajorFilterInput): MajorPage!
    "Pass a region to rank Ulaanbaatar and branch schools separately; their cut-offs differ (e.g. 490 vs 430)."
    personalizedRecommendations(limit: Int, region: Region): [ScoreMatchResult!]!
    analyzeScoreMatch(majorId: ID!, scores: JSON!): ScoreMatchResult!
    compareItems(ids: [ID!]!, type: CompareType!): [CompareItem!]!
  }

  type Mutation {
    "Records one page view (anonymous; sent by the web on each navigation)."
    trackPageView(path: String!, visitorId: String!): Boolean!
    syncClerkUser(clerkUserId: String!, email: String!, name: String, avatarUrl: String): UserProfile!
    updateUserProfile(input: UserProfileInput!): UserProfile!
    toggleSaveSchool(schoolId: ID!): Boolean!
    toggleSaveMajor(majorId: ID!): Boolean!
    createSchool(input: SchoolInput!): School!
    updateSchool(id: ID!, input: SchoolInput!): School!
    deleteSchool(id: ID!): Boolean!
    createFaculty(input: FacultyInput!): Faculty!
    updateFaculty(id: ID!, input: FacultyInput!): Faculty!
    deleteFaculty(id: ID!): Boolean!
    createMajor(input: MajorInput!): Major!
    updateMajor(id: ID!, input: MajorInput!): Major!
    deleteMajor(id: ID!): Boolean!
  }
`;
