import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Hospital extends Model {
  declare id: string;
  declare name: string;
  declare email: string;
  declare phone: string;
  declare address: string;
  declare city: string;
  declare state: string;
  declare zipCode: string;
  declare latitude: number;
  declare longitude: number;
  declare totalBeds: number;
  declare icuBeds: number;
  declare icu_beds_available: number;
  declare icu_beds_total: number;
  declare oxygen_cylinders_available: number;
  declare oxygen_cylinders_total: number;
  declare blood_bank_info: any;
  declare ambulances_available: number;
  declare ventilators: number;
  declare ambulances: number;
  declare doctors: number;
  declare specializations: string[];
  declare contactPerson: string;
  declare contactPhone: string;
  declare isVerified: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Hospital.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    totalBeds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    icuBeds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    icu_beds_available: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    icu_beds_total: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    oxygen_cylinders_available: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    oxygen_cylinders_total: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    ambulances_available: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    blood_bank_info: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ventilators: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    ambulances: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    doctors: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    specializations: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    contactPerson: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Hospital',
    tableName: 'hospitals',
    timestamps: true,
  }
);

export default Hospital;
