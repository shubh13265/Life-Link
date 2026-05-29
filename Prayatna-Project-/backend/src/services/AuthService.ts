/**
 * Authentication Service
 * Handles user operations and token management
 */

import User from '../models/User';
import { generateToken } from '../utils/jwt';

export class AuthService {
  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw {
        statusCode: 404,
        message: 'User not found',
      };
    }

    return this.formatUserResponse(user);
  }

  /**
   * Get user by phone
   */
  static async getUserByPhone(phone: string) {
    const user = await User.findOne({ where: { phone } });

    if (!user) {
      throw {
        statusCode: 404,
        message: 'User not found',
      };
    }

    return this.formatUserResponse(user);
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: string, data: any) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw {
        statusCode: 404,
        message: 'User not found',
      };
    }

    const allowedFields = ['name', 'email'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    await user.update(updateData);
    return this.formatUserResponse(user);
  }

  /**
   * Format user response (exclude sensitive data)
   */
  private static formatUserResponse(user: any) {
    const userJSON = user.toJSON ? user.toJSON() : user;
    const { password_hash, ...userWithoutPassword } = userJSON;
    return userWithoutPassword;
  }
}

export default AuthService;
