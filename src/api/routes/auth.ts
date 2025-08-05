import { Hono } from 'hono';
import { googleAuth } from '@hono/oauth-providers/google';
import { sign } from 'hono/jwt';
import { User } from '../../types';

type Bindings = {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  DB: D1Database;
};

export const authRoutes = new Hono<{ Bindings: Bindings }>();

authRoutes.get('/google', async (c) => {
  return googleAuth({
    client_id: c.env.GOOGLE_CLIENT_ID,
    client_secret: c.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: `${new URL(c.req.url).origin}/api/auth/callback`,
    scope: ['openid', 'email', 'profile'],
  })(c);
});

authRoutes.get('/callback', async (c) => {
  const { token } = await googleAuth({
    client_id: c.env.GOOGLE_CLIENT_ID,
    client_secret: c.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: `${new URL(c.req.url).origin}/api/auth/callback`,
    scope: ['openid', 'email', 'profile'],
  })(c);

  if (!token) {
    return c.json({ error: 'Authentication failed' }, 401);
  }

  const userInfo = token.user;
  
  try {
    let user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE google_id = ?'
    ).bind(userInfo.sub).first<User>();

    if (!user) {
      const result = await c.env.DB.prepare(`
        INSERT INTO users (google_id, email, name, avatar_url)
        VALUES (?, ?, ?, ?)
        RETURNING *
      `).bind(
        userInfo.sub,
        userInfo.email,
        userInfo.name,
        userInfo.picture
      ).first<User>();
      
      user = result;
    } else {
      await c.env.DB.prepare(`
        UPDATE users 
        SET email = ?, name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE google_id = ?
      `).bind(
        userInfo.email,
        userInfo.name,
        userInfo.picture,
        userInfo.sub
      ).run();
    }

    if (!user) {
      return c.json({ error: 'Failed to create user' }, 500);
    }

    const jwtToken = await sign(
      { sub: user.id, email: user.email },
      c.env.JWT_SECRET
    );

    const redirectUrl = new URL('/', new URL(c.req.url).origin);
    redirectUrl.searchParams.set('token', jwtToken);
    
    return c.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Auth callback error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

authRoutes.post('/logout', (c) => {
  return c.json({ message: 'Logged out successfully' });
});