import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { Intervenant } from './Intervenant';

@Entity('interventions')
export class Intervention {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  @Index()
  titre!: string;

  @Column({ length: 100 })
  @Index()
  centrale!: string;

  @Column({ length: 100 })
  @Index()
  equipement!: string;

  @Column({ type: 'text', default: '[]' })
  @Index()
  typeEvenement!: string;

  @Column({ type: 'text', default: '[]' })
  @Index()
  typeDysfonctionnement!: string;

  @Column({ type: 'timestamp' })
  @Index()
  dateDebut!: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateFin?: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateIndisponibiliteDebut?: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateIndisponibiliteFin?: Date;

  @Column({ type: 'text', nullable: true })
  commentaires?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  perteProduction?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  perteCommunication?: number;

  @Column({ default: false })
  hasIntervention!: boolean;

  @Column({ default: false })
  hasPerteProduction!: boolean;

  @Column({ default: false })
  hasPerteCommunication!: boolean;

  @Column({ default: false })
  rapportAttendu!: boolean;

  @Column({ default: false })
  rapportRecu!: boolean;

  @Column({ default: false })
  isArchived!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date;

  @OneToMany(() => Intervenant, (intervenant) => intervenant.intervention, {
    cascade: true,
    eager: true,
  })
  intervenants!: Intervenant[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @Column({ nullable: true })
  createdById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updatedById' })
  updatedBy?: User;

  @Column({ nullable: true })
  updatedById?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Virtual property pour calculer la durée en heures
  get dureeHeures(): number | null {
    if (this.dateDebut && this.dateFin) {
      const diff = this.dateFin.getTime() - this.dateDebut.getTime();
      return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
    }
    return null;
  }

  // Virtual property pour calculer la durée d'indisponibilité
  get dureeIndisponibiliteHeures(): number | null {
    if (this.dateIndisponibiliteDebut && this.dateIndisponibiliteFin) {
      const diff =
        this.dateIndisponibiliteFin.getTime() -
        this.dateIndisponibiliteDebut.getTime();
      return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
    }
    return null;
  }
}
