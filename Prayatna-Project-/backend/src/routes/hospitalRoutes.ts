import express, { Router, Request, Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import xlsx from 'xlsx';
import Hospital from '../models/Hospital';
import os from 'os';

const router = Router();
const upload = multer({ dest: os.tmpdir() });

// Helper: Calculate distance using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// GET /api/hospitals - Get all hospitals
router.get('/', async (req: Request, res: Response) => {
  try {
    const hospitals = await Hospital.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: hospitals, count: hospitals.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching hospitals', error });
  }
});

// GET /api/hospitals/nearby - Get nearby hospitals by coordinates
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;
    const icuBeds = String(req.query.icuBeds || '').toLowerCase() === 'true';
    const oxygen = String(req.query.oxygen || '').toLowerCase() === 'true';
    const ambulance = String(req.query.ambulance || '').toLowerCase() === 'true';
    const bloodBank = String(req.query.bloodBank || '').toLowerCase() === 'true';
    const sort = String(req.query.sort || '').toLowerCase();

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude required' });
    }

    const hospitals = await Hospital.findAll();
    const nearbyHospitals = hospitals
      .map((hospital: any) => ({
        ...hospital.dataValues,
        distance: calculateDistance(
          parseFloat(latitude as string),
          parseFloat(longitude as string),
          hospital.latitude,
          hospital.longitude
        ),
      }))
      .filter((h: any) => h.distance <= (radius || 50))
      .sort((a: any, b: any) => a.distance - b.distance);

    // Apply frontend boolean filters
    let filtered = nearbyHospitals;
    if (icuBeds) filtered = filtered.filter((h: any) => (h.icu_beds_available ?? 0) > 0 || (h.icuBeds ?? 0) > 0);
    if (oxygen) filtered = filtered.filter((h: any) => (h.oxygen_cylinders_available ?? 0) > 0 || (h.ventilators ?? 0) > 0);
    if (ambulance) filtered = filtered.filter((h: any) => (h.ambulances_available ?? 0) > 0);
    if (bloodBank) filtered = filtered.filter((h: any) => true);

    if (sort === 'distance') {
      filtered = filtered.sort((a: any, b: any) => a.distance - b.distance);
    } else if (sort === 'beds') {
      filtered = filtered.sort((a: any, b: any) => (b.icu_beds_available ?? 0) - (a.icu_beds_available ?? 0));
    }

    res.json({ success: true, data: filtered, count: filtered.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching nearby hospitals', error });
  }
});

// GET /api/hospitals/:id - Get hospital by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findByPk(id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    res.json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching hospital', error });
  }
});

// POST /api/hospitals - Create hospital
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      phone,
      email,
      contactPerson,
      contactPhone,
      totalBeds = 0,
      icuBeds = 0,
      icu_beds_available = 10,
      icu_beds_total = 20,
      oxygen_cylinders_available = 25,
      oxygen_cylinders_total = 50,
      ambulances_available = 3,
      specializations = [],
      isVerified = false,
    } = req.body;

    const hospital = await Hospital.create({
      id: crypto.randomUUID(),
      name,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      phone,
      email,
      contactPerson,
      contactPhone,
      totalBeds,
      icuBeds,
      icu_beds_available,
      icu_beds_total,
      oxygen_cylinders_available,
      oxygen_cylinders_total,
      ambulances_available,
      specializations,
      isVerified,
    });

    res.status(201).json({ success: true, message: 'Hospital created', data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating hospital', error });
  }
});

// PUT /api/hospitals/:id - Update hospital
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findByPk(id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    await hospital.update(req.body);
    res.json({ success: true, message: 'Hospital updated', data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating hospital', error });
  }
});

// POST /api/hospitals/upload-csv - bulk create hospitals from CSV
router.post('/upload-csv', upload.single('file'), async (req: Request, res: Response) => {
  const filePath = req.file?.path;
  if (!filePath) {
    return res.status(400).json({ success: false, message: 'CSV file is required' });
  }

  const created: any[] = [];
  try {
    await new Promise<void>((resolve, reject) => {
      const stream = fs
        .createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: any) => {
          created.push(row);
        })
        .on('end', () => resolve())
        .on('error', (err: any) => reject(err));
      return stream;
    });

    const hospitals = await Promise.all(
      created.map((row: any) =>
        Hospital.create({
          id: crypto.randomUUID(),
          name: row.name || row.hospitalName || 'Hospital',
          email: row.email || `hospital-${Date.now()}@health.local`,
          phone: String(row.phone || row.contactPhone || '0000000000'),
          address: row.address || '',
          city: row.city || '',
          state: row.state || '',
          zipCode: String(row.zipCode || row.zip || ''),
          latitude: Number(row.latitude || 0),
          longitude: Number(row.longitude || 0),
          totalBeds: Number(row.totalBeds || 0),
          icuBeds: Number(row.icuBeds || 0),
          icu_beds_available: Number(row.icu_beds_available || row.icuBedsAvailable || 0),
          icu_beds_total: Number(row.icu_beds_total || row.icuBedsTotal || 0),
          oxygen_cylinders_available: Number(row.oxygen_cylinders_available || 0),
          oxygen_cylinders_total: Number(row.oxygen_cylinders_total || 0),
          ambulances_available: Number(row.ambulances_available || 0),
          specializations: row.specializations ? String(row.specializations).split('|') : [],
          contactPerson: row.contactPerson || '',
          contactPhone: String(row.contactPhone || row.phone || ''),
          isVerified: String(row.isVerified || 'false').toLowerCase() === 'true',
        })
      )
    );

    res.json({ success: true, message: 'CSV uploaded successfully', data: hospitals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to process CSV', error: error?.message });
  } finally {
    try { fs.unlinkSync(filePath); } catch {}
  }
});

// POST /api/hospitals/:id/upload-csv-profile - update a hospital profile from CSV (single row)
router.post('/:id/upload-csv-profile', upload.single('file'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const filePath = req.file?.path;
  if (!filePath) {
    return res.status(400).json({ success: false, message: 'CSV file is required' });
  }

  try {
    const hospital = await Hospital.findByPk(id);
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

    const rows: any[] = [];
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: any) => rows.push(row))
        .on('end', () => resolve())
        .on('error', (err: any) => reject(err));
    });

    const row = rows[0];
    if (!row) return res.status(400).json({ success: false, message: 'CSV has no data rows' });

    await hospital.update({
      name: row.name ?? hospital.name,
      email: row.email ?? hospital.email,
      phone: row.phone ?? hospital.phone,
      address: row.address ?? hospital.address,
      city: row.city ?? hospital.city,
      state: row.state ?? hospital.state,
      zipCode: row.zipCode ?? hospital.zipCode,
      latitude: row.latitude != null ? Number(row.latitude) : hospital.latitude,
      longitude: row.longitude != null ? Number(row.longitude) : hospital.longitude,
      totalBeds: row.totalBeds != null ? Number(row.totalBeds) : hospital.totalBeds,
      icuBeds: row.icuBeds != null ? Number(row.icuBeds) : hospital.icuBeds,
      icu_beds_available: row.icu_beds_available != null ? Number(row.icu_beds_available) : hospital.icu_beds_available,
      oxygen_cylinders_available: row.oxygen_cylinders_available != null ? Number(row.oxygen_cylinders_available) : hospital.oxygen_cylinders_available,
      contactPerson: row.contactPerson ?? hospital.contactPerson,
      contactPhone: row.contactPhone ?? hospital.contactPhone,
    });

    res.json({ success: true, message: 'Profile updated via CSV', data: hospital });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to upload CSV profile', error: error?.message });
  } finally {
    try { fs.unlinkSync(filePath); } catch {}
  }
});

export default router;
