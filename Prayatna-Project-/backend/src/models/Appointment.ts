import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Appointment extends Model {
  declare id: string;
  declare userId: string;
  declare hospitalId: string;
  declare appointmentType: string;
  declare patientName: string;
  declare patientPhone: string;
  declare reason: string;
  declare appointmentDate: Date;
  declare appointmentTime: string;
  declare status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  declare createdAt: Date;
  declare updatedAt: Date;
}

Appointment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    hospitalId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    appointmentType: {
      type: DataTypes.STRING,
      defaultValue: 'consultation',
    },
    patientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    patientPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    appointmentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    appointmentTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    modelName: 'Appointment',
    tableName: 'appointments',
    timestamps: true,
  }
);

export default Appointment;
