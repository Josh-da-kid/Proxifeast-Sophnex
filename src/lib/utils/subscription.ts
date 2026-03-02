export interface Restaurant {
	id: string;
	trialUsed: boolean;
	trialStartDate?: string;
	trialEndDate?: string;
	subscriptionStatus: 'trial' | 'active' | 'expired' | null;
	subscriptionPlan: 'monthly' | 'quarterly' | 'yearly' | null;
	subscriptionExpiry?: string;
}

export function canPerformOperationalActions(restaurant: Restaurant | null): boolean {
	if (!restaurant) return false;

	// If subscription is active, allow operations
	if (restaurant.subscriptionStatus === 'active') return true;

	// If on trial, check if trial hasn't expired
	if (restaurant.subscriptionStatus === 'trial' && restaurant.trialEndDate) {
		const now = new Date();
		const trialEnd = new Date(restaurant.trialEndDate);
		return now < trialEnd;
	}

	// Otherwise, deny operations
	return false;
}

export function getTrialDaysRemaining(restaurant: Restaurant | null): number {
	if (!restaurant || !restaurant.trialEndDate) return 0;

	const now = new Date();
	const trialEnd = new Date(restaurant.trialEndDate);
	const diff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

	return diff > 0 ? diff : 0;
}

export function isSubscriptionLocked(restaurant: Restaurant | null): boolean {
	if (!restaurant) return false;

	// If no subscription status or expired, lock
	if (!restaurant.subscriptionStatus || restaurant.subscriptionStatus === 'expired') return true;

	// If trial, check if expired
	if (restaurant.subscriptionStatus === 'trial' && restaurant.trialEndDate) {
		const now = new Date();
		const trialEnd = new Date(restaurant.trialEndDate);
		return now >= trialEnd;
	}

	return false;
}

export function isInTrial(restaurant: Restaurant | null): boolean {
	if (!restaurant) return false;

	if (restaurant.subscriptionStatus !== 'trial') return false;

	if (!restaurant.trialEndDate) return false;

	const now = new Date();
	const trialEnd = new Date(restaurant.trialEndDate);
	return now < trialEnd;
}

export function formatCurrency(amount: number): string {
	return `₦${amount.toLocaleString()}`;
}

export function calculateSavings(monthlyPrice: number, planPrice: number, months: number): number {
	const monthlyEquivalent = planPrice / months;
	const savings = ((monthlyPrice - monthlyEquivalent) / monthlyPrice) * 100;
	return Math.round(savings);
}
