import express, { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Appointment from '../models/Appointment';

const router = Router();

// POST /api/appointments - Create appointment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { hospitalId, patientId, patientName, patientPhone, appointmentDate, appointmentTime, reason, appointmentType = 'consultation' } = req.body;

    const appointment = await Appointment.create({
      id: crypto.randomUUID(),
      userId: patientId,
      hospitalId,
      appointmentType,
      patientName,
      patientPhone,
      reason,
      appointmentDate,
      appointmentTime,
      status: 'pending',
    });

    // Broadcast to hospital portal via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('appointment_created', appointment);
      if (hospitalId) {
        io.emit(`hospital_appointment_${hospitalId}`, appointment);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error booking appointment', error });
  }
});

// GET /api/appointments/all - Get all appointments (for hospital dashboard)
router.get('/all', async (req: Request, res: Response) => {
  try {
    const appointments = await Appointment.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: appointments, count: appointments.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching all appointments', error: error?.message });
  }
});

// GET /api/appointments/:userId - Get user appointments
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const appointments = await Appointment.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: appointments, count: appointments.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching appointments', error: error?.message });
  }
});

// PUT /api/appointments/:appointmentId/status - Update appointment status
router.put('/:appointmentId/status', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    await appointment.update({ status });
    res.json({ success: true, message: 'Appointment status updated', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating appointment', error });
  }
});

export default router;
