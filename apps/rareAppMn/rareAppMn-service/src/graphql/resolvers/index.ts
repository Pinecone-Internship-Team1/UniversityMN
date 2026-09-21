import { eq } from 'drizzle-orm';
import { GraphQLScalarType, Kind } from 'graphql';

import {
  admissionRequirements,
  admissionRequirementSubjects,
  faculties,
  programs,
  subjects,
  universities,
} from '../../db';
import type { GraphQLContext } from '../../types';
import { notFoundError } from './helpers';
import { mutationResolvers } from './mutations';
import { queryResolvers } from './queries';

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 date-time string',
  serialize(value) {
    const date = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(date.getTime())) {
      throw new TypeError('DateTime cannot represent an invalid date-time value');
    }
    return date.toISOString();
  },
  parseValue(value) {
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new TypeError('DateTime must be a string or number');
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new TypeError('Invalid DateTime value');
    return date;
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) throw new TypeError('DateTime must be a string');
    const date = new Date(ast.value);
    if (Number.isNaN(date.getTime())) throw new TypeError('Invalid DateTime value');
    return date;
  },
});

interface WithId {
  id: string;
}

interface HasUniversityId {
  universityId: string;
}

interface HasFacultyId {
  facultyId: string;
}

interface HasProgramId {
  programId: string;
}

export const resolvers = {
  DateTime: DateTimeScalar,

  Query: queryResolvers,
  Mutation: mutationResolvers,

  University: {
    faculties: async (parent: WithId, _args: unknown, { db }: GraphQLContext) =>
      db.select().from(faculties).where(eq(faculties.universityId, parent.id)),
    programs: async (parent: WithId, _args: unknown, { db }: GraphQLContext) =>
      db.select().from(programs).where(eq(programs.universityId, parent.id)),
  },

  Faculty: {
    university: async (parent: HasUniversityId, _args: unknown, { db }: GraphQLContext) => {
      const [university] = await db
        .select()
        .from(universities)
        .where(eq(universities.id, parent.universityId));
      if (!university) throw notFoundError('University', parent.universityId);
      return university;
    },
    programs: async (parent: WithId, _args: unknown, { db }: GraphQLContext) =>
      db.select().from(programs).where(eq(programs.facultyId, parent.id)),
  },

  Program: {
    university: async (parent: HasUniversityId, _args: unknown, { db }: GraphQLContext) => {
      const [university] = await db
        .select()
        .from(universities)
        .where(eq(universities.id, parent.universityId));
      if (!university) throw notFoundError('University', parent.universityId);
      return university;
    },
    faculty: async (parent: HasFacultyId, _args: unknown, { db }: GraphQLContext) => {
      const [faculty] = await db.select().from(faculties).where(eq(faculties.id, parent.facultyId));
      if (!faculty) throw notFoundError('Faculty', parent.facultyId);
      return faculty;
    },
    admissionRequirements: async (parent: WithId, _args: unknown, { db }: GraphQLContext) =>
      db.select().from(admissionRequirements).where(eq(admissionRequirements.programId, parent.id)),
    requiredSubjects: async (parent: WithId, _args: unknown, { db }: GraphQLContext) => {
      const rows = await db
        .select({ subject: subjects })
        .from(admissionRequirements)
        .innerJoin(
          admissionRequirementSubjects,
          eq(admissionRequirementSubjects.admissionRequirementId, admissionRequirements.id),
        )
        .innerJoin(subjects, eq(admissionRequirementSubjects.subjectId, subjects.id))
        .where(eq(admissionRequirements.programId, parent.id));

      const uniqueById = new Map(rows.map((row) => [row.subject.id, row.subject]));
      return [...uniqueById.values()];
    },
  },

  AdmissionRequirement: {
    program: async (parent: HasProgramId, _args: unknown, { db }: GraphQLContext) => {
      const [program] = await db.select().from(programs).where(eq(programs.id, parent.programId));
      if (!program) throw notFoundError('Program', parent.programId);
      return program;
    },
    subjects: async (parent: WithId, _args: unknown, { db }: GraphQLContext) => {
      const rows = await db
        .select({ subject: subjects })
        .from(admissionRequirementSubjects)
        .innerJoin(subjects, eq(admissionRequirementSubjects.subjectId, subjects.id))
        .where(eq(admissionRequirementSubjects.admissionRequirementId, parent.id));
      return rows.map((row) => row.subject);
    },
  },
};
