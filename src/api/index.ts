import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { placesRoutes } from './routes/places';
import { reviewsRoutes } from './routes/reviews';

type Bindings = {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  GOOGLE_MAPS_API_KEY: string;
  DB: D1Database;
  R2_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: ['http://localhost:5173', 'https://your-app-domain.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.route('/api/auth', authRoutes);
app.route('/api/user', userRoutes);
app.route('/api/places', placesRoutes);
app.route('/api/reviews', reviewsRoutes);

// SPAのルートファイル配信
app.get('/', serveStatic({ path: './index.html', manifest: {} }));

// その他の静的ファイル
app.get('*', serveStatic({ manifest: {} }));

export default app;