import { GraphQLError } from 'graphql';
import { db } from '../../../db';
import type { CreateUniversityInput } from '../../../types';

const currentYear = () => new Date().getUTCFullYear();

function assertValidInput(input: CreateUniversityInput): void {
  if (!input.name.trim()) {
    throw new GraphQLError('University name is required.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'name' },
    });
  }

  if (
    input.establishedYear != null &&
    (input.establishedYear < 1000 || input.establishedYear > currentYear() + 1)
  ) {
    throw new GraphQLError('establishedYear must be a plausible year.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'establishedYear' },
    });
  }
}

export const mutations = {
  createUniversity: async (_parent: unknown, args: { input: CreateUniversityInput }) => {
    const { input } = args;

    assertValidInput(input);

    try {
      return await db.orm['public']['University'].create({
        name: input.name.trim(),
        type: input.type,
        shortName: input.shortName ?? null,
        logo: input.logo ?? null,
        description: input.description ?? null,
        location: input.location ?? null,
        address: input.address ?? null,
        website: input.website ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        establishedYear: input.establishedYear ?? null,
      });
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      throw new GraphQLError('Failed to create university.', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  },
};
