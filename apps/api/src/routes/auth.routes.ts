import { FastifyPluginAsync } from 'fastify';
import { authService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../utils/validation';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register
  fastify.post('/register', async (request, reply) => {
    try {
      const input = registerSchema.parse(request.body);
      const user = await authService.register(input);
      
      const accessToken = fastify.jwt.sign(
        { sub: user.id, email: user.email },
        { expiresIn: '15m' }
      );
      
      const refreshToken = await authService.createRefreshToken(user.id);
      
      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
      
      return {
        accessToken,
        expiresIn: 900, // 15 minutes
        user,
      };
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });
  
  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const input = loginSchema.parse(request.body);
      const user = await authService.login(input);
      
      const accessToken = fastify.jwt.sign(
        { sub: user.id, email: user.email },
        { expiresIn: '15m' }
      );
      
      const refreshToken = await authService.createRefreshToken(user.id);
      
      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
      
      return {
        accessToken,
        expiresIn: 900,
        user,
      };
    } catch (error: any) {
      reply.status(401).send({ error: error.message });
    }
  });
  
  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    try {
      const refreshToken = request.cookies.refreshToken;
      
      if (!refreshToken) {
        return reply.status(401).send({ error: 'No refresh token' });
      }
      
      const user = await authService.validateRefreshToken(refreshToken);
      
      const accessToken = fastify.jwt.sign(
        { sub: user.id, email: user.email },
        { expiresIn: '15m' }
      );
      
      return {
        accessToken,
        expiresIn: 900,
        user,
      };
    } catch (error: any) {
      reply.status(401).send({ error: error.message });
    }
  });
  
  // Logout
  fastify.post('/logout', async (request, reply) => {
    try {
      const refreshToken = request.cookies.refreshToken;
      
      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken);
      }
      
      reply.clearCookie('refreshToken', { path: '/' });
      
      return { success: true };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });
};
