import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class AmbulanceHospitalNotification extends Model {
  declare id: string;
  declare ambulance_driver_id: string;
  declare hospital_id: string;
  declare patient_type: string;
  declare patient_condition: string;
  declare number_of_patients: number;
  declare driver_contact: string;
  declare eta_minutes: number;
  declare status: 'pending' | 'accepted' | 'rejected';
  declare hospital_response: string | null;
  declare responded_at: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

AmbulanceHospitalNotification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ambulance_driver_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    hospital_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    patient_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    patient_condition: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    number_of_patients: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    driver_contact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    eta_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      defaultValue: 'pending',
    },
    hospital_response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    responded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'AmbulanceHospitalNotification',
    tableName: 'ambulance_hospital_notifications',
    timestamps: true,
  }
);

export default AmbulanceHospitalNotification;

