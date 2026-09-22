export type UniversityType = 'PUBLIC' | 'PRIVATE';

export interface CreateUniversityInput {
  name: string;
  shortName?: string | null;
  logo?: string | null;
  description?: string | null;
  type: UniversityType;
  location?: string | null;
  address?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  establishedYear?: number | null;
}
