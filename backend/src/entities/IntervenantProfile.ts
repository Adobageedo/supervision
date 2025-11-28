import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from './Company';

@Entity('intervenant_profiles')
export class IntervenantProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255 })
  surname!: string;

  @Column({ length: 50 })
  phone!: string;

  @Column({ length: 100, nullable: true })
  country?: string;

  @ManyToOne(() => Company, (company) => company.intervenants, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  @Column({ nullable: true })
  companyId?: string;

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
}
