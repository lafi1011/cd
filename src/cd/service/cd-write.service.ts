/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Das Modul besteht aus der Klasse {@linkcode CdWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import { Cd } from '../entity/cd.entity.js';
import { CdReadService } from './cd-read.service.js';
// eslint-disable-next-line sort-imports
import { type DeleteResult, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// eslint-disable-next-line sort-imports
import {
    IsrcExistsException,
    VersionInvalidException,
    VersionOutdatedException,
} from './exceptions.js';
import { Lieder } from '../entity/lieder.entity.js';
import { MailService } from '../../mail/mail.service.js';
import RE2 from 're2';
import { getLogger } from '../../logger/logger.js';

/** Typdefinitionen zum Aktualisieren eines Cdes mit `update`. */
export interface UpdateParams {
    /** ID des zu aktualisierenden Cdes. */
    readonly id: number | undefined;
    /** Cd-Objekt mit den aktualisierten Werten. */
    readonly cd: Cd;
    /** Versionsnummer für die aktualisierenden Werte. */
    readonly version: string;
}

/**
 * Die Klasse `CdWriteService` implementiert den Anwendungskern für das
 * Schreiben von Bücher und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class CdWriteService {
    private static readonly VERSION_PATTERN = new RE2('^"\\d*"');

    readonly #repo: Repository<Cd>;

    readonly #readService: CdReadService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(CdWriteService.name);

    constructor(
        @InjectRepository(Cd) repo: Repository<Cd>,
        readService: CdReadService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
        this.#mailService = mailService;
    }

    /**
     * Ein neues Cd soll angelegt werden.
     * @param cd Das neu abzulegende Cd
     * @returns Die ID des neu angelegten Cdes
     * @throws IsbnExists falls die ISBN-Nummer bereits existiert
     */
    async create(cd: Cd): Promise<number> {
        this.#logger.debug('create: cd=%o', cd);
        await this.#validateCreate(cd);

        const cdDb = await this.#repo.save(cd); // implizite Transaktion
        this.#logger.debug('create: cdDb=%o', cdDb);

        await this.#sendmail(cdDb);

        return cdDb.id!;
    }

    /**
     * Ein vorhandenes Cd soll aktualisiert werden.
     * @param cd Das zu aktualisierende Cd
     * @param id ID des zu aktualisierenden Cds
     * @param version Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     * @throws VersionInvalidException falls die Versionsnummer ungültig ist
     * @throws VersionOutdatedException falls die Versionsnummer veraltet ist
     */
    // https://2ality.com/2015/01/es6-destructuring.html#simulating-named-parameters-in-javascript
    async update({ id, cd, version }: UpdateParams): Promise<number> {
        this.#logger.debug('update: id=%d, cd=%o, version=%s', id, cd, version);
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            throw new NotFoundException(`Es gibt kein Cd mit der ID ${id}.`);
        }

        const validateResult = await this.#validateUpdate(cd, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Cd)) {
            return validateResult;
        }

        const cdNeu = validateResult;
        const merged = this.#repo.merge(cdNeu, cd);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged); // implizite Transaktion
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!;
    }

    /**
     * Ein Cd wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Cdes
     * @returns true, falls das Cd vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: number) {
        this.#logger.debug('delete: id=%d', id);
        const cd = await this.#readService.findById({
            id,
            mitLiedern: true,
        });

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            // Das Cd zur gegebenen ID mit Titel und Abb. asynchron loeschen

            // TODO "cascade" funktioniert nicht beim Loeschen

            const lieder = cd.lieder ?? [];
            for (const abbildung of lieder) {
                await transactionalMgr.delete(Lieder, abbildung.id);
            }

            deleteResult = await transactionalMgr.delete(Cd, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate(cd: Cd): Promise<undefined> {
        this.#logger.debug('#validateCreate: cd=%o', cd);

        const { isrc } = cd;
        try {
            await this.#readService.find({ isrc: isrc }); // eslint-disable-line object-shorthand
        } catch (err) {
            if (err instanceof NotFoundException) {
                return;
            }
        }
        throw new IsrcExistsException(isrc);
    }

    async #sendmail(cd: Cd) {
        const subject = `Neues Cd ${cd.id}`;
        const body = `Das Cd mit dem Titel <strong>${cd.titel}</strong> ist angelegt`;
        await this.#mailService.sendmail({ subject, body });
    }

    async #validateUpdate(cd: Cd, id: number, versionStr: string): Promise<Cd> {
        const version = this.#validateVersion(versionStr);
        this.#logger.debug('#validateUpdate: cd=%o, version=%s', cd, version);

        const resultFindById = await this.#findByIdAndCheckVersion(id, version);
        this.#logger.debug('#validateUpdate: %o', resultFindById);
        return resultFindById;
    }

    #validateVersion(version: string | undefined): number {
        this.#logger.debug('#validateVersion: version=%s', version);
        if (
            version === undefined ||
            !CdWriteService.VERSION_PATTERN.test(version)
        ) {
            throw new VersionInvalidException(version);
        }

        return Number.parseInt(version.slice(1, -1), 10);
    }

    async #findByIdAndCheckVersion(id: number, version: number): Promise<Cd> {
        const cdDb = await this.#readService.findById({ id });

        // nullish coalescing
        const versionDb = cdDb.version!;
        if (version < versionDb) {
            this.#logger.debug(
                '#checkIdAndVersion: VersionOutdated=%d',
                version,
            );
            throw new VersionOutdatedException(version);
        }

        return cdDb;
    }
}
