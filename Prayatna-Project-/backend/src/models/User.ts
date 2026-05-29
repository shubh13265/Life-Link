import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class User extends Model {
  declare id: string;
  declare phone: string;
  declare name: string;
  declare email?: string;
  declare type: 'patient' | 'ambulance_driver' | 'hospital_admin';
  declare password_hash: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true },
    },
    type: {
      type: DataTypes.ENUM('patient', 'ambulance_driver', 'hospital_admin'),
      defaultValue: 'patient',
      allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  }
);

export default User;
