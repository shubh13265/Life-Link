import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'LifeLink_dev',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Mahi777$',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Import all models to register them with Sequelize
import User from '../models/User';
import Hospital from '../models/Hospital';
import EmergencyRequest from '../models/EmergencyRequest';
import AmbulanceDriver from '../models/AmbulanceDriver';
import Appointment from '../models/Appointment';
import AmbulanceHospitalNotification from '../models/AmbulanceHospitalNotification';
import PatientProfile from '../models/PatientProfile';
import HospitalAdminProfile from '../models/HospitalAdminProfile';

// Export models
export { User, Hospital, EmergencyRequest, AmbulanceDriver, Appointment };
export { AmbulanceHospitalNotification };
export { PatientProfile, HospitalAdminProfile };

async function seedDemoDataIfEmpty() {
  try {
    const existingNames = (await Hospital.findAll({ attributes: ['name'] })).map((h: any) =>
      String(h.name || '').toLowerCase()
    );
    const hasSanjeevani = existingNames.some((n) => n.includes('sanjeevani'));
    const hasApollo = existingNames.some((n) => n.includes('apollo'));
    const hasAiims = existingNames.some((n) => n.includes('aiims'));
    if (hasSanjeevani && hasApollo && hasAiims) return;

    console.log('🌱 Seeding demo hospitals/users...');

    const demoPatientId = '00000000-0000-0000-0000-000000000001';
    const demoDriverUserId = '00000000-0000-0000-0000-000000000002';
    const demoAdminUserId = '00000000-0000-0000-0000-000000000003';
    const aimsAdminUserId = '00000000-0000-0000-0000-000000000004';
    const demoDriverId = '00000000-0000-0000-0000-00000000d001';

    await User.bulkCreate(
      [
        {
          id: demoPatientId,
          phone: '9999999999',
          name: 'Demo Patient',
          email: 'patient@demo.local',
          type: 'patient',
          password_hash: 'demo',
        },
        {
          id: demoDriverUserId,
          phone: '8888888888',
          name: 'Demo Driver',
          email: 'driver@demo.local',
          type: 'ambulance_driver',
          password_hash: 'demo',
        },
        {
          id: demoAdminUserId,
          phone: '7777777777',
          name: 'Demo Hospital Admin',
          email: 'admin@sanjeevani.com',
          type: 'hospital_admin',
          password_hash: 'demo',
        },
        {
          id: aimsAdminUserId,
          phone: '1234567899',
          name: 'AIIMS Admin',
          email: 'admin@aiims.local',
          type: 'hospital_admin',
          password_hash: 'demo',
        },
      ],
      { ignoreDuplicates: true }
    );

    await AmbulanceDriver.create({
      id: demoDriverId,
      userId: demoDriverUserId,
      vehicleNumber: 'AMB-001',
      licenseNumber: 'LIC-AMB-001',
      latitude: 28.6139,
      longitude: 77.2090,
      isActive: true,
    });

    const hospitalsToEnsure: any[] = [
      {
        id: '00000000-0000-0000-0000-00000000h001',
        name: 'Sanjeevani Care Clinic',
        email: 'admin@sanjeevani.com',
        phone: '9876543210',
        address: 'Sector 14, Main Healthcare Road',
        city: 'New Delhi',
        state: 'Delhi',
        zipCode: '110001',
        latitude: 28.6139,
        longitude: 77.2090,
        totalBeds: 120,
        icuBeds: 30,
        icu_beds_available: 10,
        icu_beds_total: 30,
        oxygen_cylinders_available: 45,
        oxygen_cylinders_total: 80,
        ambulances_available: 3,
        ventilators: 5,
        ambulances: 1,
        doctors: 50,
        specializations: ['General Medicine', 'Emergency Care', 'Cardiology'],
        contactPerson: 'Dr. Ramesh Sharma',
        contactPhone: '9876543211',
        isVerified: true,
      },
      {
        id: '00000000-0000-0000-0000-00000000h002',
        name: 'Apollo Super Specialty Hospital',
        email: 'contact@apollo.com',
        phone: '9999999991',
        address: 'Central Medical District',
        city: 'New Delhi',
        state: 'Delhi',
        zipCode: '110002',
        latitude: 28.626,
        longitude: 77.224,
        totalBeds: 500,
        icuBeds: 45,
        icu_beds_available: 0,
        icu_beds_total: 45,
        oxygen_cylinders_available: 0,
        oxygen_cylinders_total: 200,
        ambulances_available: 8,
        ventilators: 0,
        ambulances: 8,
        doctors: 120,
        specializations: ['Trauma', 'Neurology', 'Cardiology'],
        contactPerson: 'Dr. Sharma',
        contactPhone: '9999999991',
        isVerified: true,
      },
      {
        id: '00000000-0000-0000-0000-00000000h003',
        name: 'AIIMS Hospital',
        email: 'contact@aiims.local',
        phone: '011-26588500',
        address: 'AIIMS Campus',
        city: 'New Delhi',
        state: 'Delhi',
        zipCode: '110029',
        latitude: 28.5672,
        longitude: 77.21,
        totalBeds: 800,
        icuBeds: 100,
        icu_beds_available: 12,
        icu_beds_total: 100,
        oxygen_cylinders_available: 80,
        oxygen_cylinders_total: 200,
        ambulances_available: 10,
        ventilators: 20,
        ambulances: 10,
        doctors: 300,
        specializations: ['Emergency Care', 'Surgery', 'Trauma'],
        contactPerson: 'AIIMS Admin',
        contactPhone: '011-26588500',
        isVerified: true,
      },
    ];

    // Insert only missing by name to avoid duplicates
    const toInsert = hospitalsToEnsure.filter((h) => {
      const n = String(h.name || '').toLowerCase();
      if (n.includes('sanjeevani')) return !hasSanjeevani;
      if (n.includes('apollo')) return !hasApollo;
      if (n.includes('aiims')) return !hasAiims;
      return true;
    });

    if (toInsert.length > 0) {
      await Hospital.bulkCreate(toInsert);
    }

    // Link demo admin → Sanjeevani hospital
    const existingAdminProfile = await HospitalAdminProfile.findOne({ where: { userId: demoAdminUserId } });
    if (!existingAdminProfile) {
      await HospitalAdminProfile.create({ userId: demoAdminUserId, hospitalId: '00000000-0000-0000-0000-00000000h001' });
    }

    // Link AIIMS admin → AIIMS hospital
    const existingAiimsProfile = await HospitalAdminProfile.findOne({ where: { userId: aimsAdminUserId } });
    if (!existingAiimsProfile) {
      await HospitalAdminProfile.create({ userId: aimsAdminUserId, hospitalId: '00000000-0000-0000-0000-00000000h003' });
    }

    await EmergencyRequest.bulkCreate([
      {
        id: '00000000-0000-0000-0000-00000000e001',
        title: 'Severe Trauma Alert',
        description: 'Car accident victim, multiple fractures. Requires immediate ICU preparation.',
        priority: 'critical',
        requiredResources: ['icu_beds', 'blood_bank'],
        hospitalId: '00000000-0000-0000-0000-00000000h001',
        patientName: 'John Doe',
        patientAge: 0,
        patientPhone: null,
        location: 'New Delhi',
        latitude: 28.6139,
        longitude: 77.209,
        status: 'pending',
        assignedTo: null,
        createdBy: demoPatientId,
        estimatedArrival: null,
        completedAt: null,
      } as any,
    ]);

    console.log('✅ Demo seed complete');
  } catch (e: any) {
    console.warn('⚠️ Seed skipped/failed:', e?.message || e);
  }
}

const ensureUserSchemaCompatibility = async () => {
  const indexRows = await sequelize.query<any>('SHOW INDEX FROM users', {
    type: QueryTypes.SELECT,
  });

  const uniqueEmailIndexes = indexRows.filter(
    (row: any) =>
      row.Column_name === 'email' &&
      Number(row.Non_unique) === 0 &&
      row.Key_name !== 'PRIMARY'
  );

  for (const index of uniqueEmailIndexes) {
    const indexName = String(index.Key_name);
    await sequelize.query(`ALTER TABLE users DROP INDEX \`${indexName}\``);
    console.log(`✅ Removed obsolete unique email index: ${indexName}`);
  }

  const emailTypeRows = await sequelize.query<any>(
    "SHOW COLUMNS FROM users LIKE 'email'",
    { type: QueryTypes.SELECT }
  );

  if (emailTypeRows.length > 0 && String(emailTypeRows[0].Type).toLowerCase() !== 'varchar(255)') {
    await sequelize.query('ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL');
    console.log('✅ Normalized users.email column type to VARCHAR(255) NULL');
  }
};

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    await ensureUserSchemaCompatibility();
    const shouldSync = String(process.env.DB_SYNC || '').toLowerCase() !== 'false';
    if (shouldSync) {
      // Ensure tables exist (project currently has no migrations).
      // alter=true keeps existing data while aligning columns in dev.
      try {
        await sequelize.sync({ alter: true });
      } catch (e: any) {
        console.warn(
          '⚠️ DB sync skipped due to existing schema constraints. ' +
            'For a clean setup, import backend/sql/LifeLink_full.sql.',
          e?.parent?.code || e?.code || e?.message || e
        );
      }
    }
    // Auto-seed demo data if DB is empty (safe for judging/demo)
    await seedDemoDataIfEmpty();
    // Skip automatic sync - use manual migrations instead
    // await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database ready');
  } catch (error) {
    console.error('❌ Database connection failed (Continuing for Socket.io demo):', error);
  }
};

export default sequelize;

