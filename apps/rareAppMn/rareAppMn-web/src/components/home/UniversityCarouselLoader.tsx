import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  SCHOOLS_QUERY,
  type SchoolsQueryResult,
  type SchoolsQueryVariables,
} from "@/lib/graphql/documents";
import { createServerGraphqlClient } from "@/lib/graphql-server";
import { UniversityCarousel } from "./UniversityCarousel";

/**
 * Server Component: fetches the top schools directly from the backend
 * during render. Rendered inside a `<Suspense>` boundary in
 * `UniversitySection.tsx` so the rest of the homepage streams immediately
 * while this section's data loads.
 */
export async function UniversityCarouselLoader() {
  const client = createServerGraphqlClient();
  const result = await client
    .query<SchoolsQueryResult, SchoolsQueryVariables>(SCHOOLS_QUERY, {
      filter: { limit: 10 },
    })
    .toPromise();

  if (result.error) {
    return (
      <ErrorState
        title="Сургуулиудыг ачааллаж чадсангүй"
        description="GraphQL backend (apps/rareAppMn-service) ажиллаж байгаа эсэхийг шалгаад хуудсыг дахин ачааллана уу."
      />
    );
  }

  const schools = result.data?.schools.items ?? [];

  if (schools.length === 0) {
    return (
      <EmptyState
        title="Одоогоор сургуулийн мэдээлэл бүртгэгдээгүй байна"
        description="Backend дээр сургуулийн мэдээлэл нэмэгдэх үед энэ хэсэгт харагдана."
      />
    );
  }

  return <UniversityCarousel schools={schools} />;
}
