import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type Db = LibSQLDatabase<typeof schema>;

// The data directory is configured at runtime on purpose; the ignore comment
// stops Turbopack from tracing the whole project into the server bundle.
export const DATA_DIR = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.DATA_DIR ?? "./data");

const DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'associate',
    title TEXT,
    phone TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    ref TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'new',
    priority TEXT NOT NULL DEFAULT 'normal',
    source TEXT NOT NULL DEFAULT 'website',
    salutation TEXT,
    contact_name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    country TEXT,
    service_type TEXT,
    activities TEXT,
    details TEXT,
    summary TEXT,
    assignee_id TEXT REFERENCES users(id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_client_message_at TEXT,
    last_staff_reply_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status, updated_at)`,
  `CREATE TABLE IF NOT EXISTS request_events (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    author_id TEXT REFERENCES users(id),
    subject TEXT,
    body TEXT,
    meta TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_events_request ON request_events(request_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'client',
    filename TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    storage_key TEXT NOT NULL,
    uploaded_by TEXT REFERENCES users(id),
    proposal_id TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_documents_request ON documents(request_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    data TEXT NOT NULL,
    total REAL NOT NULL,
    proposal_doc_id TEXT,
    table_doc_id TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL,
    sent_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS quick_sentences (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    label TEXT NOT NULL,
    text TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    bullets TEXT NOT NULL,
    fee REAL NOT NULL,
    duration TEXT,
    route TEXT NOT NULL DEFAULT 'both',
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    code TEXT,
    activity TEXT NOT NULL,
    authority TEXT,
    license TEXT,
    remarks TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  )`,
  // Full-text index over a request and everything said about it. Rebuilt per
  // request by reindexRequest() rather than kept in sync with triggers.
  `CREATE VIRTUAL TABLE IF NOT EXISTS requests_fts USING fts5(
    request_id UNINDEXED,
    ref,
    contact_name,
    company,
    country,
    service_type,
    activities,
    details,
    summary,
    conversation
  )`,
];

type Cached = { client: Client; db: Db; ready: Promise<void> };

const globalForDb = globalThis as unknown as { __aglcDb?: Cached };

function connect(): Cached {
  const url = process.env.DATABASE_URL ?? `file:${path.join(DATA_DIR, "portal.db")}`;
  if (url.startsWith("file:")) {
    fs.mkdirSync(path.dirname(url.slice("file:".length)), { recursive: true });
  }
  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });
  const db = drizzle(client, { schema });
  const ready = (async () => {
    await client.execute("PRAGMA foreign_keys = ON");
    for (const statement of DDL) await client.execute(statement);
  })();
  return { client, db, ready };
}

/** Drizzle database handle. Tables are created on first use. */
export async function getDb(): Promise<Db> {
  if (!globalForDb.__aglcDb) globalForDb.__aglcDb = connect();
  await globalForDb.__aglcDb.ready;
  return globalForDb.__aglcDb.db;
}

/** Raw libSQL client, for FTS queries that Drizzle cannot express. */
export async function getRawClient(): Promise<Client> {
  if (!globalForDb.__aglcDb) globalForDb.__aglcDb = connect();
  await globalForDb.__aglcDb.ready;
  return globalForDb.__aglcDb.client;
}
