# Push Notification Setup Guide

## Overview

This guide explains how to set up push notifications for Proxifeast, including:

- Real-time order updates for restaurants
- Real-time order status updates for users
- Push notifications when app is closed
- Browser notifications when app is open

---

## Prerequisites

1. **PocketBase Collection**: `push_subscriptions`
   Add these fields:

   - `user` (Relation → users)
   - `endpoint` (Text)
   - `p256dh` (Text)
   - `auth` (Text)
   - `created` (Date)

2. **Environment Variables**:
   Add to your `.env` file:
   ```
   # VAPID Keys for Push Notifications
   VITE_VAPID_PUBLIC_KEY=your_public_key_here
   VITE_VAPID_PRIVATE_KEY=your_private_key_here
   VITE_VAPID_SUBJECT=mailto:admin@proxifeast.com
   ```

---

## Step 1: Generate VAPID Keys

VAPID keys are required for sending push notifications securely.

### Option A: Using web-push CLI

```bash
# Install web-push globally
npm install -g web-push

# Generate keys
web-push generate-vapid-keys

# Output will look like:
# Public Key: BLBx... (long string)
# Private Key: _kG0... (long string)
```

### Option B: Using Node.js script

```bash
# Create a script file
cat > generate-vapid.js << 'EOF'
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
EOF

# Run it
node generate-vapid.js
```

### Add keys to .env

```
VITE_VAPID_PUBLIC_KEY=BLBxW_8LD5C9q0t4wL00...
VITE_VAPID_PRIVATE_KEY=_kG0StqogAsK7N2K...
VITE_VAPID_SUBJECT=mailto:admin@proxifeast.com
```

---

## Step 2: Update PocketBase Schema

### Create `push_subscriptions` Collection

1. Go to PocketBase Admin → Collections
2. Create new collection: `push_subscriptions`
3. Add fields:

   - `user` (Relation) → Point to `users` collection
   - `endpoint` (Text) - Required
   - `p256dh` (Text) - Required
   - `auth` (Text) - Required
   - `created` (Date) - Default: Current datetime

4. Set API rules:
   - **List/Search**: `@request.auth.id != ""`
   - **View**: `@request.auth.id = user`
   - **Create**: `@request.auth.id != ""`
   - **Update**: `@request.auth.id = user`
   - **Delete**: `@request.auth.id = user`

---

## Step 3: Install Dependencies

```bash
npm install web-push
```

---

## Step 4: How It Works

### For Restaurants (Admin Side)

1. **Real-time Order Updates**:

   - Admin page subscribes to order changes
   - When a new order is placed, it appears instantly
   - Browser notification shows: "New Order!"

2. **Status Updates**:
   - When admin changes order status → User gets push notification
   - Ready → "Your order is ready for pickup/delivery!"
   - Cancelled → "Your order has been cancelled"
   - Delivered → "Your order has been delivered!"

### For Users (Customer Side)

1. **Notification Prompt**:

   - User visits pending orders page
   - Prompt appears to enable notifications
   - User clicks "Enable" → Browser asks for permission

2. **Real-time Updates**:
   - Order status changes appear instantly
   - Push notifications sent even when app is closed
   - Clicking notification opens the app

---

## Step 5: Testing

### Test Push Notifications

1. **Enable Notifications**:

   - Login as user
   - Go to Pending Orders
   - Click "Enable" on notification prompt
   - Allow browser permission

2. **Place Test Order**:

   - Add items to cart
   - Checkout with any payment method
   - Check that order appears in Pending Orders

3. **Test Admin Notification**:

   - Login as admin
   - Go to Admin Orders
   - Place order from user account
   - Should see browser notification on admin side

4. **Test User Notification**:
   - As admin, change order status to "Ready"
   - User should receive push notification
   - Check even when browser is closed/minimized

### Debug Issues

**Notifications not showing?**

- Check browser console for errors
- Verify VAPID keys are set correctly
- Check service worker is registered: `navigator.serviceWorker.ready`
- Check subscription exists in database

**Order updates not appearing?**

- Check PocketBase realtime is enabled
- Check user ID matches in subscription
- Check browser console for subscription errors

---

## API Endpoints

### `POST /api/subscribe-push`

Subscribe a user to push notifications

```json
{
	"userId": "user123",
	"subscription": {
		"endpoint": "https://...",
		"keys": {
			"p256dh": "...",
			"auth": "..."
		}
	}
}
```

### `POST /api/unsubscribe-push`

Unsubscribe a user

```json
{
	"userId": "user123"
}
```

### `POST /api/send-push-notification`

Send notification to user

```json
{
	"userId": "user123",
	"title": "Order Ready",
	"body": "Your order is ready for pickup!",
	"data": { "url": "/pending" },
	"tag": "order-123"
}
```

---

## Troubleshooting

### "Cannot find module 'web-push'"

```bash
npm install web-push
```

### "VAPID keys not set"

- Check `.env` file has all three VAPID variables
- Restart dev server after adding env vars

### "Notification.permission is default"

- User must click "Enable" button
- Browser will show native permission dialog
- User must click "Allow"

### Service Worker not registering

- Check `src/service-worker.ts` exists
- Check browser console for SW registration errors
- Clear browser cache and reload

---

## Security Notes

1. **VAPID Keys**: Keep private key secret! Never commit to git.
2. **User Subscriptions**: Only send to authenticated users
3. **API Rules**: Set proper PocketBase permissions
4. **Payload**: Don't include sensitive data in notifications

---

## Next Steps

1. Add notification settings page
2. Allow users to customize notification preferences
3. Add notification history/log
4. Support rich notifications with images
5. Add notification analytics
