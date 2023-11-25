/**
 * Das Modul enthält die Konfiguration für den _Node_-basierten Server.
 * @packageDocumentation
 */

import { type HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface.js';
import { RESOURCES_DIR } from './app.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// https://nodejs.org/api/path.html
// https://nodejs.org/api/fs.html
// http://2ality.com/2017/11/import-meta.html

const tlsDir = resolve(RESOURCES_DIR, 'tls');

// public/private keys und Zertifikat fuer TLS
export const httpsOptions: HttpsOptions = {
    key: readFileSync(resolve(tlsDir, 'private-key.pem')), // eslint-disable-line security/detect-non-literal-fs-filename
    cert: readFileSync(resolve(tlsDir, 'certificate.cer')), // eslint-disable-line security/detect-non-literal-fs-filename
};
