import { GraphQLError } from 'graphql';
import { db } from '../../../db';

export const queries = {
  universities: async () => {
    try {
      return await db.orm['public']['University'].orderBy((u) => u['createdAt'].desc()).all();
    } catch {
      throw new GraphQLError('Failed to load universities.', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  },

  university: async (_parent: unknown, args: { id: string }) => {
    try {
      return await db.orm['public']['University'].first({ id: args.id });
    } catch {
      throw new GraphQLError('Failed to load university.', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  },
};
