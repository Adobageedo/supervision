import { MigrationInterface, QueryRunner } from "typeorm";

export class AddToggleFieldsAndMultiSelect1732553900000 implements MigrationInterface {
    name = 'AddToggleFieldsAndMultiSelect1732553900000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add boolean toggle fields
        await queryRunner.query(`
            ALTER TABLE "interventions" 
            ADD COLUMN "hasIntervention" boolean DEFAULT false,
            ADD COLUMN "hasPerteProduction" boolean DEFAULT false,
            ADD COLUMN "hasPerteCommunication" boolean DEFAULT false,
            ADD COLUMN "rapportAttendu" boolean DEFAULT false,
            ADD COLUMN "rapportRecu" boolean DEFAULT false
        `);

        // Change typeEvenement and typeDysfonctionnement to text to store JSON arrays
        await queryRunner.query(`
            ALTER TABLE "interventions" 
            ALTER COLUMN "typeEvenement" TYPE text,
            ALTER COLUMN "typeDysfonctionnement" TYPE text
        `);

        // Update existing data to wrap single values in arrays
        await queryRunner.query(`
            UPDATE "interventions" 
            SET "typeEvenement" = CASE 
                WHEN "typeEvenement" IS NOT NULL AND "typeEvenement" != '' 
                THEN '["' || "typeEvenement" || '"]' 
                ELSE '[]' 
            END
        `);

        await queryRunner.query(`
            UPDATE "interventions" 
            SET "typeDysfonctionnement" = CASE 
                WHEN "typeDysfonctionnement" IS NOT NULL AND "typeDysfonctionnement" != '' 
                THEN '["' || "typeDysfonctionnement" || '"]' 
                ELSE '[]' 
            END
        `);

        // Set hasPerteProduction and hasPerteCommunication based on existing data
        await queryRunner.query(`
            UPDATE "interventions" 
            SET "hasPerteProduction" = CASE 
                WHEN "perteProduction" IS NOT NULL AND "perteProduction" > 0 
                THEN true 
                ELSE false 
            END
        `);

        await queryRunner.query(`
            UPDATE "interventions" 
            SET "hasPerteCommunication" = CASE 
                WHEN "perteCommunication" IS NOT NULL AND "perteCommunication" > 0 
                THEN true 
                ELSE false 
            END
        `);

        // Set hasIntervention based on whether there are intervenants
        await queryRunner.query(`
            UPDATE "interventions" i
            SET "hasIntervention" = CASE 
                WHEN EXISTS (SELECT 1 FROM "intervenants" WHERE "interventionId" = i.id) 
                THEN true 
                ELSE false 
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert typeEvenement and typeDysfonctionnement back to varchar
        // Extract first value from JSON array
        await queryRunner.query(`
            UPDATE "interventions" 
            SET "typeEvenement" = CASE 
                WHEN "typeEvenement" != '[]' 
                THEN (SELECT json_array_elements_text("typeEvenement"::json) LIMIT 1)
                ELSE ''
            END
        `);

        await queryRunner.query(`
            UPDATE "interventions" 
            SET "typeDysfonctionnement" = CASE 
                WHEN "typeDysfonctionnement" != '[]' 
                THEN (SELECT json_array_elements_text("typeDysfonctionnement"::json) LIMIT 1)
                ELSE ''
            END
        `);

        await queryRunner.query(`
            ALTER TABLE "interventions" 
            ALTER COLUMN "typeEvenement" TYPE varchar(100),
            ALTER COLUMN "typeDysfonctionnement" TYPE varchar(150)
        `);

        // Remove boolean toggle fields
        await queryRunner.query(`
            ALTER TABLE "interventions" 
            DROP COLUMN "hasIntervention",
            DROP COLUMN "hasPerteProduction",
            DROP COLUMN "hasPerteCommunication",
            DROP COLUMN "rapportAttendu",
            DROP COLUMN "rapportRecu"
        `);
    }
}
