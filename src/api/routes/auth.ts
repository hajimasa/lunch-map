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
  const client_id = c.env.GOOGLE_CLIENT_ID;
  const client_secret = c.env.GOOGLE_CLIENT_SECRET;
  const redirect_uri = `${new URL(c.req.url).origin}/api/auth/callback`;
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', client_id);
  authUrl.searchParams.set('redirect_uri', redirect_uri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  
  return c.redirect(authUrl.toString());
});

authRoutes.get('/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) {
    return c.json({ error: 'Authorization code missing' }, 400);
  }

  try {
    const client_id = c.env.GOOGLE_CLIENT_ID;
    const client_secret = c.env.GOOGLE_CLIENT_SECRET;
    const redirect_uri = `${new URL(c.req.url).origin}/api/auth/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json() as any;
    
    if (!tokenData.access_token) {
      return c.json({ error: 'Failed to get access token' }, 401);
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userInfo = await userResponse.json() as any;

    let dbUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE google_id = ?'
    ).bind(userInfo.id).first<User>();

    if (!dbUser) {
      const result = await c.env.DB.prepare(`
        INSERT INTO users (google_id, email, name, avatar_url)
        VALUES (?, ?, ?, ?)
        RETURNING *
      `).bind(
        userInfo.id,
        userInfo.email,
        userInfo.name,
        userInfo.picture
      ).first<User>();
      
      dbUser = result;
    } else {
      await c.env.DB.prepare(`
        UPDATE users 
        SET email = ?, name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE google_id = ?
      `).bind(
        userInfo.email,
        userInfo.name,
        userInfo.picture,
        userInfo.id
      ).run();
    }

    if (!dbUser) {
      return c.json({ error: 'Failed to create user' }, 500);
    }

    const jwtToken = await sign(
      { sub: dbUser.id, email: dbUser.email },
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