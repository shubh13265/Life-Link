import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Hospital from '../models/Hospital';
import AmbulanceDriver from '../models/AmbulanceDriver';
import EmergencyRequest from '../models/EmergencyRequest';
import Appointment from '../models/Appointment';
import AmbulanceHospitalNotification from '../models/AmbulanceHospitalNotification';
import ResourceSharingRequest from '../models/ResourceSharingRequest';

const router = Router();

const SUPER_ADMIN_USERNAME = 'Sanjay';
const SUPER_ADMIN_PASSWORD = 'Sanju123';
const SUPER_ADMIN_JWT_SECRET =
  process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'LifeLink_super_admin_secret';

const authSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, SUPER_ADMIN_JWT_SECRET) as any;
    if (!decoded || decoded.role !== 'super_admin')
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    (req as any).superAdmin = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

// POST /api/super-admin/login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (username !== SUPER_ADMIN_USERNAME || password !== SUPER_ADMIN_PASSWORD)
    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = jwt.sign(
    { role: 'super_admin', username: SUPER_ADMIN_USERNAME },
    SUPER_ADMIN_JWT_SECRET,
    { expiresIn: '12h' }
  );
  return res.json({ success: true, data: { token } });
});

// GET /api/super-admin/stats
router.get('/stats', authSuperAdmin, async (req: Request, res: Response) => {
  try {
    const [totalUsers, patients, drivers, hospitalAdmins,
           totalHospitals, totalDrivers, totalEmergencies,
           totalAppointments, totalAmbulanceNotifs, totalResourceReqs] = await Promise.all([
      User.count(),
      User.count({ where: { type: 'patient' } }),
      User.count({ where: { type: 'ambulance_driver' } }),
      User.count({ where: { type: 'hospital_admin' } }),
      Hospital.count(),
      AmbulanceDriver.count(),
      EmergencyRequest.count(),
      Appointment.count(),
      AmbulanceHospitalNotification.count(),
      ResourceSharingRequest.count(),
    ]);
    return res.json({
      success: true,
      data: {
        users: { total: totalUsers, patient: patients, ambulance_driver: drivers, hospital_admin: hospitalAdmins },
        entities: {
          hospitals: totalHospitals, ambulanceDrivers: totalDrivers,
          emergencies: totalEmergencies, appointments: totalAppointments,
          ambulanceNotifications: totalAmbulanceNotifs, resourceRequests: totalResourceReqs,
        },
      },
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || 'Error' });
  }
});

// GET /api/super-admin/hospitals
router.get('/hospitals', authSuperAdmin, async (req: Request, res: Response) => {
  try {
    const data = await Hospital.findAll({ order: [['createdAt', 'DESC']] });
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message });
  }
});

// GET /api/super-admin/users
router.get('/users', authSuperAdmin, async (req: Request, res: Response) => {
  try {
    const data = await User.findAll({
      attributes: ['id', 'name', 'phone', 'email', 'type', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message });
  }
});

// GET /api/super-admin/emergencies
router.get('/emergencies', authSuperAdmin, async (req: Request, res: Response) => {
  try {
    const data = await EmergencyRequest.findAll({ order: [['createdAt', 'DESC']] });
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message });
  }
});

// GET /api/super-admin/appointments
router.get('/appointments', authSuperAdmin, async (req: Request, res: Response) => {
  try {
    const data = await Appointment.findAll({ order: [['createdAt', 'DESC']] });
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message });
  }
});

// GET /api/super-admin/resource-requests
router.get('/resource-requests', authSuperAdmin, async (req: Request, res: Response) => {
  try {
    const data = await ResourceSharingRequest.findAll({ order: [['createdAt', 'DESC']] });
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message });
  }
});

// GET /api/super-admin/ambulance-drivers
router.get('/ambulance-drivers', authSuperAdmin, async (req: Request, res: Response) => {
  try {
    const data = await AmbulanceDriver.findAll({ order: [['createdAt', 'DESC']] });
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message });
  }
});

export default router;
