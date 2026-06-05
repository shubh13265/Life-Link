/**
 * Example Hospital Service
 * Handles hospital-related business logic
 */

import Hospital from '../models/Hospital';
import { calculateDistance, getNearbyCoordinates } from '../utils/geolocation';
import { Op } from 'sequelize';

export class HospitalService {
  /**
   * Get all hospitals with filtering
   */
  static async getAllHospitals(filters: any = {}) {
    const where: any = { isVerified: true };

    if (filters.city) {
      where.city = filters.city;
    }

    if (filters.state) {
      where.state = filters.state;
    }

    const hospitals = await Hospital.findAll({
      where,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
      order: [['name', 'ASC']],
    });

    return hospitals;
  }

  /**
   * Get nearby hospitals within radius
   */
  static async getNearbyHospitals(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ) {
    const bounds = getNearbyCoordinates(latitude, longitude, radiusKm);

    // Get hospitals within bounding box
    const hospitals = await Hospital.findAll({
      where: {
        latitude: {
          [Op.between]: [bounds.minLat, bounds.maxLat],
        },
        longitude: {
          [Op.between]: [bounds.minLon, bounds.maxLon],
        },
        isVerified: true,
      },
    });

    // Calculate actual distance and filter
    const nearby = hospitals
      .map(hospital => ({
        ...hospital.toJSON(),
        distance: calculateDistance(
          { latitude, longitude },
          { latitude: hospital.latitude, longitude: hospital.longitude }
        ),
      }))
      .filter(h => h.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return nearby;
  }

  /**
   * Create hospital
   */
  static async createHospital(data: any) {
    const hospital = await Hospital.create(data);
    return hospital;
  }

  /**
   * Get hospital by ID
   */
  static async getHospitalById(id: string) {
    const hospital = await Hospital.findByPk(id);

    if (!hospital) {
      throw {
        statusCode: 404,
        message: 'Hospital not found',
      };
    }

    return hospital;
  }

  /**
   * Update hospital
   */
  static async updateHospital(id: string, data: any) {
    const hospital = await this.getHospitalById(id);
    await hospital.update(data);
    return hospital;
  }

  /**
   * Delete hospital
   */
  static async deleteHospital(id: string) {
    const hospital = await this.getHospitalById(id);
    await hospital.destroy();
    return { message: 'Hospital deleted successfully' };
  }
}

export default HospitalService;
