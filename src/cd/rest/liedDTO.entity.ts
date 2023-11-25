/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from 'class-validator';

/**
 * Entity-Klasse für Abbildung ohne TypeORM.
 */
export class LiedDTO {
    @MaxLength(32)
    @ApiProperty({ example: 'Der Titel', type: String })
    readonly titel!: string;

    @MaxLength(32)
    @ApiProperty({ example: '3.25', type: String })
    readonly laenge!: string;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
