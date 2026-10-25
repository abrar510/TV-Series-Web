import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Database as SqlJsDatabase } from 'sql.js';
import { queryOne, queryAll, execute } from './db.js';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function checkRateLimit(db: SqlJsDatabase, ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSec?: number } {
  const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  // Clear older attempts
  execute(db, "DELETE FROM login_attempts WHERE attempt_time < ?", [cutoff]);

  const attempts = queryAll<{ id: string; attempt_time: string }>(
    db,
    "SELECT id, attempt_time FROM login_attempts WHERE ip_address = ? AND attempt_time >= ? ORDER BY attempt_time DESC",
    [ip, cutoff]
  );

  if (attempts.length >= MAX_LOGIN_ATTEMPTS) {
    const oldest = new Date(attempts[attempts.length - 1].attempt_time).getTime();
    const retryAfterSec = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - Date.now()) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSec: Math.max(1, retryAfterSec) };
  }

  return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts.length };
}

export function recordFailedAttempt(db: SqlJsDatabase, ip: string): void {
  execute(db, "INSERT INTO login_attempts (id, ip_address, attempt_time) VALUES (?, ?, ?)", [
    generateId('att'),
    ip,
    new Date().toISOString()
  ]);
}

export function clearFailedAttempts(db: SqlJsDatabase, ip: string): void {
  execute(db, "DELETE FROM login_attempts WHERE ip_address = ?", [ip]);
}

export function createSession(db: SqlJsDatabase, adminId: string, ip?: string, userAgent?: string): string {
  const token = generateSessionToken();
  const id = generateId('sess');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS).toISOString();

  execute(
    db,
    "INSERT INTO admin_sessions (id, admin_id, token, ip_address, user_agent, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, adminId, token, ip || null, userAgent || null, expiresAt, now.toISOString()]
  );

  return token;
}

export function validateSession(db: SqlJsDatabase, token: string): AdminUser | null {
  if (!token) return null;
  const now = new Date().toISOString();

  const session = queryOne<{ admin_id: string; expires_at: string; email: string; display_name: string; role: string }>(
    db,
    `SELECT s.admin_id, s.expires_at, a.email, a.display_name, a.role
     FROM admin_sessions s
     JOIN admins a ON s.admin_id = a.id
     WHERE s.token = ? AND s.expires_at > ?`,
    [token, now]
  );

  if (!session) return null;

  return {
    id: session.admin_id,
    email: session.email,
    display_name: session.display_name,
    role: session.role
  };
}

export function deleteSession(db: SqlJsDatabase, token: string): void {
  if (!token) return;
  execute(db, "DELETE FROM admin_sessions WHERE token = ?", [token]);
}

export function countAdmins(db: SqlJsDatabase): number {
  const res = queryOne<{ count: number }>(db, "SELECT COUNT(*) as count FROM admins");
  return res ? res.count : 0;
}
