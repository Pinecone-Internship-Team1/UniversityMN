import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextResponse, type NextRequest } from "next/server";

declare global {
  interface CloudflareEnv {
    // Direct Worker-to-Worker binding to rareAppMn-service. Cloudflare
    // blocks a Worker from `fetch()`-ing another *.workers.dev URL over the
    // public internet (loop prevention, surfaces as error 1003/1042), so
    // this service binding is required in production — a plain fetch only
    // works for local dev against `wrangler dev` on localhost.
    GRAPHQL_SERVICE?: Fetcher;
  }
}

const LOCAL_GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:8787/";

const UPSERT_USER_MUTATION = `
  mutation SyncUser($input: UpsertUserInput!) {
    upsertUser(input: $input) {
      id
    }
  }
`;

const DELETE_USER_MUTATION = `
  mutation SyncDeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

async function callGraphQL<T = unknown>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const requestInit: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  };

  let response: Response;
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (env.GRAPHQL_SERVICE) {
      response = await env.GRAPHQL_SERVICE.fetch("https://oyutan-mn-service/", requestInit);
    } else {
      response = await fetch(LOCAL_GRAPHQL_URL, requestInit);
    }
  } catch {
    // No Cloudflare context available (e.g. plain `next dev`) — fall back
    // to a normal fetch against the local Worker dev server.
    response = await fetch(LOCAL_GRAPHQL_URL, requestInit);
  }

  const json = (await response.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data as T;
}

export async function POST(request: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(request);
  } catch (err) {
    console.error("Clerk webhook: signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const user = event.data;
      const primaryEmail =
        user.email_addresses.find((e) => e.id === user.primary_email_address_id)
          ?.email_address ?? user.email_addresses[0]?.email_address;

      if (!primaryEmail) {
        console.error("Clerk webhook: user has no email address, skipping sync", user.id);
        return NextResponse.json({ received: true, skipped: true });
      }

      const role = user.public_metadata?.["role"];

      await callGraphQL(UPSERT_USER_MUTATION, {
        input: {
          id: user.id,
          email: primaryEmail,
          firstName: user.first_name,
          lastName: user.last_name,
          imageUrl: user.image_url,
          role: typeof role === "string" ? role : undefined,
        },
      });
    } else if (event.type === "user.deleted") {
      if (event.data.id) {
        await callGraphQL(DELETE_USER_MUTATION, { id: event.data.id });
      }
    }
  } catch (err) {
    console.error("Clerk webhook: failed to sync user to database", err);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
