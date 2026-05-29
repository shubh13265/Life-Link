import express, { Router, Request, Response } from 'express';
import crypto from 'crypto';

const appointmentRouter = Router();
const bedRouter = Router();

// POST /api/appointments - Create appointment
appointmentRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, hospital_id, appointment_type, patient_name, patient_phone, reason } = req.body;

    const db = require('../config/database').default;
    const Appointment = db.models.Appointment;

    const appointment = await Appointment.create({
      id: crypto.randomUUID(),
      user_id,
      hospital_id,
      appointment_type: appointment_type || 'consultation',
      patient_name,
      patient_phone,
      reason,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error booking appointment', error });
  }
});

// GET /api/appointments/:user_id - Get user appointments
appointmentRouter.get('/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const db = require('../config/database').default;
    const Appointment = db.models.Appointment;

    const appointments = await Appointment.findAll({
      where: { user_id },
      include: [{ association: 'hospital', attributes: ['id', 'name', 'address'] }],
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: appointments, count: appointments.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching appointments', error });
  }
});

// PUT /api/appointments/:id/status - Update appointment status
appointmentRouter.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const db = require('../config/database').default;
    const Appointment = db.models.Appointment;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    await appointment.update({ status });
    res.json({ success: true, message: 'Appointment status updated', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating appointment', error });
  }
});

// POST /api/bed-bookings - Book a bed
bedRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, hospital_id, bed_type, duration_days, patient_name, patient_age, patient_phone, medical_condition } = req.body;

    const db = require('../config/database').default;
    const BedBooking = db.models.BedBooking;

    const bedBooking = await BedBooking.create({
      id: crypto.randomUUID(),
      user_id,
      hospital_id,
      bed_type: bed_type || 'general',
      duration_days,
      patient_name,
      patient_age,
      patient_phone,
      medical_condition,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Bed booking request submitted',
      data: bedBooking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error booking bed', error });
  }
});

// GET /api/bed-bookings/:user_id - Get user bed bookings
bedRouter.get('/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const db = require('../config/database').default;
    const BedBooking = db.models.BedBooking;

    const bookings = await BedBooking.findAll({
      where: { user_id },
      include: [{ association: 'hospital', attributes: ['id', 'name', 'address'] }],
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching bed bookings', error });
  }
});

// PUT /api/bed-bookings/:id/status - Update bed booking status
bedRouter.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, check_in_date, check_out_date } = req.body;

    const db = require('../config/database').default;
    const BedBooking = db.models.BedBooking;

    const booking = await BedBooking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Bed booking not found' });
    }

    await booking.update({ status, check_in_date, check_out_date });
    res.json({ success: true, message: 'Bed booking status updated', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating bed booking', error });
  }
});

export { appointmentRouter, bedRouter };
