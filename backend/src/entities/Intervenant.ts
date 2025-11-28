import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Company } from './Company';

@Entity('intervenants')
export class Intervenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  @Index()
  name!: string;

  @Column({ length: 255 })
  surname!: string;

  @Column({ length: 50, nullable: true })
  phone?: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ length: 100, nullable: true, default: 'France' })
  country?: string;

  @ManyToOne(() => Company, (company) => company.intervenants, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  @Column({ nullable: true })
  @Index()
  companyId?: string;

  @Column({ length: 100, nullable: true, comment: 'Type of intervenant: Technicien, Ingénieur, etc.' })
  type?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Virtual property for full name
  get fullName(): string {
    return `${this.surname} ${this.name}`;
  }

  // Virtual property for display name (surname first, common in French)
  get displayName(): string {
    return `${this.name} ${this.surname}`;
  }
}
