/**
 * Das Modul besteht aus der Controller-Klasse für Schreiben an der REST-Schnittstelle.
 * @packageDocumentation
 */

import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiHeader,
    ApiNoContentResponse,
    ApiOperation,
    ApiPreconditionFailedResponse,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    Body,
    Controller,
    Delete,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { CdDTO, CdDtoOhneRef } from './cdDTO.entity.js';
import { Request, Response } from 'express';
import { type Cd } from '../entity/cd.entity.js';
import { CdWriteService } from '../service/cd-write.service.js';
import { JwtAuthGuard } from '../../security/auth/jwt/jwt-auth.guard.js';
import { type Lied } from '../entity/lied.entity.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { RolesAllowed } from '../../security/auth/roles/roles-allowed.decorator.js';
import { RolesGuard } from '../../security/auth/roles/roles.guard.js';
import { getBaseUri } from './getBaseUri.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

const MSG_FORBIDDEN = 'Kein Token mit ausreichender Berechtigung vorhanden';
/**
 * Die Controller-Klasse für die Verwaltung von Cds.
 */
@Controller(paths.rest)
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Cd REST-API')
@ApiBearerAuth()
export class CdWriteController {
    readonly #service: CdWriteService;

    readonly #logger = getLogger(CdWriteController.name);

    constructor(service: CdWriteService) {
        this.#service = service;
    }

    /**
     * Eine neue Cd wird asynchron angelegt.
     * @param cd JSON-Daten für ein Cd im Request-Body.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Post()
    @RolesAllowed('admin', 'fachabteilung')
    @ApiOperation({ summary: 'Eine neue Cd anlegen' })
    @ApiCreatedResponse({ description: 'Erfolgreich neu angelegt' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Cddaten' })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async post(
        @Body() cdDTO: CdDTO,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug('post: cdDTO=%o', cdDTO);

        const cd = this.#cdDtoToCd(cdDTO);
        const result = await this.#service.create(cd);

        const location = `${getBaseUri(req)}/${result}`;
        this.#logger.debug('post: location=%s', location);
        return res.location(location).send();
    }

    /**
     * Eine vorhandene Cd wird asynchron aktualisiert.
     *
     * @param cd Cddaten im Body des Request-Objekts.
     * @param id Pfad-Paramater für die ID.
     * @param version Versionsnummer aus dem Header _If-Match_.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params
    @Put(':id')
    @RolesAllowed('admin', 'fachabteilung')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Ein vorhandenes Cd aktualisieren',
        tags: ['Aktualisieren'],
    })
    @ApiHeader({
        name: 'If-Match',
        description: 'Header für optimistische Synchronisation',
        required: false,
    })
    @ApiNoContentResponse({ description: 'Erfolgreich aktualisiert' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Cddaten' })
    @ApiPreconditionFailedResponse({
        description: 'Falsche Version im Header "If-Match"',
    })
    @ApiResponse({
        status: HttpStatus.PRECONDITION_REQUIRED,
        description: 'Header "If-Match" fehlt',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async put(
        @Body() cdDTO: CdDtoOhneRef,
        @Param('id') id: number,
        @Headers('If-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug(
            'put: id=%s, cdDTO=%o, version=%s',
            id,
            cdDTO,
            version,
        );

        if (version === undefined) {
            const msg = 'Header "If-Match" fehlt';
            this.#logger.debug('put: msg=%s', msg);
            return res
                .status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'application/json')
                .send(msg);
        }

        const cd = this.#cdDtoOhneRefToCd(cdDTO);
        const neueVersion = await this.#service.update({ id, cd, version });
        this.#logger.debug('put: version=%d', neueVersion);
        return res.header('ETag', `"${neueVersion}"`).send();
    }

    /**
     * Eine Cd wird anhand seiner ID-gelöscht, die als Pfad-Parameter angegeben
     * ist.
     *
     * @param id Pfad-Paramater für die ID.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Delete(':id')
    @RolesAllowed('admin')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Cd mit der ID löschen' })
    @ApiNoContentResponse({
        description: 'Das Cd wurde gelöscht oder war nicht vorhanden',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async delete(@Param('id') id: number) {
        this.#logger.debug('das hier müsste iegentlich aus delete: id=%s', id);
        await this.#service.delete(id);
    }

    #cdDtoToCd(cdDTO: CdDTO): Cd {
        const lieder = cdDTO.lieder?.map((liederDTO) => {
            const lied: Lied = {
                id: undefined,
                titel: liederDTO.titel,
                laenge: liederDTO.laenge,
                cd: undefined,
            };
            return lied;
        });
        const cd = {
            id: undefined,
            version: undefined,
            isrc: cdDTO.isrc,
            bewertung: cdDTO.bewertung,
            genre: cdDTO.genre,
            preis: cdDTO.preis,
            verfuegbar: cdDTO.verfuegbar,
            erscheinungsdatum: cdDTO.erscheinungsdatum,
            interpret: cdDTO.interpret,
            titel: cdDTO.titel,
            lieder,
            erzeugt: undefined,
            aktualisiert: undefined,
        };

        // Rueckwaertsverweise
        cd.lieder?.forEach((lied) => {
            lied.cd = cd;
        });
        return cd;
    }

    #cdDtoOhneRefToCd(cdDTO: CdDtoOhneRef): Cd {
        return {
            id: undefined,
            version: undefined,
            isrc: cdDTO.isrc,
            bewertung: cdDTO.bewertung,
            genre: cdDTO.genre,
            preis: cdDTO.preis,
            verfuegbar: cdDTO.verfuegbar,
            erscheinungsdatum: cdDTO.erscheinungsdatum,
            interpret: cdDTO.interpret,
            titel: cdDTO.titel,
            lieder: undefined,
            erzeugt: undefined,
            aktualisiert: undefined,
        };
    }
}
