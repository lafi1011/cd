import { Cd } from './cd.entity.js';
import { Lied } from './lied.entity.js';

// erforderlich in src/config/db.ts und src/buch/buch.module.ts
export const entities = [Lied, Cd];
