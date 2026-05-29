import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class EmergencyRequest extends Model {
  declare id: string;
  declare title: string;
  declare description: string;
  declare priority: 'low' | 'medium' | 'high' | 'critical';
  declare requiredResources: object[];
  declare hospitalId: string;
  declare patientName: string;
  declare patientAge: number;
  declare patientPhone: string;
  declare location: string;
  declare latitude: number;
  declare longitude: number;
  declare status: 'pending' | 'assigned' | 'in_transit' | 'completed' | 'cancelled';
  declare assignedTo: string;
  declare createdBy: string;
  declare estimatedArrival: Date;
  declare completedAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

EmergencyRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    requiredResources: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    hospitalId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    patientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    patientAge: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    patientPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
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
    status: {
      type: DataTypes.ENUM('pending', 'assigned', 'in_transit', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    estimatedArrival: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'EmergencyRequest',
    tableName: 'emergency_requests',
    timestamps: true,
  }
);

export default EmergencyRequest;
