import type {
  AdmissionSchedule,
  Dormitory,
  MajorFilterInput,
  MajorPage,
  Major,
  Scholarship,
  ScoreMatchResult,
  SchoolFilterInput,
  School,
  SchoolPage,
  UserProfile,
  UserProfileInput,
} from "./types";

/**
 * GraphQL operations against apps/rareAppMn/rareAppMn-service. Plain
 * template strings (no codegen in this project) -- `urql` accepts these
 * directly. Each document is paired with its variables/result TS types so
 * call sites stay fully typed.
 */

const SCHOOL_CARD_FIELDS = /* GraphQL */ `
  id
  name
  logoUrl
  coverUrl
  location
  tuitionFee
  dormAvailable
  scholarshipAvailable
  overview
  website
  isSaved
  createdAt
`;

const MAJOR_FIELDS = /* GraphQL */ `
  id
  schoolId
  name
  category
  requiredSubjects
  cutOffScore
  degreeType
  tuitionFee
  isSaved
`;

export const SCHOOLS_QUERY = /* GraphQL */ `
  query Schools($filter: SchoolFilterInput) {
    schools(filter: $filter) {
      items {
        ${SCHOOL_CARD_FIELDS}
      }
      pageInfo {
        totalCount
        limit
        offset
        hasNextPage
      }
    }
  }
`;

export interface SchoolsQueryVariables {
  filter?: SchoolFilterInput;
}

export interface SchoolsQueryResult {
  schools: SchoolPage;
}

export const SCHOOL_QUERY = /* GraphQL */ `
  query School($id: ID!) {
    school(id: $id) {
      ${SCHOOL_CARD_FIELDS}
      majors {
        ${MAJOR_FIELDS}
      }
      scholarships {
        id
        schoolId
        name
        coverage
        requirements
        deadline
      }
      dormitories {
        id
        schoolId
        capacity
        feePerMonth
        facilities
      }
      admissionSchedules {
        id
        schoolId
        eventName
        startDate
        endDate
      }
    }
  }
`;

export interface SchoolQueryVariables {
  id: string;
}

export interface SchoolDetail extends School {
  majors: Major[];
  scholarships: Scholarship[];
  dormitories: Dormitory[];
  admissionSchedules: AdmissionSchedule[];
}

export interface SchoolQueryResult {
  school: SchoolDetail | null;
}

export const ME_QUERY = /* GraphQL */ `
  query Me {
    me {
      id
      clerkUserId
      email
      name
      avatarUrl
      role
      scores
      preferences
      createdAt
      updatedAt
      savedSchools {
        ${SCHOOL_CARD_FIELDS}
      }
      savedMajors {
        ${MAJOR_FIELDS}
      }
    }
  }
`;

export interface MeQueryResult {
  me: UserProfile | null;
}

export const TOGGLE_SAVE_SCHOOL_MUTATION = /* GraphQL */ `
  mutation ToggleSaveSchool($schoolId: ID!) {
    toggleSaveSchool(schoolId: $schoolId)
  }
`;

export interface ToggleSaveSchoolVariables {
  schoolId: string;
}

export interface ToggleSaveSchoolResult {
  toggleSaveSchool: boolean;
}

export const TOGGLE_SAVE_MAJOR_MUTATION = /* GraphQL */ `
  mutation ToggleSaveMajor($majorId: ID!) {
    toggleSaveMajor(majorId: $majorId)
  }
`;

export interface ToggleSaveMajorVariables {
  majorId: string;
}

export interface ToggleSaveMajorResult {
  toggleSaveMajor: boolean;
}

export const UPDATE_USER_PROFILE_MUTATION = /* GraphQL */ `
  mutation UpdateUserProfile($input: UserProfileInput!) {
    updateUserProfile(input: $input) {
      id
      clerkUserId
      email
      name
      avatarUrl
      role
      scores
      preferences
      createdAt
      updatedAt
    }
  }
`;

export interface UpdateUserProfileVariables {
  input: UserProfileInput;
}

export interface UpdateUserProfileResult {
  updateUserProfile: UserProfile;
}

export const SYNC_CLERK_USER_MUTATION = /* GraphQL */ `
  mutation SyncClerkUser(
    $clerkUserId: String!
    $email: String!
    $name: String
    $avatarUrl: String
  ) {
    syncClerkUser(
      clerkUserId: $clerkUserId
      email: $email
      name: $name
      avatarUrl: $avatarUrl
    ) {
      id
      clerkUserId
      email
      name
      avatarUrl
      role
    }
  }
`;

export interface SyncClerkUserVariables {
  clerkUserId: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface SyncClerkUserResult {
  syncClerkUser: Pick<
    UserProfile,
    "id" | "clerkUserId" | "email" | "name" | "avatarUrl" | "role"
  >;
}

export const MAJORS_QUERY = /* GraphQL */ `
  query Majors($filter: MajorFilterInput) {
    majors(filter: $filter) {
      items {
        ${MAJOR_FIELDS}
        school {
          ${SCHOOL_CARD_FIELDS}
        }
      }
      pageInfo {
        totalCount
        limit
        offset
        hasNextPage
      }
    }
  }
`;

export interface MajorsQueryVariables {
  filter?: MajorFilterInput;
}

export interface MajorWithSchool extends Major {
  school: School;
}

export interface MajorsQueryResult {
  majors: Omit<MajorPage, "items"> & { items: MajorWithSchool[] };
}

export const PERSONALIZED_RECOMMENDATIONS_QUERY = /* GraphQL */ `
  query PersonalizedRecommendations($limit: Int) {
    personalizedRecommendations(limit: $limit) {
      matchScore
      eligible
      reason
      school {
        ${SCHOOL_CARD_FIELDS}
      }
      major {
        ${MAJOR_FIELDS}
      }
    }
  }
`;

export interface PersonalizedRecommendationsVariables {
  limit?: number;
}

export interface PersonalizedRecommendationsResult {
  personalizedRecommendations: ScoreMatchResult[];
}
