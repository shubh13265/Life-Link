import express, { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Hospital from '../models/Hospital';
import AmbulanceHospitalNotification from '../models/AmbulanceHospitalNotification';

const router = Router();

// Middleware: Verify hospital webhook authenticity (basic version)
const verifyWebhook = (req: Request, res: Response, next: any) => {
  // In production, verify timestamp, signature, etc.
  next();
};

// POST /api/webhooks/hospital/:hospital_id/resource-update - Receive resource updates from hospital system
router.post('/hospital/:hospital_id/resource-update', verifyWebhook, async (req: Request, res: Response) => {
  try {
    const { hospital_id } = req.params;
    const { resource, resource_type, available, total, change, details } = req.body;

    const hospital = await Hospital.findByPk(hospital_id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    // Support frontend webhook shape: { resource, available, total }
    if (typeof available === 'number') {
      if (resource === 'icu_beds' || resource_type === 'icu_bed') {
        await hospital.update({ icu_beds_available: Math.max(0, available) });
      } else if (resource === 'oxygen' || resource_type === 'oxygen') {
        await hospital.update({ oxygen_cylinders_available: Math.max(0, available) });
      } else if (resource === 'ambulance' || resource_type === 'ambulance') {
        await hospital.update({ ambulances_available: Math.max(0, available) });
      } else if (resource === 'blood_bank' || resource_type === 'blood_bank') {
        await hospital.update({ blood_bank_info: details || hospital.blood_bank_info });
      }
    } else if (typeof change === 'number') {
      // Support legacy webhook shape: { resource_type, change }
      if (resource_type === 'icu_bed') {
        await hospital.update({ icu_beds_available: Math.max(0, (hospital.icu_beds_available || 0) + change) });
      } else if (resource_type === 'oxygen') {
        await hospital.update({ oxygen_cylinders_available: Math.max(0, (hospital.oxygen_cylinders_available || 0) + change) });
      } else if (resource_type === 'ambulance') {
        await hospital.update({ ambulances_available: Math.max(0, (hospital.ambulances_available || 0) + change) });
      } else if (resource_type === 'blood_bank') {
        await hospital.update({ blood_bank_info: details || hospital.blood_bank_info });
      }
    }

    res.json({
      success: true,
      message: 'Resource update received and processed',
      data: {
        hospital_id,
        resource: resource || resource_type,
        available,
        total,
        change,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing webhook', error });
  }
});

// POST /api/webhooks/hospital/:hospital_id/emergency-response - Hospital accepts/rejects ambulance notification
router.post('/hospital/:hospital_id/ambulance-response', verifyWebhook, async (req: Request, res: Response) => {
  try {
    const { hospital_id } = req.params;
    const { notification_id, status, response_message, message } = req.body;

    const notification = await AmbulanceHospitalNotification.findByPk(notification_id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await notification.update({
      status,
      hospital_response: response_message || message || '',
      responded_at: new Date(),
    });

    // Optional: simple auto-deduct ICU bed on accept
    if (status === 'accepted') {
      const hospital = await Hospital.findByPk(hospital_id);
      if (hospital && (hospital.icu_beds_available || 0) > 0) {
        await hospital.update({ icu_beds_available: Math.max(0, (hospital.icu_beds_available || 0) - 1) });
      }
    }

    // Broadcast response to ambulance driver via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('notification_response', notification);
      io.emit(`driver_notification_${notification.ambulance_driver_id}`, notification);
    }

    res.json({
      success: true,
      message: 'Hospital response recorded',
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing hospital response', error });
  }
});

export default router;
