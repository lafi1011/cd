import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Cd } from './cd.entity.js';

@Entity()
export class Lied {
    @Column('int')
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar', { unique: true, length: 32 })
    readonly titel!: string;

    @Column('varchar', { unique: true, length: 32 })
    readonly laenge: string | undefined;

    @ManyToOne(() => Cd, (cd) => cd.lieder)
    @JoinColumn({ name: 'cd_id' })
    cd: Cd | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            titel: this.titel,
            laenge: this.laenge,
        });
}
