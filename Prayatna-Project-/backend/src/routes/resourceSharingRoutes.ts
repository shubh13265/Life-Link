import express, { Router, Request, Response } from 'express';
import { ResourceSharingRequest } from '../models/ResourceSharingRequest';
import Hospital from '../models/Hospital';
import crypto from 'crypto';

const router = Router();

// GET /api/resource-requests/hospitals — all hospitals with their resources (for browse view)
router.get('/hospitals', async (req: Request, res: Response) => {
  try {
    const hospitals = await Hospital.findAll({
      attributes: ['id', 'name', 'city', 'phone',
        'totalBeds', 'icu_beds_available', 'oxygen_cylinders_available',
        'ambulances_available', 'ventilators'],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching hospitals', error });
  }
});

// POST /api/resource-requests — send a resource request to another hospital
router.post('/', async (req: Request, res: Response) => {
  try {
    const { fromHospitalId, fromHospitalName, toHospitalId, toHospitalName, resourceType, quantity, message } = req.body;

    if (!fromHospitalId || !toHospitalId || !resourceType || !quantity) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (fromHospitalId === toHospitalId) {
      return res.status(400).json({ success: false, message: 'Cannot request resources from yourself' });
    }

    const request = await ResourceSharingRequest.create({
      id: crypto.randomUUID(),
      fromHospitalId,
      fromHospitalName,
      toHospitalId,
      toHospitalName,
      resourceType,
      quantity: Number(quantity),
      message: message || '',
      status: 'pending',
      responseMessage: null,
    });

    // Emit socket event to target hospital (real-time notification)
    const io = req.app.get('io');
    if (io) {
      io.emit('resource_request_new', {
        toHospitalId,
        request: request.toJSON(),
      });
    }

    res.status(201).json({ success: true, data: request });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error creating request: ' + error?.message });
  }
});

// GET /api/resource-requests/received/:hospitalId — incoming requests for this hospital
router.get('/received/:hospitalId', async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.params;
    const requests = await ResourceSharingRequest.findAll({
      where: { toHospitalId: hospitalId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching requests', error });
  }
});

// GET /api/resource-requests/sent/:hospitalId — outgoing requests from this hospital
router.get('/sent/:hospitalId', async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.params;
    const requests = await ResourceSharingRequest.findAll({
      where: { fromHospitalId: hospitalId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching requests', error });
  }
});

// PATCH /api/resource-requests/:id/respond — agree or deny a request
router.patch('/:id/respond', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, responseMessage } = req.body; // status: 'agreed' | 'denied'

    if (!['agreed', 'denied'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be agreed or denied' });
    }

    const request = await ResourceSharingRequest.findByPk(id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already responded to' });
    }

    await request.update({ status, responseMessage: responseMessage || '' });

    // Emit socket event back to requesting hospital
    const io = req.app.get('io');
    if (io) {
      io.emit('resource_request_response', {
        toHospitalId: request.fromHospitalId,
        request: request.toJSON(),
      });
    }

    res.json({ success: true, data: request });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error responding: ' + error?.message });
  }
});

export default router;
