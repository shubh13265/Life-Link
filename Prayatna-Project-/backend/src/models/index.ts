export { default as User } from './User';
export { default as Hospital } from './Hospital';
export { default as EmergencyRequest } from './EmergencyRequest';
export { default as AmbulanceDriver } from './AmbulanceDriver';
export { default as Appointment } from './Appointment';
export { default as AmbulanceHospitalNotification } from './AmbulanceHospitalNotification';
export { default as PatientProfile } from './PatientProfile';
export { default as HospitalAdminProfile } from './HospitalAdminProfile';

// Import all models so they are available for associations
import User from './User';
import Hospital from './Hospital';
import EmergencyRequest from './EmergencyRequest';
import AmbulanceDriver from './AmbulanceDriver';
import Appointment from './Appointment';
import AmbulanceHospitalNotification from './AmbulanceHospitalNotification';
import PatientProfile from './PatientProfile';
import HospitalAdminProfile from './HospitalAdminProfile';

// Define associations if needed
// User.belongsTo(Hospital, { foreignKey: 'hospitalId' });
// Hospital.hasMany(User, { foreignKey: 'hospitalId' });
// EmergencyRequest.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
// EmergencyRequest.belongsTo(Hospital, { foreignKey: 'hospitalId' });

export default {
  User,
  Hospital,
  EmergencyRequest,
  AmbulanceDriver,
  Appointment,
  AmbulanceHospitalNotification,
  PatientProfile,
  HospitalAdminProfile,
};
