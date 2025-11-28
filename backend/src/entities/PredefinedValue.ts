import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum PredefinedType {
  CENTRALE = 'centrale',
  EQUIPEMENT = 'equipement',
  TYPE_EVENEMENT = 'type_evenement',
  TYPE_DYSFONCTIONNEMENT = 'type_dysfonctionnement',
  TYPE_INTERVENANT = 'type_intervenant',
}

@Entity('predefined_values')
@Unique(['type', 'value'])
export class PredefinedValue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: PredefinedType,
  })
  @Index()
  type!: PredefinedType;

  @Column({ length: 150 })
  value!: string;

  @Column({ length: 255, nullable: true })
  description?: string;
  
  @Column({ length: 150, nullable: true })
  nickname?: string;
  
  @Column({ length: 150, nullable: true })
  equipmentType?: string;

  @Column({ nullable: true })
  parentId?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
