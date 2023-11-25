/* eslint-disable max-classes-per-file, @typescript-eslint/no-magic-numbers */
/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    IsArray,
    IsBoolean,
    IsISBN,
    IsISO8601,
    IsInt,
    IsOptional,
    IsPositive,
    Matches,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { type CDGenre } from '../entity/cd.entity.js';
import { LiedDTO } from './liedDTO.entity.js';
import { Type } from 'class-transformer';

export const MAX_RATING = 5;

/**
 * Entity-Klasse für Bücher ohne TypeORM und ohne Referenzen.
 */
export class CdDtoOhneRef {
    // https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s13.html
    @IsISBN(13)
    @ApiProperty({ example: '978-0-007-00644-1', type: String })
    readonly isrc!: string;

    @IsInt()
    @Min(0)
    @Max(MAX_RATING)
    @ApiProperty({ example: 5, type: Number })
    readonly bewertung: number | undefined;

    @Matches(/^TRAP$|^HIP HOP$/u)
    @IsOptional()
    @ApiProperty({ example: 'TRAP', type: String })
    readonly genre: CDGenre | undefined;

    @IsPositive()
    @ApiProperty({ example: 1, type: Number })
    // statt number ggf. Decimal aus decimal.js analog zu BigDecimal von Java
    readonly preis!: number;

    @IsBoolean()
    @ApiProperty({ example: true, type: Boolean })
    readonly verfuegbar: boolean | undefined;

    @IsISO8601({ strict: true })
    @IsOptional()
    @ApiProperty({ example: '2021-01-31' })
    readonly erscheinungsdatum: Date | string | undefined;

    @IsOptional()
    @ApiProperty({ example: 'Ken Carson', type: String })
    readonly interpret: string | undefined;

    @IsOptional()
    @ApiProperty({ example: 'Ken Carson', type: String })
    readonly titel: string | undefined;
}

/**
 * Entity-Klasse für Bücher ohne TypeORM.
 */
export class CdDTO extends CdDtoOhneRef {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LiedDTO)
    @ApiProperty({ type: [LiedDTO] })
    readonly lieder: LiedDTO[] | undefined;

    // LiedDTO
}
/* eslint-enable max-classes-per-file, @typescript-eslint/no-magic-numbers */
