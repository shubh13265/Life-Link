import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import config from './config';

// Import Routes
import authRoutes from './routes/authRoutes';
import hospitalRoutes from './routes/hospitalRoutes';
import emergencyRoutes from './routes/emergencyRoutes';
import ambulanceRoutes from './routes/ambulanceRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import bedBookingRoutes from './routes/bedBookingRoutes';
import webhookRoutes from './routes/webhookRoutes';
import superAdminRoutes from './routes/superAdminRoutes';
import resourceSharingRoutes from './routes/resourceSharingRoutes';

dotenv.config();

const app: Express = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.cors.origin,
    credentials: true,
  },
});

// Middleware
app.set('io', io);
app.use(helmet());
app.use(cors(config.cors));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'LifeLink Backend is running',
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/ambulance', ambulanceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/bed-bookings', bedBookingRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/resource-requests', resourceSharingRoutes);

app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'LifeLink API',
    version: '1.0.0',
    description: 'Healthcare Resource Coordination Platform',
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });

  // SOS Emergency Dispatch
  socket.on('sos_dispatch', (data) => {
    console.log('Emergency SOS received:', data);
    // Broadcast the SOS to all connected clients (Ambulances & Hospitals)
    socket.broadcast.emit('sos_dispatch', data);
  });

  socket.on('sos_accepted', (data) => {
    console.log('Emergency SOS accepted:', data);
    // Broadcast acceptance back to the users and hospitals
    socket.broadcast.emit('sos_accepted', data);
  });

  // Live driver location updates — relay to all clients (patient portal)
  socket.on('driver_location_update', (data) => {
    socket.broadcast.emit('driver_location_update', data);
  });

  // Ambulance arrived at patient — relay to all clients
  socket.on('ambulance_arrived', (data) => {
    console.log('Ambulance arrived:', data);
    socket.broadcast.emit('ambulance_arrived', data);
  });

  // Hospital inventory update — persist to DB + relay to all clients
  socket.on('hospital_inventory_update', async (data) => {
    console.log('Hospital inventory updated:', data);
    // Persist to database so Public/Ambulance portals reload fresh data
    if (data?.hospitalId) {
      try {
        const { Hospital } = await import('./config/database');
        await (Hospital as any).update({
          totalBeds: data.resources?.generalBeds,
          icu_beds_available: data.resources?.icuBeds,
          oxygen_cylinders_available: data.resources?.oxygenCylinders,
          ambulances_available: data.resources?.ambulances,
          ambulances: data.resources?.ambulances,
          ventilators: data.resources?.ventilators,
        }, { where: { id: data.hospitalId } });
        console.log('✅ Inventory saved to DB for hospital:', data.hospitalId);
      } catch (e: any) {
        console.warn('⚠️ Failed to persist inventory to DB:', e?.message);
      }
    }
    socket.broadcast.emit('hospital_inventory_update', data);
  });

});

// Start Server
const PORT = config.app.port;

const startServer = async () => {
  try {
    try {
      await connectDB();
    } catch (dbError) {
      console.error('Database connection failed, but starting server anyway for demo:', dbError);
    }
    
    httpServer.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║      🚀 LifeLink Backend Started     ║
║        Server running on port ${PORT}       ║
║   Environment: ${config.app.environment}             ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, httpServer, io };

