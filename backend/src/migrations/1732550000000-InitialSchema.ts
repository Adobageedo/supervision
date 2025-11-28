import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1732550000000 implements MigrationInterface {
    name = 'InitialSchema1732550000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enums
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'moderator', 'user')`);
        await queryRunner.query(`CREATE TYPE "public"."predefined_value_type_enum" AS ENUM('centrale', 'equipement', 'type_evenement', 'type_dysfonctionnement', 'type_intervenant')`);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(255) NOT NULL,
                "password" character varying(255) NOT NULL,
                "firstName" character varying(100),
                "lastName" character varying(100),
                "role" "public"."user_role_enum" NOT NULL DEFAULT 'user',
                "isActive" boolean NOT NULL DEFAULT true,
                "refreshToken" character varying(500),
                "lastLogin" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
            )
        `);

        // Create predefined_values table
        await queryRunner.query(`
            CREATE TABLE "predefined_values" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" "public"."predefined_value_type_enum" NOT NULL,
                "value" character varying(255) NOT NULL,
                "description" text,
                "nickname" character varying(100),
                "equipmentType" character varying(100),
                "parentId" uuid,
                "isActive" boolean NOT NULL DEFAULT true,
                "sortOrder" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_predefined_values_id" PRIMARY KEY ("id")
            )
        `);
        
        await queryRunner.query(`CREATE INDEX "IDX_predefined_values_type" ON "predefined_values" ("type")`);
        await queryRunner.query(`CREATE INDEX "IDX_predefined_values_parentId" ON "predefined_values" ("parentId")`);

        // Create companies table
        await queryRunner.query(`
            CREATE TABLE "companies" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "address" text,
                "phone" character varying(50),
                "email" character varying(255),
                "website" character varying(255),
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_companies_id" PRIMARY KEY ("id")
            )
        `);

        // Create intervenants table (merged schema)
        await queryRunner.query(`
            CREATE TABLE "intervenants" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "surname" character varying(255) NOT NULL,
                "phone" character varying(50),
                "email" character varying(255),
                "country" character varying(100),
                "companyId" uuid,
                "type" character varying(50),
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_intervenants_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "intervenants" ADD CONSTRAINT "FK_intervenants_companyId" 
            FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL
        `);

        // Create interventions table
        await queryRunner.query(`
            CREATE TABLE "interventions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "titre" character varying(255) NOT NULL,
                "centraleType" character varying(255),
                "centrale" character varying(255) NOT NULL,
                "equipement" character varying(255) NOT NULL,
                "entrepriseIntervenante" character varying(255),
                "nombreIntervenant" integer,
                "intervenantEnregistre" text,
                "dateRef" TIMESTAMP,
                "debutInter" TIMESTAMP,
                "finInter" TIMESTAMP,
                "hasPerteProduction" boolean DEFAULT false,
                "hasPerteCommunication" boolean DEFAULT false,
                "indispoTerminee" boolean DEFAULT false,
                "dateIndisponibiliteDebut" TIMESTAMP,
                "dateIndisponibiliteFin" TIMESTAMP,
                "typeEvenement" text,
                "typeDysfonctionnement" text,
                "rapportAttendu" boolean DEFAULT false,
                "rapportRecu" boolean DEFAULT false,
                "commentaires" text,
                "isArchived" boolean NOT NULL DEFAULT false,
                "archivedAt" TIMESTAMP,
                "createdById" uuid,
                "updatedById" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_interventions_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_interventions_centrale" ON "interventions" ("centrale")`);
        await queryRunner.query(`CREATE INDEX "IDX_interventions_equipement" ON "interventions" ("equipement")`);
        await queryRunner.query(`CREATE INDEX "IDX_interventions_dateRef" ON "interventions" ("dateRef")`);
        await queryRunner.query(`CREATE INDEX "IDX_interventions_isArchived" ON "interventions" ("isArchived")`);

        await queryRunner.query(`
            ALTER TABLE "interventions" ADD CONSTRAINT "FK_interventions_createdById" 
            FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
        `);
        
        await queryRunner.query(`
            ALTER TABLE "interventions" ADD CONSTRAINT "FK_interventions_updatedById" 
            FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL
        `);

        // Create audit_logs table
        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "entityType" character varying(100) NOT NULL,
                "entityId" character varying(255) NOT NULL,
                "action" character varying(50) NOT NULL,
                "oldValues" jsonb,
                "newValues" jsonb,
                "description" text,
                "ipAddress" character varying(45),
                "userAgent" character varying(255),
                "userId" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entityType" ON "audit_logs" ("entityType")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entityId" ON "audit_logs" ("entityId")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_userId" ON "audit_logs" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_createdAt" ON "audit_logs" ("createdAt")`);

        await queryRunner.query(`
            ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_userId"`);
        await queryRunner.query(`ALTER TABLE "intervention_intervenants" DROP CONSTRAINT "FK_intervention_intervenants_intervenantId"`);
        await queryRunner.query(`ALTER TABLE "intervention_intervenants" DROP CONSTRAINT "FK_intervention_intervenants_interventionId"`);
        await queryRunner.query(`ALTER TABLE "interventions" DROP CONSTRAINT "FK_interventions_updatedById"`);
        await queryRunner.query(`ALTER TABLE "interventions" DROP CONSTRAINT "FK_interventions_createdById"`);
        await queryRunner.query(`ALTER TABLE "intervenants" DROP CONSTRAINT "FK_intervenants_companyId"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_createdAt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_entityId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_entityType"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_intervention_intervenants_intervenantId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_intervention_intervenants_interventionId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_interventions_isArchived"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_interventions_dateDebut"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_interventions_equipement"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_interventions_centrale"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_predefined_values_parentId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_predefined_values_type"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "intervention_intervenants"`);
        await queryRunner.query(`DROP TABLE "interventions"`);
        await queryRunner.query(`DROP TABLE "intervenants"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TABLE "predefined_values"`);
        await queryRunner.query(`DROP TABLE "users"`);

        // Drop enums
        await queryRunner.query(`DROP TYPE "public"."predefined_value_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }
}
