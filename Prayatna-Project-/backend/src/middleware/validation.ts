import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    req.body = value.body;
    req.params = value.params;
    Object.assign(req.query, value.query);

    next();
  };
};

// Common validation schemas
export const schemas = {
  register: Joi.object({
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      role: Joi.string().valid('admin', 'doctor', 'coordinator').required(),
      hospitalId: Joi.string().uuid().optional(),
    }),
  }),

  createEmergency: Joi.object({
    body: Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
      priority: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
      patientName: Joi.string().required(),
      patientAge: Joi.number().required(),
      location: Joi.string().required(),
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
      requiredResources: Joi.array().items(
        Joi.object({
          type: Joi.string().required(),
          quantity: Joi.number().required(),
        })
      ),
    }),
  }),

  hospital: Joi.object({
    body: Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
      address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
      contactPerson: Joi.string().required(),
      contactPhone: Joi.string().required(),
    }),
  }),
};
