import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { User } from '../../types';

type Bindings = {
  JWT_SECRET: string;
  DB: D1Database;
};

export const userRoutes = new Hono<{ Bindings: Bindings }>();

userRoutes.use('*', jwt({ secret: (c) => c.env.JWT_SECRET }));

userRoutes.get('/profile', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;

  try {
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ?'
    ).bind(userId).first<User>();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const reviewCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM reviews WHERE user_id = ?'
    ).bind(userId).first<{ count: number }>();

    return c.json({
      ...user,
      review_count: reviewCount?.count || 0
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

userRoutes.get('/reviews', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;

  try {
    const reviews = await c.env.DB.prepare(`
      SELECT r.*, ri.image_url
      FROM reviews r
      LEFT JOIN review_images ri ON r.id = ri.review_id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).bind(userId).all();

    const groupedReviews = reviews.results.reduce((acc: any, row: any) => {
      const reviewId = row.id;
      if (!acc[reviewId]) {
        acc[reviewId] = {
          id: row.id,
          place_id: row.place_id,
          rating: row.rating,
          comment: row.comment,
          created_at: row.created_at,
          updated_at: row.updated_at,
          images: []
        };
      }
      if (row.image_url) {
        acc[reviewId].images.push({ image_url: row.image_url });
      }
      return acc;
    }, {});

    return c.json(Object.values(groupedReviews));
  } catch (error) {
    console.error('Get user reviews error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});