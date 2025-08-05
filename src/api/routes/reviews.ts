import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { z } from 'zod';

type Bindings = {
  JWT_SECRET: string;
  DB: D1Database;
  R2_BUCKET: R2Bucket;
};

export const reviewsRoutes = new Hono<{ Bindings: Bindings }>();

const reviewSchema = z.object({
  place_id: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

reviewsRoutes.get('/places/:placeId', async (c) => {
  const placeId = c.req.param('placeId');

  try {
    const reviews = await c.env.DB.prepare(`
      SELECT r.*, u.name as user_name, u.avatar_url,
             GROUP_CONCAT(ri.image_url) as image_urls
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN review_images ri ON r.id = ri.review_id
      WHERE r.place_id = ?
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `).bind(placeId).all();

    const formattedReviews = reviews.results.map((review: any) => ({
      ...review,
      images: review.image_urls ? review.image_urls.split(',').map((url: string) => ({ image_url: url })) : []
    }));

    return c.json(formattedReviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

reviewsRoutes.use('*', jwt({ secret: 'placeholder' }));

reviewsRoutes.post('/', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;

  try {
    const body = await c.req.json();
    const { place_id, rating, comment } = reviewSchema.parse(body);

    const existingReview = await c.env.DB.prepare(
      'SELECT id FROM reviews WHERE user_id = ? AND place_id = ?'
    ).bind(userId, place_id).first();

    if (existingReview) {
      return c.json({ error: 'Review already exists for this place' }, 409);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO reviews (user_id, place_id, rating, comment)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `).bind(userId, place_id, rating, comment || null).first();

    return c.json(result, 201);
  } catch (error) {
    console.error('Create review error:', error);
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

reviewsRoutes.put('/:id', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const reviewId = c.req.param('id');

  try {
    const body = await c.req.json();
    const { rating, comment } = z.object({
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    }).parse(body);

    const review = await c.env.DB.prepare(
      'SELECT user_id FROM reviews WHERE id = ?'
    ).bind(reviewId).first<{ user_id: string }>();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    if (review.user_id !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const result = await c.env.DB.prepare(`
      UPDATE reviews 
      SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `).bind(rating, comment || null, reviewId).first();

    return c.json(result);
  } catch (error) {
    console.error('Update review error:', error);
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

reviewsRoutes.delete('/:id', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const reviewId = c.req.param('id');

  try {
    const review = await c.env.DB.prepare(
      'SELECT user_id FROM reviews WHERE id = ?'
    ).bind(reviewId).first<{ user_id: string }>();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    if (review.user_id !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    await c.env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(reviewId).run();

    return c.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

reviewsRoutes.post('/:id/images', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const reviewId = c.req.param('id');

  try {
    const review = await c.env.DB.prepare(
      'SELECT user_id FROM reviews WHERE id = ?'
    ).bind(reviewId).first<{ user_id: string }>();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    if (review.user_id !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const formData = await c.req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return c.json({ error: 'No image file provided' }, 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File size too large (max 5MB)' }, 400);
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type' }, 400);
    }

    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const key = `review-images/${reviewId}/${fileName}`;

    await c.env.R2_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const imageUrl = `https://your-r2-domain.com/${key}`;

    const result = await c.env.DB.prepare(`
      INSERT INTO review_images (review_id, image_url, filename)
      VALUES (?, ?, ?)
      RETURNING *
    `).bind(reviewId, imageUrl, fileName).first();

    return c.json(result, 201);
  } catch (error) {
    console.error('Upload image error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});