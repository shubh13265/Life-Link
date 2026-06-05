import express, { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { Op } from 'sequelize';
import EmergencyRequest from '../models/EmergencyRequest';
import Hospital from '../models/Hospital';

const router = Router();

const mapSeverityToPriority = (severity?: string): 'low' | 'medium' | 'high' | 'critical' => {
  switch ((severity || '').toLowerCase()) {
    case 'critical': return 'critical';
    case 'high': return 'high';
    case 'low': return 'low';
    default: return 'medium';
  }
};

// POST /api/emergency/request - Create emergency request
router.post('/request', async (req: Request, res: Response) => {
  try {
    const { patientName, patientPhone, emergencyType, severity, requiredHospitalFeatures, latitude, longitude, hospitalId, patientId } = req.body;
    
    if (!patientName || !emergencyType || latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: 'patientName, emergencyType, latitude and longitude are required' });
    }

    const nearbyHospital = hospitalId ? await Hospital.findByPk(hospitalId) : await Hospital.findOne({
      where: { latitude: { [Op.ne]: null }, longitude: { [Op.ne]: null } },
      order: [['updatedAt', 'DESC']],
    });

    const emergencyRequest = await EmergencyRequest.create({
      id: crypto.randomUUID(),
      title: `${emergencyType} emergency`,
      description: `Emergency reported for ${patientName}`,
      priority: mapSeverityToPriority(severity),
      requiredResources: Array.isArray(requiredHospitalFeatures) ? requiredHospitalFeatures : [],
      hospitalId: hospitalId || nearbyHospital?.id || null,
      patientName,
      patientAge: 0,
      patientPhone: patientPhone || null,
      location: `Lat ${latitude}, Lng ${longitude}`,
      latitude,
      longitude,
      status: 'pending',
      assignedTo: null,
      createdBy: patientId || '00000000-0000-0000-0000-000000000000',
      estimatedArrival: null,
      completedAt: null,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('emergency_created', emergencyRequest);
      if (emergencyRequest.hospitalId) {
        io.emit(`hospital_emergency_${emergencyRequest.hospitalId}`, emergencyRequest);
      }
    }

    res.status(201).json({ 
      success: true, 
      message: nearbyHospital ? 'Emergency request created and assigned' : 'Emergency request created and awaiting assignment', 
      data: emergencyRequest 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Error: ${error?.message}` });
  }
});

// GET /api/emergency/:id - Get emergency by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const emergency = await EmergencyRequest.findByPk(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: emergency });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Error: ${error?.message}` });
  }
});

// GET /api/emergency - Get emergencies with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, hospitalId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (hospitalId) where.hospitalId = hospitalId;
    const emergencies = await EmergencyRequest.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: emergencies, count: emergencies.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Error: ${error?.message}` });
  }
});

// PUT /api/emergency/:id/status - Update emergency status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'status required' });
    
    const emergency = await EmergencyRequest.findByPk(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Not found' });
    
    await emergency.update({ status, completedAt: status === 'completed' ? new Date() : emergency.completedAt });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency_updated', emergency);
      if (emergency.hospitalId) io.emit(`hospital_emergency_${emergency.hospitalId}`, emergency);
    }
    
    res.json({ success: true, message: 'Status updated', data: emergency });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Error: ${error?.message}` });
  }
});

// PUT /api/emergency/:id/assign-ambulance - Assign ambulance to emergency
router.put('/:id/assign-ambulance', async (req: Request, res: Response) => {
  try {
    const ambulanceId = req.body.ambulance_id || req.body.driver_id || req.body.driverId;
    
    if (!ambulanceId) {
      return res.status(400).json({ success: false, message: 'ambulanceId/driverId required' });
    }
    
    const emergency = await EmergencyRequest.findByPk(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Not found' });
    
    await emergency.update({ assignedTo: ambulanceId, status: 'in_transit' });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency_updated', emergency);
      if (emergency.hospitalId) io.emit(`hospital_emergency_${emergency.hospitalId}`, emergency);
    }
    
    res.json({ success: true, message: 'Ambulance assigned', data: emergency });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Error: ${error?.message}` });
  }
});

export default router;