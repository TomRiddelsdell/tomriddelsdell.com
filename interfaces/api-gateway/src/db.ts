import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../../../domains/shared-kernel/src/schema";
import { getConfig } from '../../../infrastructure/configuration/node-config-service';

// Load environment variables
dotenv.config({ override: true });

neonConfig.webSocketConstructor = ws;

const config = getConfig();

if (!config.database.url) {
  throw new Error("DATABASE_URL configuration is required");
}

export const pool = new Pool({ connectionString: config.database.url });
export const db = drizzle({ client: pool, schema });