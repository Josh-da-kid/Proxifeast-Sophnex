// src/routes/admin/billing/+page.server.ts

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import pb from '$lib/pb';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
	const token = cookies.get('admin_token');

	if (!token) {
		throw redirect(303, '/admin-login');
	}

	pb.authStore.save(token, null);

	try {
		const admin = await pb.collection('admins').authRefresh();
		locals.user = admin;
	} catch (err) {
		throw redirect(303, '/admin-login');
	}

	const restaurantId = locals.restaurant?.id;
	const isSuper = locals.restaurant?.isSuper === true;

	if (!restaurantId) {
		throw redirect(303, '/admin-login');
	}

	// Get subscription status for non-super restaurants
	let subscriptionStatus = 'active';
	let subscription: any = null;

	if (!isSuper) {
		try {
			const subs = await pb
				.collection('subscriptions')
				.getFirstListItem(`restaurantId = "${restaurantId}"`);
			subscription = subs;
			const now = new Date();
			const endDate = new Date(subs.endDate);

			if (endDate <= now) {
				subscriptionStatus = 'expired';
			} else if (subs.status === 'cancelled') {
				subscriptionStatus = 'cancelled';
			} else {
				const thirtyDaysFromNow = new Date();
				thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
				if (endDate <= thirtyDaysFromNow) {
					subscriptionStatus = 'expiring_soon';
				}
			}
		} catch (err) {
			subscriptionStatus = 'not_subscribed';
		}
	}

	try {
		const subscriptions = await pb.collection('subscriptions').getFullList({
			sort: '-created'
		});

		const restaurants = await pb.collection('restaurants').getFullList({
			filter: 'isSuper = false'
		});

		const now = new Date();
		const thirtyDaysFromNow = new Date();
		thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

		const activeSubscriptions = subscriptions.filter((s: any) => s.status === 'active');
		const expiringSoon = subscriptions.filter((s: any) => {
			const endDate = new Date(s.endDate);
			return s.status === 'active' && endDate <= thirtyDaysFromNow && endDate > now;
		});
		const expired = subscriptions.filter((s: any) => {
			const endDate = new Date(s.endDate);
			return s.status === 'active' && endDate <= now;
		});

		const totalRevenue = activeSubscriptions.reduce(
			(sum: number, s: any) => sum + (s.amount || 0),
			0
		);
		const monthlyRevenue = activeSubscriptions
			.filter((s: any) => s.plan === 'monthly')
			.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

		return {
			subscriptionStatus,
			subscription,
			isSuper,
			expired: url.searchParams.get('expired') === '1',
			restaurant: isSuper ? null : locals.restaurant,
			subscriptions,
			restaurants,
			stats: {
				total: subscriptions.length,
				active: activeSubscriptions.length,
				expiringSoon: expiringSoon.length,
				expired: expired.length,
				totalRevenue,
				monthlyRevenue
			}
		};
	} catch (err) {
		console.error('Billing load error:', err);
		return {
			subscriptionStatus,
			subscription,
			isSuper,
			expired: false,
			subscriptions: [],
			restaurants: [],
			stats: {
				total: 0,
				active: 0,
				expiringSoon: 0,
				expired: 0,
				totalRevenue: 0,
				monthlyRevenue: 0
			}
		};
	}
};
