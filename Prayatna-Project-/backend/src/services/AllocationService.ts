/**
 * Example Allocation Service
 * Handles smart resource allocation algorithm
 */

import Hospital from '../models/Hospital';
import EmergencyRequest from '../models/EmergencyRequest';
import { calculateDistance } from '../utils/geolocation';

interface AllocationOptions {
  latitude: number;
  longitude: number;
  requiredResources: any[];
  requiredSpecializations?: string[];
  radiusKm?: number;
}

export class AllocationService {
  /**
   * Smart allocation algorithm
   * Finds the best hospital to handle emergency request
   */
  static async allocateEmergency(options: AllocationOptions) {
    const {
      latitude,
      longitude,
      requiredResources,
      requiredSpecializations = [],
      radiusKm = 50,
    } = options;

    // Get nearby hospitals
    const hospitals = await Hospital.findAll({
      where: {
        latitude: {
          [Symbol.for('between')]: [latitude - 1, latitude + 1],
        },
        longitude: {
          [Symbol.for('between')]: [longitude - 1, longitude + 1],
        },
        isVerified: true,
      },
    });

    // Score hospitals based on criteria
    const scoredHospitals = hospitals
      .map(hospital => {
        const distance = calculateDistance(
          { latitude, longitude },
          { latitude: hospital.latitude, longitude: hospital.longitude }
        );

        // Skip if outside radius
        if (distance > radiusKm) {
          return null;
        }

        // Calculate resource availability score (0-100)
        let resourceScore = 0;
        if (hospital.ambulances > 0) resourceScore += 20;
        if (hospital.icuBeds > 0) resourceScore += 20;
        if (hospital.ventilators > 0) resourceScore += 20;
        if (hospital.doctors > 0) resourceScore += 20;
        resourceScore += 20; // Base score

        // Calculate specialization match score
        let specializationScore = 0;
        if (requiredSpecializations.length > 0) {
          const hospitalSpecializations = hospital.specializations || [];
          const matchCount = requiredSpecializations.filter(spec =>
            hospitalSpecializations.includes(spec)
          ).length;
          specializationScore =
            (matchCount / requiredSpecializations.length) * 100;
        } else {
          specializationScore = 100;
        }

        // Distance score (inverse: closer is better)
        const distanceScore = Math.max(0, 100 - distance * 2);

        // Final score calculation
        const finalScore =
          distanceScore * 0.4 +
          resourceScore * 0.3 +
          specializationScore * 0.3;

        return {
          hospital,
          score: finalScore,
          distance,
          resourceScore,
          specializationScore,
          distanceScore,
        };
      })
      .filter(item => item !== null)
      .sort((a, b) => b.score - a.score);

    if (scoredHospitals.length === 0) {
      throw {
        statusCode: 404,
        message: 'No suitable hospital found for this emergency',
      };
    }

    return scoredHospitals[0];
  }

  /**
   * Get allocation score details
   */
  static getScoreDetails(scoredHospital: any) {
    return {
      hospitalId: scoredHospital.hospital.id,
      hospitalName: scoredHospital.hospital.name,
      totalScore: Math.round(scoredHospital.score),
      distanceScore: Math.round(scoredHospital.distanceScore),
      resourceScore: Math.round(scoredHospital.resourceScore),
      specializationScore: Math.round(scoredHospital.specializationScore),
      distance: Math.round(scoredHospital.distance * 10) / 10,
    };
  }
}

export default AllocationService;
