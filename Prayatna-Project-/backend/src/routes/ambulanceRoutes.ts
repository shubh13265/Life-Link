import express, { Router, Request, Response } from 'express';
import crypto from 'crypto';
import AmbulanceDriver from '../models/AmbulanceDriver';
import Hospital from '../models/Hospital';
import AmbulanceHospitalNotification from '../models/AmbulanceHospitalNotification';

const router = Router();

// Helper: Calculate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper: Estimate ETA
const estimateETA = (distance: number): number => {
  // Average speed: 40 km/h in traffic
  return Math.ceil((distance / 40) * 60); // minutes
};

// GET /api/ambulance/hospitals - Get all hospitals for ambulance driver
router.get('/hospitals', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, filters } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude required' });
    }

    const hospitals = await Hospital.findAll();

    // Calculate distance and sort
    const hospitalsWithDistance = hospitals
      .map((hospital: any) => ({
        ...hospital.dataValues,
        icu_beds_available: hospital.icuBeds || hospital.icu_beds_available,
        distance: calculateDistance(
          parseFloat(latitude as string),
          parseFloat(longitude as string),
          hospital.latitude,
          hospital.longitude
        ),
        eta_minutes: estimateETA(
          calculateDistance(
            parseFloat(latitude as string),
            parseFloat(longitude as string),
            hospital.latitude,
            hospital.longitude
          )
        ),
        status: (hospital.icuBeds || hospital.icu_beds_available || 0) > 0 ? 'RECOMMENDED' : 'REJECTED',
      }))
      .sort((a: any, b: any) => a.distance - b.distance);

    // Apply filters
    let filtered = hospitalsWithDistance;
    if (filters) {
      const filterObj = JSON.parse(filters as string);
      if (filterObj.bedAvailable) {
        filtered = filtered.filter((h: any) => (h.icuBeds || h.icu_beds_available || 0) > 0);
      }
      if (filterObj.sortBy === 'nearest') {
        filtered.sort((a: any, b: any) => a.distance - b.distance);
      } else if (filterObj.sortBy === 'farthest') {
        filtered.sort((a: any, b: any) => b.distance - a.distance);
      }
    }

    res.json({ success: true, data: filtered, count: filtered.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching hospitals', error });
  }
});

// GET /api/ambulance/profile/:driverId - Get ambulance driver profile
router.get('/profile/:driverId', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    // Frontend passes userId as driverId
    const driver = await AmbulanceDriver.findOne({ where: { userId: driverId } });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching driver profile', error });
  }
});

// PUT /api/ambulance/location/:driverId - Update ambulance location
router.put('/location/:driverId', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const { latitude, longitude, accuracy } = req.body;

    // Frontend passes userId as driverId
    const driver = await AmbulanceDriver.findOne({ where: { userId: driverId } });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    await driver.update({
      latitude,
      longitude,
    });

    res.json({ success: true, message: 'Location updated', data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating location', error });
  }
});

// POST /api/ambulance/notify-hospital - Create notification for hospital
router.post('/notify-hospital', async (req: Request, res: Response) => {
  try {
    const {
      ambulance_driver_id,
      hospital_id,
      patient_type,
      patient_condition,
      number_of_patients,
      driver_contact,
      eta_minutes,
    } = req.body || {};

    if (!ambulance_driver_id || !hospital_id || !patient_type) {
      return res.status(400).json({
        success: false,
        message: 'ambulance_driver_id, hospital_id, and patient_type are required',
      });
    }

    const notification = await AmbulanceHospitalNotification.create({
      id: crypto.randomUUID(),
      ambulance_driver_id,
      hospital_id,
      patient_type,
      patient_condition: patient_condition || '',
      number_of_patients: Number(number_of_patients || 1),
      driver_contact: driver_contact || '',
      eta_minutes: Number(eta_minutes || 0),
      status: 'pending',
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('ambulance_notification_created', notification);
      io.emit(`hospital_ambulance_notification_${hospital_id}`, notification);
    }

    res.status(201).json({
      success: true,
      message: 'Hospital notified successfully',
      data: notification,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to notify hospital', error: error?.message });
  }
});

// GET /api/ambulance/notifications/:driverId - Get notifications sent by driver
router.get('/notifications/:driverId', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const notifications = await AmbulanceHospitalNotification.findAll({
      where: { ambulance_driver_id: driverId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: notifications, count: notifications.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error?.message });
  }
});

// GET /api/ambulance/hospital-notifications/:hospitalId - Get notifications for a specific hospital
router.get('/hospital-notifications/:hospitalId', async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.params;
    const notifications = await AmbulanceHospitalNotification.findAll({
      where: { hospital_id: hospitalId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: notifications, count: notifications.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch hospital notifications', error: error?.message });
  }
});

// GET /api/ambulance/all-hospital-notifications - Get all notifications (for demo, no auth filter)
router.get('/all-hospital-notifications', async (req: Request, res: Response) => {
  try {
    const notifications = await AmbulanceHospitalNotification.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: notifications, count: notifications.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error?.message });
  }
});

export default router;
