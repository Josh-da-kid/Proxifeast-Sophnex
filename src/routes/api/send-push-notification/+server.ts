import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { canAdminAccessRestaurant } from '$lib/server/restaurantAccess';
import { isPushConfigured, sendPushNotificationToUser } from '$lib/server/push';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const { userId, title, body, data, tag, restaurantId } = await request.json();

		if (!userId || !title || !body) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		if (!isPushConfigured()) {
			return json(
				{ success: false, error: 'Push notifications are not configured' },
				{ status: 500 }
			);
		}

		if (!restaurantId) {
			return json({ success: false, error: 'Missing restaurantId' }, { status: 400 });
		}

		if (!(await canAdminAccessRestaurant(locals.pb, locals.user, restaurantId))) {
			return json({ success: false, error: 'Forbidden' }, { status: 403 });
		}

		const result = await sendPushNotificationToUser(locals.pb, userId, { title, body, data, tag });

		return json({
			success: result.sent > 0,
			sent: result.sent,
			failed: result.failed,
			errors: result.errors.length > 0 ? result.errors : undefined
		});
	} catch (error: any) {
		console.error('[Push API] Send notification error:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
