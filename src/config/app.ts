/**
 * Das Modul enthält Objekte mit Konfigurationsdaten aus der YAML-Datei.
 * @packageDocumentation
 */

import { existsSync, readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { resolve } from 'node:path';

// im Docker-Image gibt es kein Unterverzeichnis "src"
// https://nodejs.org/api/fs.html
export const BASEDIR = existsSync('src') ? 'src' : 'dist';
// https://nodejs.org/api/path.html
export const RESOURCES_DIR = resolve(BASEDIR, 'config', 'resources');

const configFile = resolve(RESOURCES_DIR, 'app.yml');
export const config = load(
    readFileSync(configFile, 'utf8'), // eslint-disable-line security/detect-non-literal-fs-filename
) as Record<string, any>;
