import jwt from "jsonwebtoken";
import { SignOptions } from "jsonwebtoken";
import { config } from "../config/env.js";
import { IAuthPayload } from "../types/index.js";

export const generateToken = (payload: IAuthPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as any,
  };
  return jwt.sign(payload, config.jwt.secret, options);
};

export const generateRefreshToken = (payload: IAuthPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as any,
  };
  return jwt.sign(payload, config.jwt.refreshSecret, options);
};

export const verifyToken = (token: string): IAuthPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as IAuthPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

export const verifyRefreshToken = (token: string): IAuthPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as IAuthPayload;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

export const decodeToken = (token: string): IAuthPayload | null => {
  try {
    return jwt.decode(token) as IAuthPayload;
  } catch (error) {
    return null;
  }
};
