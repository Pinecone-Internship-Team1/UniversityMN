import gql from 'graphql-tag';

export const programTypeDefs = gql`
  type Program {
    id: ID!
    universityId: ID!
    facultyId: ID!
    name: String!
    degree: String!
    duration: String
    description: String
    language: String
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    university: University!
    faculty: Faculty!
    admissionRequirements: [AdmissionRequirement!]!
    requiredSubjects: [Subject!]!
  }

  input CreateProgramInput {
    universityId: ID!
    facultyId: ID!
    name: String!
    degree: String!
    duration: String
    description: String
    language: String
    isActive: Boolean
  }

  input UpdateProgramInput {
    name: String
    degree: String
    duration: String
    description: String
    language: String
    isActive: Boolean
  }

  extend type Query {
    programs(
      search: String
      universityId: ID
      facultyId: ID
      degree: String
      isActive: Boolean
      limit: Int
      offset: Int
    ): [Program!]!
    program(id: ID!): Program
    programsByUniversity(universityId: ID!): [Program!]!
    programsByFaculty(facultyId: ID!): [Program!]!
    comparePrograms(ids: [ID!]!): [Program!]!
  }

  extend type Mutation {
    createProgram(input: CreateProgramInput!): Program!
    updateProgram(id: ID!, input: UpdateProgramInput!): Program!
    deleteProgram(id: ID!): Boolean!
  }
`;
