import gql from 'graphql-tag';

export const facultyTypeDefs = gql`
  type Faculty {
    id: ID!
    universityId: ID!
    name: String!
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
    university: University!
    programs: [Program!]!
  }

  input CreateFacultyInput {
    universityId: ID!
    name: String!
    description: String
  }

  input UpdateFacultyInput {
    name: String
    description: String
  }

  extend type Query {
    faculties(universityId: ID): [Faculty!]!
    faculty(id: ID!): Faculty
  }

  extend type Mutation {
    createFaculty(input: CreateFacultyInput!): Faculty!
    updateFaculty(id: ID!, input: UpdateFacultyInput!): Faculty!
    deleteFaculty(id: ID!): Boolean!
  }
`;
