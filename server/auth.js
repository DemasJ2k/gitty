import bcrypt from 'bcryptjs';
import { storage } from './storage.js';

const SALT_ROUNDS = 10;
const sessions = new Map();

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken() {
  return crypto.randomUUID();
}

export function createSession(userId) {
  const token = generateSessionToken();
  const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
  sessions.set(token, { userId, expiresAt });
  return token;
}

export function getSession(token) {
  const session = sessions.get(token);
  if (!session) return null;
  
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  
  return { userId: session.userId };
}

export function deleteSession(token) {
  sessions.delete(token);
}

export async function authenticateUser(email, password) {
  const user = await storage.getUserByEmail(email);
  if (!user) return null;
  
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;
  
  return user;
}

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.session;
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  
  const user = await storage.getUser(session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  req.user = user;
  next();
}
