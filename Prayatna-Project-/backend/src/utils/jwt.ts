import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../config';

const secret = config.jwt.secret as string;

export const generateToken = (payload: any, expiresIn: string = config.jwt.expireIn as string): string => {
  return jwt.sign(payload, secret, { expiresIn }) as string;
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
