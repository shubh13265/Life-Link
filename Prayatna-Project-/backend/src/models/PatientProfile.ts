import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class PatientProfile extends Model {
  declare id: string;
  declare userId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

PatientProfile.init(
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
  },
  {
    sequelize,
    modelName: 'PatientProfile',
    tableName: 'patient_profiles',
    timestamps: true,
  }
);

export default PatientProfile;

