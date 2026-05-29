import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class AmbulanceDriver extends Model {
  declare id: string;
  declare userId: string;
  declare agencyName: string;
  declare vehicleNumber: string;
  declare licenseNumber: string | null;
  declare latitude: number;
  declare longitude: number;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

AmbulanceDriver.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    agencyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vehicleNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'AmbulanceDriver',
    tableName: 'ambulance_driver_profiles',
    timestamps: true,
  }
);

export default AmbulanceDriver;
