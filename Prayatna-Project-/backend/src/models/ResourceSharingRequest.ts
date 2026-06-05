import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class ResourceSharingRequest extends Model {
  public id!: string;
  public fromHospitalId!: string;
  public fromHospitalName!: string;
  public toHospitalId!: string;
  public toHospitalName!: string;
  public resourceType!: string; // 'oxygen' | 'icuBeds' | 'generalBeds' | 'ambulances' | 'ventilators'
  public quantity!: number;
  public message!: string;
  public status!: 'pending' | 'agreed' | 'denied';
  public responseMessage!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ResourceSharingRequest.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    fromHospitalId: { type: DataTypes.STRING, allowNull: false },
    fromHospitalName: { type: DataTypes.STRING, allowNull: false },
    toHospitalId: { type: DataTypes.STRING, allowNull: false },
    toHospitalName: { type: DataTypes.STRING, allowNull: false },
    resourceType: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    message: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'agreed', 'denied'), defaultValue: 'pending' },
    responseMessage: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'resource_sharing_requests',
    timestamps: true,
  }
);

export default ResourceSharingRequest;
