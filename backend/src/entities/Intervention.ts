import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('interventions')
export class Intervention {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  @Index()
  titre!: string;

  @Column({ length: 255, nullable: true })
  centraleType?: string;

  @Column({ length: 255 })
  @Index()
  centrale!: string;

  @Column({ length: 255 })
  @Index()
  equipement!: string;

  @Column({ length: 255, nullable: true })
  entrepriseIntervenante?: string;

  @Column({ type: 'int', nullable: true })
  nombreIntervenant?: number;

  @Column({ type: 'text', nullable: true })
  intervenantEnregistre?: string;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  dateRef?: Date;

  @Column({ type: 'timestamp', nullable: true })
  debutInter?: Date;

  @Column({ type: 'timestamp', nullable: true })
  finInter?: Date;

  @Column({ default: false })
  hasPerteProduction!: boolean;

  @Column({ default: false })
  hasPerteCommunication!: boolean;

  @Column({ default: false })
  indispoTerminee!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  dateIndisponibiliteDebut?: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateIndisponibiliteFin?: Date;

  @Column({ type: 'text', nullable: true })
  typeEvenement?: string;

  @Column({ type: 'text', nullable: true })
  typeDysfonctionnement?: string;

  @Column({ default: false })
  rapportAttendu!: boolean;

  @Column({ default: false })
  rapportRecu!: boolean;

  @Column({ type: 'text', nullable: true })
  commentaires?: string;

  @Column({ default: false })
  isArchived!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date;

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
    if (this.debutInter && this.finInter) {
      const diff = this.finInter.getTime() - this.debutInter.getTime();
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
