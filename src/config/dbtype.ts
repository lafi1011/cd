/**
 * Das Modul enthält den Namen des DB-Typs: postgres, mysql oder sqlite.
 * @packageDocumentation
 */

import { config } from './app.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const type: string | undefined = config.db?.type;

export const dbType =
    type === 'postgres' || type === 'mysql' || type === 'sqlite'
        ? (type as string)
        : 'postgres';
