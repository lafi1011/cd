/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Florian Goebel, Hochschule Karlsruhe
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

// Nest unterstützt verschiedene Werkzeuge fuer OR-Mapping
// https://docs.nestjs.com/techniques/database
//  * TypeORM     https://typeorm.io
//  * Sequelize   https://sequelize.org
//  * Knex        https://knexjs.org

// TypeORM unterstützt die Patterns
//  * "Data Mapper" und orientiert sich an Hibernate (Java), Doctrine (PHP) und Entity Framework (C#)
//  * "Active Record" und orientiert sich an Mongoose (JavaScript)

// TypeORM unterstützt u.a. die DB-Systeme
//  * Postgres
//  * MySQL
//  * SQLite durch sqlite3 und better-sqlite3
//  * Oracle
//  * Microsoft SQL Server
//  * SAP Hana
//  * Cloud Spanner von Google

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
//import { Cd } from './cd.entity';
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
// https://typeorm.io/entities
@Entity()
export class Cd {
    @Column('int')
    // https://typeorm.io/entities#primary-columns
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
    // statt number ggf. Decimal aus decimal.js analog zu BigDecimal von Java
    readonly preis!: number;

    @Column('boolean')
    @ApiProperty({ example: true, type: Boolean })
    readonly verfuegbar: boolean | undefined;

    // das Temporal-API ab ES2022 wird von TypeORM noch nicht unterstuetzt
    @Column('date')
    @ApiProperty({ example: '2021-01-31' })
    readonly erscheinungsdatum: Date | string | undefined;

    //undefined wegen updates
    @Column('varchar', { length: 40 })
    @ApiProperty({ example: 'Ken Carson', type: String })
    readonly interpret: string | undefined;

    //undefined wegen updates
    @Column('varchar', { length: 40 })
    @ApiProperty({ example: 'Ken Carson', type: String })
    readonly titel: string | undefined;

    // undefined wegen Updates
    @OneToMany(() => Lied, (abbildung) => abbildung.cd, {
        cascade: ['insert', 'remove'],
    })
    readonly lieder: Lied[] | undefined;

    // https://typeorm.io/entities#special-columns
    // https://typeorm.io/entities#column-types-for-postgres
    // https://typeorm.io/entities#column-types-for-mysql--mariadb
    // https://typeorm.io/entities#column-types-for-sqlite--cordova--react-native--expo
    // 'better-sqlite3' erfordert Python zum Uebersetzen, wenn das Docker-Image gebaut wird
    @CreateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    // SQLite:
    // @CreateDateColumn({ type: 'datetime' })
    readonly erzeugt: Date | undefined;

    @UpdateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    // SQLite:
    // @UpdateDateColumn({ type: 'datetime' })
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
