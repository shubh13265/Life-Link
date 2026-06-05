import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class HospitalAdminProfile extends Model {
  declare id: string;
  declare userId: string;
  declare hospitalId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

HospitalAdminProfile.init(
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
    hospitalId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'HospitalAdminProfile',
    tableName: 'hospital_admin_profiles',
    timestamps: true,
  }
);

export default HospitalAdminProfile;

