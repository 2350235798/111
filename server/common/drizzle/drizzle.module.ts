import { Module, Global } from '@nestjs/common';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
// eslint-disable-next-line import/no-extraneous-dependencies
import postgres from 'postgres';

export const DRIZZLE_DATABASE = 'DRIZZLE_DATABASE';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_DATABASE,
      useFactory: (): PostgresJsDatabase => {
        const connectionString =
          process.env.DATABASE_URL ||
          process.env.SUDA_DATABASE_URL ||
          process.env.FORCE_DB_CONNECT_URL;
        if (!connectionString) {
          throw new Error('DATABASE_URL environment variable is required');
        }
        const client = postgres(connectionString);
        return drizzle(client);
      },
    },
  ],
  exports: [DRIZZLE_DATABASE],
})
export class DrizzleModule {}
