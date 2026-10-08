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
    dormAvailable: Boolean!
    scholarshipAvailable: Boolean!
    overview: String
    website: String
    "Contact phone numbers, in display order; empty when none are known."
    phones: [String!]!
    email: String
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
    cutOffScore: Float
    degreeType: String
    tuitionFee: Float
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
    capacity: Int
    feePerMonth: Float
    facilities: JSON
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
    dormAvailable: Boolean
    scholarshipAvailable: Boolean
    overview: String
    website: String
    phones: [String!]
    email: String
  }

  input FacultyInput {
    schoolId: ID!
    name: String!
  }

  "A major's university is always its faculty's university."
  input MajorInput {
    facultyId: ID!
    name: String!
    category: String
    requiredSubjects: JSON
    cutOffScore: Float
    degreeType: String
    tuitionFee: Float
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
    personalizedRecommendations(limit: Int): [ScoreMatchResult!]!
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
