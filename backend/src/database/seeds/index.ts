import 'reflect-metadata';
import { AppDataSource } from '../../config/database';
import { User, UserRole } from '../../entities/User';
import { PredefinedValue, PredefinedType } from '../../entities/PredefinedValue';
import bcrypt from 'bcryptjs';
import logger from '../../utils/logger';

async function seed() {
  try {
    logger.info('🌱 Starting database seed...');

    await AppDataSource.initialize();

    // Créer un utilisateur admin par défaut
    const userRepository = AppDataSource.getRepository(User);
    const adminExists = await userRepository.findOne({
      where: { email: 'admin@supervision.com' },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      const admin = userRepository.create({
        email: 'admin@supervision.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      });
      await userRepository.save(admin);
      logger.info('✅ Admin user created: admin@supervision.com / Admin123!');
    } else {
      logger.info('ℹ️  Admin user already exists');
    }

    // Créer des valeurs prédéfinies
    const predefinedValueRepository = AppDataSource.getRepository(PredefinedValue);

    // Centrales
    const centrales = [
      'Centrale Éolienne Nord',
      'Centrale Éolienne Sud',
      'Centrale Solaire Est',
      'Centrale Solaire Ouest',
      'Parc Éolien Maritime',
    ];

    const centraleIds: Record<string, string> = {};
    for (let i = 0; i < centrales.length; i++) {
      let centrale = await predefinedValueRepository.findOne({
        where: { type: PredefinedType.CENTRALE, value: centrales[i] },
      });
      if (!centrale) {
        centrale = await predefinedValueRepository.save({
          type: PredefinedType.CENTRALE,
          value: centrales[i],
          sortOrder: i,
        });
      }
      centraleIds[centrales[i]] = centrale.id;
    }
    logger.info('✅ Centrales seeded');

    // Équipements (linked to centrales)
    const equipements = [
      // Centrale Éolienne Nord
      { value: 'Éolienne E01', centrale: 'Centrale Éolienne Nord' },
      { value: 'Éolienne E02', centrale: 'Centrale Éolienne Nord' },
      { value: 'Éolienne E03', centrale: 'Centrale Éolienne Nord' },
      { value: 'Transformateur T1', centrale: 'Centrale Éolienne Nord' },
      { value: 'Système SCADA Nord', centrale: 'Centrale Éolienne Nord' },
      
      // Centrale Éolienne Sud
      { value: 'Éolienne E04', centrale: 'Centrale Éolienne Sud' },
      { value: 'Éolienne E05', centrale: 'Centrale Éolienne Sud' },
      { value: 'Transformateur T2', centrale: 'Centrale Éolienne Sud' },
      { value: 'Système SCADA Sud', centrale: 'Centrale Éolienne Sud' },
      
      // Centrale Solaire Est
      { value: 'Onduleur O1', centrale: 'Centrale Solaire Est' },
      { value: 'Onduleur O2', centrale: 'Centrale Solaire Est' },
      { value: 'Panneau Solaire PS-A', centrale: 'Centrale Solaire Est' },
      { value: 'Panneau Solaire PS-B', centrale: 'Centrale Solaire Est' },
      { value: 'Transformateur T3', centrale: 'Centrale Solaire Est' },
      
      // Centrale Solaire Ouest
      { value: 'Onduleur O3', centrale: 'Centrale Solaire Ouest' },
      { value: 'Onduleur O4', centrale: 'Centrale Solaire Ouest' },
      { value: 'Panneau Solaire PS-C', centrale: 'Centrale Solaire Ouest' },
      { value: 'Chargeur 48V', centrale: 'Centrale Solaire Ouest' },
      
      // Parc Éolien Maritime
      { value: 'Éolienne Maritime EM01', centrale: 'Parc Éolien Maritime' },
      { value: 'Éolienne Maritime EM02', centrale: 'Parc Éolien Maritime' },
      { value: 'Éolienne Maritime EM03', centrale: 'Parc Éolien Maritime' },
      { value: 'Transformateur Maritime TM1', centrale: 'Parc Éolien Maritime' },
      { value: 'Système de Communication Maritime', centrale: 'Parc Éolien Maritime' },
    ];

    for (let i = 0; i < equipements.length; i++) {
      const exists = await predefinedValueRepository.findOne({
        where: { type: PredefinedType.EQUIPEMENT, value: equipements[i].value },
      });
      if (!exists) {
        await predefinedValueRepository.save({
          type: PredefinedType.EQUIPEMENT,
          value: equipements[i].value,
          parentId: centraleIds[equipements[i].centrale],
          sortOrder: i,
        });
      }
    }
    logger.info('✅ Équipements seeded');

    // Types d'événements
    const typesEvenements = [
      'Arrêt',
      'Alerte',
      'Maintenance Préventive',
      'Maintenance Corrective',
      'Inspection',
      'Panne',
      'Dysfonctionnement',
    ];

    for (let i = 0; i < typesEvenements.length; i++) {
      const exists = await predefinedValueRepository.findOne({
        where: { type: PredefinedType.TYPE_EVENEMENT, value: typesEvenements[i] },
      });
      if (!exists) {
        await predefinedValueRepository.save({
          type: PredefinedType.TYPE_EVENEMENT,
          value: typesEvenements[i],
          sortOrder: i,
        });
      }
    }
    logger.info('✅ Types événements seeded');

    // Types de dysfonctionnements
    const typesDysfonctionnements = [
      'Perte du chargeur 48V',
      'Défaut électrique',
      'Défaut mécanique',
      'Problème de communication',
      'Surchauffe',
      'Vibration anormale',
      'Défaut onduleur',
      'Court-circuit',
      'Perte de production',
      'Défaut réseau',
    ];

    for (let i = 0; i < typesDysfonctionnements.length; i++) {
      const exists = await predefinedValueRepository.findOne({
        where: {
          type: PredefinedType.TYPE_DYSFONCTIONNEMENT,
          value: typesDysfonctionnements[i],
        },
      });
      if (!exists) {
        await predefinedValueRepository.save({
          type: PredefinedType.TYPE_DYSFONCTIONNEMENT,
          value: typesDysfonctionnements[i],
          sortOrder: i,
        });
      }
    }
    logger.info('✅ Types dysfonctionnements seeded');

    // Types d'intervenants
    const typesIntervenants = [
      'Technicien',
      'Ingénieur',
      'Superviseur',
      'Sous-traitant',
      'Expert externe',
    ];

    for (let i = 0; i < typesIntervenants.length; i++) {
      const exists = await predefinedValueRepository.findOne({
        where: { type: PredefinedType.TYPE_INTERVENANT, value: typesIntervenants[i] },
      });
      if (!exists) {
        await predefinedValueRepository.save({
          type: PredefinedType.TYPE_INTERVENANT,
          value: typesIntervenants[i],
          sortOrder: i,
        });
      }
    }
    logger.info('✅ Types intervenants seeded');

    logger.info('🎉 Database seed completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
