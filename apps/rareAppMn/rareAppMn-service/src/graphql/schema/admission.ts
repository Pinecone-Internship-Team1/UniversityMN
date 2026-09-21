import gql from 'graphql-tag';

export const admissionTypeDefs = gql`
  type Subject {
    id: ID!
    name: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AdmissionRequirement {
    id: ID!
    programId: ID!
    academicYear: String!
    minimumScore: Float
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
    program: Program!
    subjects: [Subject!]!
  }

  input CreateSubjectInput {
    name: String!
  }

  input UpdateSubjectInput {
    name: String!
  }

  input CreateAdmissionRequirementInput {
    programId: ID!
    academicYear: String!
    minimumScore: Float
    description: String
    subjectIds: [ID!]
  }

  input UpdateAdmissionRequirementInput {
    academicYear: String
    minimumScore: Float
    description: String
    subjectIds: [ID!]
  }

  """
  One subject score a student is submitting, keyed by Subject id.
  """
  input SubjectScoreInput {
    subjectId: ID!
    score: Int!
  }

  extend type Query {
    admissionRequirements(programId: ID, academicYear: Int): [AdmissionRequirement!]!
    admissionRequirement(id: ID!): AdmissionRequirement
    subjects(search: String): [Subject!]!
    subject(id: ID!): Subject

    """
    Returns programs whose admission requirements are satisfied by the given
    subject scores. A program's admission requirement is satisfied when the
    student has submitted a score for every subject that requirement lists,
    and each score meets the requirement's minimumScore (when set).

    This is a direct, minimal reading of the current schema
    (AdmissionRequirement.minimumScore is a single value per requirement,
    not per subject). An admission requirement with no linked subjects, or
    with a minimumScore the schema can't yet express per-subject, is treated
    as not determinable and excluded rather than guessed at.
    """
    eligiblePrograms(
      scores: [SubjectScoreInput!]!
      academicYear: Int
      universityId: ID
      limit: Int
      offset: Int
    ): [Program!]!
  }

  extend type Mutation {
    createSubject(input: CreateSubjectInput!): Subject!
    updateSubject(id: ID!, input: UpdateSubjectInput!): Subject!
    deleteSubject(id: ID!): Boolean!

    createAdmissionRequirement(input: CreateAdmissionRequirementInput!): AdmissionRequirement!
    updateAdmissionRequirement(id: ID!, input: UpdateAdmissionRequirementInput!): AdmissionRequirement!
    deleteAdmissionRequirement(id: ID!): Boolean!
  }
`;
