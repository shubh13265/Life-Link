import express, { Router, Request, Response } from 'express';
import crypto from 'crypto';
import EmergencyRequest from '../models/EmergencyRequest';

const router = Router();

// POST /api/bed-bookings - Book a bed
router.post('/', async (req: Request, res: Response) => {
  try {
    const { hospitalId, patientId, bedType, expectedCheckIn, expectedCheckOut, patientName, patientPhone, reason } = req.body;

    const bedBooking = await EmergencyRequest.create({
      id: crypto.randomUUID(),
      title: `Bed Booking (${bedType || 'general'})`,
      description: reason || 'Bed booking request',
      priority: 'low',
      hospitalId,
      patientName: patientName || 'Unknown',
      patientAge: 0,
      patientPhone: patientPhone || '',
      location: 'Public Portal',
      latitude: 0,
      longitude: 0,
      status: 'pending',
      createdBy: patientId || '00000000-0000-0000-0000-000000000000',
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('bed_booking_created', bedBooking);
      if (hospitalId) {
        io.emit(`hospital_booking_${hospitalId}`, bedBooking);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Bed booking request submitted to hospital dashboard',
      data: bedBooking,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error booking bed', error: error?.message || error });
  }
});

// GET /api/bed-bookings/:userId - Get user bed bookings
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const bookings = await EmergencyRequest.findAll({
      where: { createdBy: userId },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching bed bookings', error });
  }
});

// PUT /api/bed-bookings/:bookingId/status - Update bed booking status
router.put('/:bookingId/status', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { status, checkInDate } = req.body;

    const booking = await EmergencyRequest.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    await booking.update({ 
      status,
      completedAt: status === 'completed' ? new Date() : booking.completedAt
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('bed_booking_updated', booking);
    }

    res.json({ success: true, message: 'Booking status updated', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating booking status', error });
  }
});

export default router;
