import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { generateId } from '../utils/id';
import type { RegisterInput, LoginInput } from '../utils/validation';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export class AuthService {
  async register(input: RegisterInput) {
    // Check if email exists
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.email, input.email.toLowerCase()),
    });
    
    if (existing) {
      throw new Error('Email already registered');
    }
    
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const now = new Date();
    
    const user = {
      id: generateId(),
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      timezone: input.preferences?.timezone || 'UTC',
      weekStartDay: input.preferences?.weekStartDay || 'monday',
      units: input.preferences?.units || 'metric',
      language: input.preferences?.language || 'en',
      createdAt: now,
      updatedAt: now,
    };
    
    await db.insert(schema.users).values(user);
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
  
  async login(input: LoginInput) {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, input.email.toLowerCase()),
    });
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    
    if (!validPassword) {
      throw new Error('Invalid email or password');
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
  
  async createRefreshToken(userId: string): Promise<string> {
    const token = generateId();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    await db.insert(schema.refreshTokens).values({
      id: generateId(),
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    });
    
    return token;
  }
  
  async validateRefreshToken(token: string) {
    const refreshToken = await db.query.refreshTokens.findFirst({
      where: eq(schema.refreshTokens.token, token),
    });
    
    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }
    
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, refreshToken.userId),
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
  
  async revokeRefreshToken(token: string) {
    await db.delete(schema.refreshTokens)
      .where(eq(schema.refreshTokens.token, token));
  }
  
  async getUserById(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      preferences: {
        timezone: user.timezone,
        weekStartDay: user.weekStartDay,
        units: user.units,
        language: user.language,
      },
    };
  }
}

export const authService = new AuthService();
