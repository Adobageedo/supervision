import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Intervention } from './Intervention';

@Entity('intervenants')
export class Intervenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  nom!: string;

  @Column({ length: 100, nullable: true })
  prenom?: string;

  @Column({ length: 50, nullable: true })
  type?: string;

  @Column({ length: 100, nullable: true })
  entreprise?: string;

  @ManyToOne(() => Intervention, (intervention) => intervention.intervenants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'interventionId' })
  intervention!: Intervention;

  @Column()
  interventionId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Virtual property pour obtenir le nom complet
  get nomComplet(): string {
    return this.prenom ? `${this.prenom} ${this.nom}` : this.nom;
  }
}
