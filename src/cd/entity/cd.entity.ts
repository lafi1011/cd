/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { DecimalTransformer } from './decimal-transformer.js';
import { Lied } from './lied.entity.js';
import { dbType } from '../../config/dbtype.js';

/**
 * Alias-Typ für gültige Strings bei der Art eines Buches.
 */
export type CDGenre = 'HIP HOP' | 'TRAP' | 'Rock';

/**
 * Entity-Klasse zu einem relationalen Tabelle
 */
@Entity()
export class Cd {
    @Column('int')
    // CAVEAT: zuerst @Column() und erst dann @PrimaryGeneratedColumn()
    // default: strategy = 'increment' (SEQUENCE, GENERATED ALWAYS AS IDENTITY, AUTO_INCREMENT)
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column('varchar', { unique: true, length: 16 })
    @ApiProperty({ example: '0-0070-0644-6', type: String })
    readonly isrc!: string;

    @Column('int')
    @ApiProperty({ example: 5, type: Number })
    readonly bewertung: number | undefined;

    @Column('varchar', { length: 12 })
    @ApiProperty({ example: 'TRAP', type: String })
    readonly genre: CDGenre | undefined;

    @Column('decimal', {
        precision: 8,
        scale: 2,
        transformer: new DecimalTransformer(),
    })
    @ApiProperty({ example: 1, type: Number })
    readonly preis!: number;

    @Column('boolean')
    @ApiProperty({ example: true, type: Boolean })
    readonly verfuegbar: boolean | undefined;

    @Column('date')
    @ApiProperty({ example: '2021-01-31' })
    readonly erscheinungsdatum: Date | string | undefined;

    @Column('varchar', { length: 40 })
    @ApiProperty({ example: 'Ken Carson', type: String })
    readonly interpret: string | undefined;

    @Column('varchar', { length: 40 })
    @ApiProperty({ example: 'Ken Carson', type: String })
    readonly titel: string | undefined;

    // undefined wegen Updates
    @OneToMany(() => Lied, (lied) => lied.cd, {
        cascade: ['insert', 'remove'],
    })
    readonly lieder: Lied[] | undefined;

    @CreateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly erzeugt: Date | undefined;

    @UpdateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly aktualisiert: Date | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            version: this.version,
            isrc: this.isrc,
            bewertung: this.bewertung,
            genre: this.genre,
            preis: this.preis,
            verfuegbar: this.verfuegbar,
            erscheinungsdatum: this.erscheinungsdatum,
            interpret: this.interpret,
            titel: this.titel,
        });
}
