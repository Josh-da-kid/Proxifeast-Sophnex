# Delivery Fee System Setup Guide

## Overview

I've implemented a complete delivery fee calculation system that:

- Calculates delivery fees per restaurant based on distance
- Charges separate delivery fees for orders from multiple restaurants
- Sends email notifications to each restaurant when orders are placed
- Shows restaurant tags in order history

---

## Step 1: Update PocketBase Schema

You need to add these fields to your PocketBase collections:

### 1.1 Restaurants Collection

Add these fields to the `restaurants` collection:

| Field              | Type   | Required | Default Value | Description                                          |
| ------------------ | ------ | -------- | ------------- | ---------------------------------------------------- |
| `latitude`         | Number | No       | -             | Restaurant's latitude (e.g., 9.0765)                 |
| `longitude`        | Number | No       | -             | Restaurant's longitude (e.g., 7.3986)                |
| `deliveryFeePerKm` | Number | No       | 130           | Delivery fee per kilometer (e.g., 130 for ₦130/km)   |
| `minDeliveryFee`   | Number | No       | 200           | Minimum delivery fee regardless of distance          |
| `email`            | Email  | No       | -             | Restaurant's notification email address              |
| `restaurantEmail`  | Email  | No       | -             | Alternative email field (for backward compatibility) |

**How to get coordinates:**

1. Go to Google Maps
2. Search for the restaurant's address
3. Right-click on the location
4. Select the coordinates (e.g., 9.0765, 7.3986)
5. **Important:** Store as:
   - `latitude`: 9.0765 (first number)
   - `longitude`: 7.3986 (second number)

### 1.2 Orders Collection

Add/update these fields in the `orders` collection:

| Field                    | Type                   | Description                                          |
| ------------------------ | ---------------------- | ---------------------------------------------------- |
| `deliveryFee`            | Number                 | Delivery fee amount for this order                   |
| `deliveryDistance`       | Number                 | Distance in kilometers                               |
| `foodTotal`              | Number                 | Subtotal for food items only                         |
| `restaurantId`           | Relation → restaurants | Reference to the restaurant                          |
| `restaurantName`         | Text                   | Name of the restaurant (for display)                 |
| `mainReference`          | Text                   | Main payment reference (for multi-restaurant orders) |
| `isMultiRestaurantOrder` | Bool                   | Whether this is part of a multi-restaurant order     |
| `totalRestaurants`       | Number                 | Total number of restaurants in this order            |

---

## Step 2: Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
# OpenRouteService API Key (for distance calculation)
VITE_ORS_API_KEY=your_openrouteservice_api_key

# Brevo (Sendinblue) Email Configuration
VITE_BREVO_LOGIN=your_brevo_email@example.com
VITE_BREVO_SMTP_KEY=your_brevo_smtp_key
```

### Getting an OpenRouteService API Key:

1. Go to https://openrouteservice.org/
2. Sign up for a free account
3. Go to Dashboard → API Keys
4. Generate a new key
5. Copy and paste it into your `.env` file

---

## Step 3: How It Works

### For Customers:

1. **Single Restaurant Order:**

   - Customer adds items from one restaurant to cart
   - Selects "Home Delivery" and enters address
   - Clicks "Calculate Delivery Fees" button
   - System calculates distance and fee
   - Fee is added to total and displayed

2. **Multi-Restaurant Order:**
   - Customer adds items from multiple restaurants
   - Each restaurant's delivery fee is calculated separately
   - Customer sees breakdown:
     ```
     Restaurant A: ₦500 (4.2km)
     Restaurant B: ₦700 (5.8km)
     ─────────────────────
     Total Delivery: ₦1,200
     ```
   - One payment creates separate orders for each restaurant

### For Restaurants:

1. **Order Notifications:**

   - When a customer pays, each restaurant receives an email with:
     - Order details and items
     - Customer contact information
     - Delivery address and distance
     - Delivery fee amount
     - Total amount
   - For multi-restaurant orders, email notes this is part of a split order

2. **Admin Dashboard:**
   - Shows which restaurant each order belongs to
   - Displays delivery fee and distance
   - Shows food subtotal vs. total

---

## Step 4: Testing

### Test the delivery fee calculation:

1. Add a restaurant with latitude/longitude to PocketBase
2. Add items to cart from that restaurant
3. Go to checkout
4. Select "Home Delivery"
5. Enter a valid address
6. Click "Calculate Delivery Fees"
7. Verify the fee is calculated correctly

### Test multi-restaurant orders:

1. Add items from two different restaurants
2. Checkout with home delivery
3. Verify both delivery fees are calculated
4. Complete payment
5. Check that separate orders are created
6. Verify both restaurants receive email notifications

### Test restaurant notifications:

1. Add an email address to a restaurant in PocketBase
2. Place an order for that restaurant
3. Check the restaurant's email for notification

---

## Files Modified

1. `/src/routes/api/delivery-fee/+server.ts` - Updated to use restaurant-specific coordinates and fees
2. `/src/routes/api/save-order/+server.ts` - Creates separate orders per restaurant, sends email notifications
3. `/src/routes/checkout/+page.svelte` - Added per-restaurant delivery fee calculation UI
4. `/src/routes/pending/+page.svelte` - Added restaurant name tags and delivery fee display
5. `/src/routes/history/+page.svelte` - Added restaurant name tags and delivery fee display
6. `/src/routes/admin/admin-order/+page.svelte` - Added restaurant info and delivery details
7. `/src/routes/admin/admin-history/+page.svelte` - Added restaurant info and delivery details

---

## Important Notes

1. **Coordinates Format:** Make sure to store latitude and longitude as numbers (not strings)
2. **Email Notifications:** Restaurants only receive emails if they have an `email` or `restaurantEmail` field set
3. **Delivery Fee Formula:** `Math.max(distance * deliveryFeePerKm, minDeliveryFee)`
4. **Multi-Restaurant Orders:** Each restaurant gets a separate order with a unique reference number
5. **Backward Compatibility:** Orders without the new fields will still work (defaults to 0 for delivery fees)

---

## Troubleshooting

### "Restaurant location not configured" error:

- Check that the restaurant has latitude and longitude set in PocketBase

### Delivery fees not calculating:

- Verify the OpenRouteService API key is set correctly
- Check browser console for API errors
- Ensure the address is valid and complete

### Emails not being sent:

- Check that Brevo credentials are correct
- Verify the restaurant has an email address
- Check server logs for email errors

### Orders not showing in admin:

- Make sure orders have the correct `restaurantId` set
- Check that you're logged in as an admin for the correct restaurant domain
