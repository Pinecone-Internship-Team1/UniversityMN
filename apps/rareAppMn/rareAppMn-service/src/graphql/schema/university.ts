import gql from 'graphql-tag';

export const universityTypeDefs = gql`
  type University {
    id: ID!
    name: String!
    shortName: String
    description: String
    logo: String
    website: String
    type: String
    location: String
    address: String
    phone: String
    email: String
    foundedYear: Int
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    faculties: [Faculty!]!
    programs: [Program!]!
  }

  input CreateUniversityInput {
    name: String!
    shortName: String
    description: String
    logo: String
    website: String
    type: String
    location: String
    address: String
    phone: String
    email: String
    foundedYear: Int
    isActive: Boolean
  }

  input UpdateUniversityInput {
    name: String
    shortName: String
    description: String
    logo: String
    website: String
    type: String
    location: String
    address: String
    phone: String
    email: String
    foundedYear: Int
    isActive: Boolean
  }

  type Query {
    universities(
      search: String
      type: String
      location: String
      isActive: Boolean
      limit: Int
      offset: Int
    ): [University!]!
    university(id: ID!): University
    compareUniversities(ids: [ID!]!): [University!]!
  }

  type Mutation {
    createUniversity(input: CreateUniversityInput!): University!
    updateUniversity(id: ID!, input: UpdateUniversityInput!): University!
    deleteUniversity(id: ID!): Boolean!
  }
`;
