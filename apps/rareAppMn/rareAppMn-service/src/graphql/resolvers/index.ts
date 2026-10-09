import { GraphQLError, GraphQLScalarType, Kind, type ValueNode } from 'graphql';
import type { GraphQLContext } from '../../context';
import type { Major, School, User } from '../../db/schema';
import { notFound } from '../../lib/validate';
import { mutations } from './mutations';
import { queries } from './queries';

function parseJsonLiteral(
  ast: ValueNode,
  variables?: Readonly<Record<string, unknown>> | null
): unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
    case Kind.ENUM:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return Number(ast.value);
    case Kind.NULL:
      return null;
    case Kind.VARIABLE:
      return variables?.[ast.name.value];
    case Kind.LIST:
      return ast.values.map((value) => parseJsonLiteral(value, variables));
    case Kind.OBJECT:
      return Object.fromEntries(
        ast.fields.map((field) => [field.name.value, parseJsonLiteral(field.value, variables)])
      );
    default:
      throw new GraphQLError('JSON cannot represent this value.');
  }
}

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value (object, array, string, number, boolean, or null).',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: parseJsonLiteral,
});

async function resolveSchoolOrThrow(schoolId: string, context: GraphQLContext): Promise<School> {
  const school = await context.loaders.schoolById.load(schoolId);
  if (!school) throw notFound('School');
  return school;
}

async function isSchoolSavedByCurrentUser(schoolId: string, context: GraphQLContext) {
  if (!context.user) return false;
  const user = await context.loaders.userByClerkUserId.load(context.user.clerkUserId);
  if (!user) return false;
  const savedIds = await context.loaders.savedSchoolIdsByUserId.load(user.id);
  return savedIds.has(schoolId);
}

async function isMajorSavedByCurrentUser(majorId: string, context: GraphQLContext) {
  if (!context.user) return false;
  const user = await context.loaders.userByClerkUserId.load(context.user.clerkUserId);
  if (!user) return false;
  const savedIds = await context.loaders.savedMajorIdsByUserId.load(user.id);
  return savedIds.has(majorId);
}

export const resolvers = {
  JSON: JSONScalar,
  Query: queries,
  Mutation: mutations,

  UserProfile: {
    role: (parent: User) => parent.role.toUpperCase(),
    savedSchools: async (parent: User, _args: unknown, context: GraphQLContext) => {
      const savedIds = await context.loaders.savedSchoolIdsByUserId.load(parent.id);
      const schools = await Promise.all(
        [...savedIds].map((id) => context.loaders.schoolById.load(id))
      );
      return schools.filter((school): school is School => school !== null);
    },
    savedMajors: async (parent: User, _args: unknown, context: GraphQLContext) => {
      const savedIds = await context.loaders.savedMajorIdsByUserId.load(parent.id);
      const majors = await Promise.all(
        [...savedIds].map((id) => context.loaders.majorById.load(id))
      );
      return majors.filter((major): major is Major => major !== null);
    },
  },

  School: {
    phones: (parent: School) => parent.phones ?? [],
    dormGuide: (parent: School) => {
      const guide = parent.dormGuide;
      if (!guide) return null;
      return {
        note: guide.note ?? null,
        steps: guide.steps ?? [],
        priorityOrder: guide.priorityOrder ?? [],
        specialRooms: guide.specialRooms ?? null,
        documents: guide.documents ?? [],
        rules: guide.rules ?? [],
        links: guide.links ?? [],
      };
    },
    faculties: (parent: School, _args: unknown, context: GraphQLContext) =>
      context.loaders.facultiesBySchoolId.load(parent.id),
    majors: (parent: School, _args: unknown, context: GraphQLContext) =>
      context.loaders.majorsBySchoolId.load(parent.id),
    scholarships: (parent: School, _args: unknown, context: GraphQLContext) =>
      context.loaders.scholarshipsBySchoolId.load(parent.id),
    dormitories: (parent: School, _args: unknown, context: GraphQLContext) =>
      context.loaders.dormitoriesBySchoolId.load(parent.id),
    admissionSchedules: (parent: School, _args: unknown, context: GraphQLContext) =>
      context.loaders.admissionSchedulesBySchoolId.load(parent.id),
    isSaved: (parent: School, _args: unknown, context: GraphQLContext) =>
      isSchoolSavedByCurrentUser(parent.id, context),
  },

  Major: {
    school: (parent: Major, _args: unknown, context: GraphQLContext) =>
      resolveSchoolOrThrow(parent.schoolId, context),
    isSaved: (parent: Major, _args: unknown, context: GraphQLContext) =>
      isMajorSavedByCurrentUser(parent.id, context),
  },

  Scholarship: {
    school: (parent: { schoolId: string }, _args: unknown, context: GraphQLContext) =>
      resolveSchoolOrThrow(parent.schoolId, context),
  },

  Dormitory: {
    school: (parent: { schoolId: string }, _args: unknown, context: GraphQLContext) =>
      resolveSchoolOrThrow(parent.schoolId, context),
  },

  AdmissionSchedule: {
    school: (parent: { schoolId: string }, _args: unknown, context: GraphQLContext) =>
      resolveSchoolOrThrow(parent.schoolId, context),
  },

  CompareItem: {
    __resolveType: (obj: { __typename: 'School' | 'Major' }) => obj.__typename,
  },
};
