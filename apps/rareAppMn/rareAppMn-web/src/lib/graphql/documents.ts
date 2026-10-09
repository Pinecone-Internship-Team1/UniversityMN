import type { OperationContext } from "urql";
import type {
  AdmissionSchedule,
  CompareItem,
  CompareType,
  Dormitory,
  MajorFilterInput,
  MajorInput,
  MajorPage,
  Major,
  PageInfo,
  Faculty,
  FacultyInput,
  Region,
  Scholarship,
  ScoreMatchResult,
  SchoolFilterInput,
  SchoolInput,
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

export const USER_PROFILE_CACHE: Partial<OperationContext> = {
  additionalTypenames: ["UserProfile"],
};

export const SCHOOL_BOOKMARK_CACHE: Partial<OperationContext> = {
  additionalTypenames: ["School", "UserProfile"],
};

export const MAJOR_BOOKMARK_CACHE: Partial<OperationContext> = {
  additionalTypenames: ["Major", "UserProfile"],
};

export const CATALOG_CACHE: Partial<OperationContext> = {
  additionalTypenames: ["School", "Faculty", "Major", "UserProfile"],
};

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
  phones
  email
  isSaved
  createdAt
`;

const MAJOR_FIELDS = /* GraphQL */ `
  id
  schoolId
  facultyId
  name
  category
  requiredSubjects
  primarySubjects
  secondarySubjects
  examNote
  cutOffScore
  degreeType
  tuitionFee
  tuitionIsEstimate
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
      faculties {
        id
        schoolId
        name
        location
        createdAt
      }
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
  faculties: Faculty[];
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
        school {
          id
          name
        }
      }
    }
  }
`;

export interface SavedMajor extends Omit<Major, "school"> {
  school: Pick<School, "id" | "name">;
}

export interface MeProfile extends Omit<UserProfile, "savedMajors"> {
  savedMajors: SavedMajor[];
}

export interface MeQueryResult {
  me: MeProfile | null;
}

export const VIEWER_QUERY = /* GraphQL */ `
  query Viewer {
    me {
      id
      clerkUserId
      email
      name
      role
      scores
    }
  }
`;

export interface ViewerQueryResult {
  me: Pick<
    UserProfile,
    "id" | "clerkUserId" | "email" | "name" | "role" | "scores"
  > | null;
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
  query PersonalizedRecommendations($limit: Int, $region: Region) {
    personalizedRecommendations(limit: $limit, region: $region) {
      matchScore
      eligible
      verdict
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
  region?: Region;
}

export interface PersonalizedRecommendationsResult {
  personalizedRecommendations: ScoreMatchResult[];
}

export const ANALYZE_SCORE_MATCH_QUERY = /* GraphQL */ `
  query AnalyzeScoreMatch($majorId: ID!, $scores: JSON!) {
    analyzeScoreMatch(majorId: $majorId, scores: $scores) {
      matchScore
      eligible
      verdict
      reason
      major {
        id
        name
        requiredSubjects
        primarySubjects
        secondarySubjects
        examNote
        cutOffScore
      }
    }
  }
`;

export interface AnalyzeScoreMatchVariables {
  majorId: string;
  scores: Record<string, number>;
}

export interface AnalyzeScoreMatchResult {
  analyzeScoreMatch: Pick<ScoreMatchResult, "matchScore" | "eligible" | "verdict" | "reason"> & {
    major: Pick<
      Major,
      | "id"
      | "name"
      | "requiredSubjects"
      | "primarySubjects"
      | "secondarySubjects"
      | "examNote"
      | "cutOffScore"
    >;
  };
}

export const COMPARE_ITEMS_QUERY = /* GraphQL */ `
  query CompareItems($ids: [ID!]!, $type: CompareType!) {
    compareItems(ids: $ids, type: $type) {
      __typename
      ... on School {
        ${SCHOOL_CARD_FIELDS}
        majors {
          id
        }
        scholarships {
          id
        }
        dormitories {
          id
          capacity
          feePerMonth
        }
      }
      ... on Major {
        ${MAJOR_FIELDS}
        school {
          id
          name
        }
      }
    }
  }
`;

export interface CompareItemsVariables {
  ids: string[];
  type: CompareType;
}

export type CompareSchool = Extract<CompareItem, { __typename: "School" }> & {
  majors: Pick<Major, "id">[];
  scholarships: Pick<Scholarship, "id">[];
  dormitories: Pick<Dormitory, "id" | "capacity" | "feePerMonth">[];
};

export type CompareMajor = Extract<CompareItem, { __typename: "Major" }> & {
  school: Pick<School, "id" | "name">;
};

export interface CompareItemsResult {
  compareItems: (CompareSchool | CompareMajor)[];
}

export const SCHOLARSHIP_DIRECTORY_QUERY = /* GraphQL */ `
  query ScholarshipDirectory($filter: SchoolFilterInput) {
    schools(filter: $filter) {
      items {
        id
        name
        location
        scholarships {
          id
          schoolId
          name
          coverage
          requirements
          deadline
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

export interface ScholarshipDirectoryResult {
  schools: {
    items: (Pick<School, "id" | "name" | "location"> & {
      scholarships: Scholarship[];
    })[];
    pageInfo: PageInfo;
  };
}

export const ADMISSION_DIRECTORY_QUERY = /* GraphQL */ `
  query AdmissionDirectory($filter: SchoolFilterInput) {
    schools(filter: $filter) {
      items {
        id
        name
        location
        admissionSchedules {
          id
          schoolId
          eventName
          startDate
          endDate
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

export interface AdmissionDirectoryResult {
  schools: {
    items: (Pick<School, "id" | "name" | "location"> & {
      admissionSchedules: AdmissionSchedule[];
    })[];
    pageInfo: PageInfo;
  };
}

const ADMIN_SCHOOL_FIELDS = /* GraphQL */ `
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
  phones
  email
  createdAt
`;

const ADMIN_FACULTY_FIELDS = /* GraphQL */ `
  id
  schoolId
  name
  location
  createdAt
`;

const ADMIN_MAJOR_FIELDS = /* GraphQL */ `
  id
  schoolId
  facultyId
  name
  category
  requiredSubjects
  primarySubjects
  secondarySubjects
  examNote
  cutOffScore
  degreeType
  tuitionFee
  tuitionIsEstimate
`;

export type AdminSchool = Omit<School, "isSaved">;
export type AdminMajor = Omit<Major, "isSaved" | "school">;

export const ADMIN_SCHOOLS_QUERY = /* GraphQL */ `
  query AdminSchools($filter: SchoolFilterInput) {
    schools(filter: $filter) {
      items {
        ${ADMIN_SCHOOL_FIELDS}
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

export interface AdminSchoolsResult {
  schools: { items: AdminSchool[]; pageInfo: PageInfo };
}

export const ADMIN_SCHOOL_FACULTIES_QUERY = /* GraphQL */ `
  query AdminSchoolFaculties($id: ID!) {
    school(id: $id) {
      id
      name
      faculties {
        ${ADMIN_FACULTY_FIELDS}
      }
      majors {
        ${ADMIN_MAJOR_FIELDS}
      }
    }
  }
`;

export interface AdminSchoolFacultiesResult {
  school:
    | (Pick<School, "id" | "name"> & { faculties: Faculty[]; majors: AdminMajor[] })
    | null;
}

export const CREATE_SCHOOL_MUTATION = /* GraphQL */ `
  mutation CreateSchool($input: SchoolInput!) {
    createSchool(input: $input) {
      ${ADMIN_SCHOOL_FIELDS}
    }
  }
`;

export interface CreateSchoolResult {
  createSchool: AdminSchool;
}

export const UPDATE_SCHOOL_MUTATION = /* GraphQL */ `
  mutation UpdateSchool($id: ID!, $input: SchoolInput!) {
    updateSchool(id: $id, input: $input) {
      ${ADMIN_SCHOOL_FIELDS}
    }
  }
`;

export interface UpdateSchoolResult {
  updateSchool: AdminSchool;
}

export interface SchoolMutationVariables {
  id?: string;
  input: SchoolInput;
}

export const DELETE_SCHOOL_MUTATION = /* GraphQL */ `
  mutation DeleteSchool($id: ID!) {
    deleteSchool(id: $id)
  }
`;

export interface DeleteSchoolResult {
  deleteSchool: boolean;
}

export const CREATE_FACULTY_MUTATION = /* GraphQL */ `
  mutation CreateFaculty($input: FacultyInput!) {
    createFaculty(input: $input) {
      ${ADMIN_FACULTY_FIELDS}
    }
  }
`;

export interface CreateFacultyResult {
  createFaculty: Faculty;
}

export const UPDATE_FACULTY_MUTATION = /* GraphQL */ `
  mutation UpdateFaculty($id: ID!, $input: FacultyInput!) {
    updateFaculty(id: $id, input: $input) {
      ${ADMIN_FACULTY_FIELDS}
    }
  }
`;

export interface UpdateFacultyResult {
  updateFaculty: Faculty;
}

export interface FacultyMutationVariables {
  id?: string;
  input: FacultyInput;
}

export const DELETE_FACULTY_MUTATION = /* GraphQL */ `
  mutation DeleteFaculty($id: ID!) {
    deleteFaculty(id: $id)
  }
`;

export interface DeleteFacultyResult {
  deleteFaculty: boolean;
}

export const CREATE_MAJOR_MUTATION = /* GraphQL */ `
  mutation CreateMajor($input: MajorInput!) {
    createMajor(input: $input) {
      ${ADMIN_MAJOR_FIELDS}
    }
  }
`;

export interface CreateMajorResult {
  createMajor: AdminMajor;
}

export const UPDATE_MAJOR_MUTATION = /* GraphQL */ `
  mutation UpdateMajor($id: ID!, $input: MajorInput!) {
    updateMajor(id: $id, input: $input) {
      ${ADMIN_MAJOR_FIELDS}
    }
  }
`;

export interface UpdateMajorResult {
  updateMajor: AdminMajor;
}

export interface MajorMutationVariables {
  id?: string;
  input: MajorInput;
}

export const DELETE_MAJOR_MUTATION = /* GraphQL */ `
  mutation DeleteMajor($id: ID!) {
    deleteMajor(id: $id)
  }
`;

export interface DeleteMajorResult {
  deleteMajor: boolean;
}

export interface IdVariables {
  id: string;
}

export const USER_BY_CLERK_ID_QUERY = /* GraphQL */ `
  query UserByClerkId($clerkUserId: String!) {
    userByClerkId(clerkUserId: $clerkUserId) {
      id
      clerkUserId
      email
      name
      role
      scores
      createdAt
      updatedAt
      savedSchools {
        id
        name
      }
      savedMajors {
        id
        name
      }
    }
  }
`;

export interface UserByClerkIdVariables {
  clerkUserId: string;
}

export interface UserByClerkIdResult {
  userByClerkId:
    | (Pick<
        UserProfile,
        "id" | "clerkUserId" | "email" | "name" | "role" | "scores" | "createdAt" | "updatedAt"
      > & {
        savedSchools: Pick<School, "id" | "name">[];
        savedMajors: Pick<Major, "id" | "name">[];
      })
    | null;
}
