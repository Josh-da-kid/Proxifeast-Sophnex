import type PocketBase from 'pocketbase';

let isProcessingQueue = false;
const cartQueue: Array<() => Promise<any>> = [];

async function processQueue() {
	if (isProcessingQueue || cartQueue.length === 0) return;

	isProcessingQueue = true;

	while (cartQueue.length > 0) {
		const task = cartQueue.shift();
		if (task) {
			try {
				await task();
			} catch (err) {
				console.error('Cart operation error:', err);
			}
		}
	}

	isProcessingQueue = false;
}

export async function addToCartPB(
	pb: PocketBase,
	dishId: string,
	quantity: number = 1,
	userId: string,
	defaultAmount: number,
	promoAmount: number,
	restaurantId: string,
	restaurantName: string
) {
	const unitPrice = promoAmount || defaultAmount;
	const totalAmount = unitPrice * quantity;

	const taskPromise = new Promise<any>((resolve, reject) => {
		const task = async () => {
			let retries = 3;

			while (retries > 0) {
				try {
					// Try to find existing item first
					let existing: any = null;
					try {
						existing = await pb
							.collection('cart')
							.getFirstListItem(
								`user="${userId}" && dish="${dishId}" && restaurantId="${restaurantId}"`
							);
					} catch {
						// No existing item - that's fine, we'll create one
					}

					if (existing) {
						// Update existing cart item
						const updatedQuantity = existing.quantity + quantity;
						const updatedAmount = unitPrice * updatedQuantity;

						await pb.collection('cart').update(existing.id, {
							quantity: updatedQuantity,
							amount: updatedAmount,
							restaurantName
						});
						resolve(true);
						return;
					} else {
						// Try to create new cart item
						try {
							await pb.collection('cart').create({
								dish: dishId,
								quantity,
								amount: totalAmount,
								user: userId,
								restaurantId,
								restaurantName
							});
							resolve(true);
							return;
						} catch (createErr: any) {
							// If duplicate error (400 with "already exists" message), retry the whole flow
							if (createErr.status === 400 && createErr.message?.includes('already exists')) {
								retries--;
								if (retries > 0) {
									// Small delay before retry
									await new Promise((res) => setTimeout(res, 50));
									continue;
								}
							}
							reject(createErr);
							return;
						}
					}
				} catch (err) {
					console.error('Cart operation failed:', err);
					retries--;
					if (retries > 0) {
						await new Promise((res) => setTimeout(res, 50));
					} else {
						reject(err);
						return;
					}
				}
			}
		};

		cartQueue.push(task);
		processQueue();
	});

	return taskPromise;
}
