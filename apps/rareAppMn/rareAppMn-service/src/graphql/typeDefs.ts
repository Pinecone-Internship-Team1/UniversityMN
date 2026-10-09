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
    "How to apply for the university's dorms; null when not known."
    dormGuide: DormGuide
    "The university's schools (faculties), each holding its majors."
    faculties: [Faculty!]!
    majors: [Major!]!
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
    search: String
    location: String
    dormAvailable: Boolean
    scholarshipAvailable: Boolean
    maxTuitionFee: Float
    limit: Int
    offset: Int
  }

  input MajorFilterInput {
    schoolId: ID
    category: String
    degreeType: String
    search: String
    minCutOffScore: Float
    maxCutOffScore: Float
    limit: Int
    offset: Int
  }

  type Query {
    me: UserProfile
    userByClerkId(clerkUserId: String!): UserProfile
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
