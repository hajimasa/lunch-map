import { Hono } from 'hono';
import { z } from 'zod';

type Bindings = {
  GOOGLE_MAPS_API_KEY: string;
};

export const placesRoutes = new Hono<{ Bindings: Bindings }>();

const nearbySearchSchema = z.object({
  lat: z.string().transform((val) => parseFloat(val)),
  lng: z.string().transform((val) => parseFloat(val)),
  radius: z.string().optional().transform((val) => val ? parseInt(val) : 1000),
  open_now: z.string().optional().transform((val) => val === 'true'),
});

placesRoutes.get('/nearby', async (c) => {
  const query = c.req.query();
  
  try {
    const { lat, lng, radius, open_now } = nearbySearchSchema.parse(query);
    
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    searchUrl.searchParams.set('location', `${lat},${lng}`);
    searchUrl.searchParams.set('radius', radius.toString());
    searchUrl.searchParams.set('type', 'restaurant');
    searchUrl.searchParams.set('key', c.env.GOOGLE_MAPS_API_KEY);
    
    if (open_now) {
      searchUrl.searchParams.set('opennow', 'true');
    }

    const response = await fetch(searchUrl.toString());
    const data: any = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return c.json({ error: 'Failed to fetch places' }, 500);
    }

    return c.json({
      results: data.results || [],
      status: data.status
    });
  } catch (error) {
    console.error('Nearby search error:', error);
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

placesRoutes.get('/details/:placeId', async (c) => {
  const placeId = c.req.param('placeId');
  
  try {
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.set('place_id', placeId);
    detailsUrl.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,opening_hours,rating,price_level,photos,geometry');
    detailsUrl.searchParams.set('key', c.env.GOOGLE_MAPS_API_KEY);

    const response = await fetch(detailsUrl.toString());
    const data: any = await response.json();

    if (data.status !== 'OK') {
      return c.json({ error: 'Place not found' }, 404);
    }

    return c.json(data.result);
  } catch (error) {
    console.error('Place details error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});