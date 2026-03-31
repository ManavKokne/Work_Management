import "server-only";
import { Pool } from "pg";

let pool;

const TRANSIENT_ERROR_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "57P01",
  "57P02",
  "57P03",
  "53300",
]);

function isTransientPgError(error) {
  const code = String(error?.code || "").toUpperCase();
  if (TRANSIENT_ERROR_CODES.has(code)) {
    return true;
  }

  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("connection timeout") ||
    message.includes("terminat") ||
    message.includes("timeout") ||
    message.includes("could not connect") ||
    message.includes("econnreset") ||
    message.includes("enotfound")
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required");
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(process.env.DATABASE_URL);
    } catch {
      throw new Error("DATABASE_URL is invalid. Use a valid PostgreSQL connection string.");
    }

    const host = String(parsedUrl.hostname || "").toLowerCase();
    if (host.includes("xxx.supabase.co") || host.includes("your-project-ref.supabase.co")) {
      throw new Error(
        "DATABASE_URL uses a placeholder Supabase host. Replace it with your real project DB host from Supabase."
      );
    }

    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(host);
    const useSsl = !isLocalHost;

    const username = decodeURIComponent(parsedUrl.username || "");
    const password = decodeURIComponent(parsedUrl.password || "");
    const databaseName = parsedUrl.pathname?.replace(/^\//, "") || "postgres";
    const port = Number(parsedUrl.port || 5432);

    const forceIPv4 = String(process.env.PG_FORCE_IPV4 || "").toLowerCase() === "true";

    pool = new Pool({
      host,
      port,
      ...(forceIPv4 ? { family: 4 } : {}),
      user: username,
      password,
      database: databaseName,
      min: 1,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      keepAlive: true,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    });

    pool.on("error", (error) => {
      console.error("PostgreSQL pool error:", error?.message || error);
    });
  }

  return pool;
}

export async function query(sql, params = []) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await getPool().query(sql, params);
      return result.rows;
    } catch (error) {
      if (!isTransientPgError(error) || attempt === maxAttempts) {
        throw error;
      }

      await wait(300 * attempt);
    }
  }

  return [];
}

export async function withTransaction(callback) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
