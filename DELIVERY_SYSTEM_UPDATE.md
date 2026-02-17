# Delivery System Schema Update Guide

## Overview

The delivery system has been updated with:

1. **State-based location restrictions** - Customers can only order from restaurants in the same state
2. **Tiered delivery fee calculation** - Glovo/Bolt style pricing based on distance tiers
3. **Service fee** - Platform maintenance fee per order
4. **Small order fee** - Fee for orders below minimum threshold

---

## Required Database Changes

### 1. Restaurants Collection

Add these fields to the `restaurants` collection:

| Field               | Type   | Default   | Description                                                |
| ------------------- | ------ | --------- | ---------------------------------------------------------- |
| `state`             | Text   | -         | Restaurant's state (e.g., "Cross River", "Abuja", "Lagos") |
| `maxDeliveryRadius` | Number | 15        | Maximum delivery distance in km                            |
| `serviceFee`        | Number | 50        | Platform service fee per order (₦)                         |
| `minOrderValue`     | Number | 2000      | Minimum order value before small order fee                 |
| `smallOrderFee`     | Number | 300       | Fee for orders below minOrderValue (₦)                     |
| `deliveryTiers`     | JSON   | See below | Custom delivery tier configuration                         |

#### Delivery Tiers Configuration (JSON)

Default structure (you can customize per restaurant):

```json
[
	{ "maxKm": 2, "baseFee": 200, "perKmRate": 0 },
	{ "maxKm": 5, "baseFee": 200, "perKmRate": 50 },
	{ "maxKm": 10, "baseFee": 350, "perKmRate": 40 },
	{ "maxKm": 15, "baseFee": 550, "perKmRate": 30 }
]
```

**How it works:**

- **0-2km**: ₦200 flat fee
- **2-5km**: ₦200 + ₦50 per km after 2km
- **5-10km**: ₦350 base + ₦40 per km after 5km
- **10-15km**: ₦550 base + ₦30 per km after 10km
- **15km+**: Not deliverable

---

### 2. Orders Collection

Update the `orders` collection to include detailed fee breakdown:

| Field              | Type   | Description                               |
| ------------------ | ------ | ----------------------------------------- |
| `deliveryFee`      | Number | Delivery fee amount                       |
| `serviceFee`       | Number | Platform service fee                      |
| `smallOrderFee`    | Number | Small order surcharge (if applicable)     |
| `deliveryDistance` | Number | Distance in km                            |
| `deliveryTier`     | Text   | Which tier was used (e.g., "5km", "10km") |
| `customerState`    | Text   | Customer's detected state                 |
| `restaurantState`  | Text   | Restaurant's state                        |

---

## Setup Instructions

### Step 1: Add Fields to Restaurants

1. Go to PocketBase Admin
2. Select `restaurants` collection
3. Add fields:
   - `state` (Text) - Required for state validation
   - `maxDeliveryRadius` (Number) - Default: 15
   - `serviceFee` (Number) - Default: 50
   - `minOrderValue` (Number) - Default: 2000
   - `smallOrderFee` (Number) - Default: 300
   - `deliveryTiers` (JSON) - Optional, uses defaults if not set

### Step 2: Populate Restaurant States

For each restaurant, set the `state` field:

| Restaurant     | State          |
| -------------- | -------------- |
| Proxifeast     | Cross River    |
| zhangaFoods    | Cross River    |
| proxifeastt    | Cross River    |
| ONYI's Kitchen | FCT (or Abuja) |

### Step 3: Test the System

1. Add items from a Calabar restaurant to cart
2. Enter a Calabar address
3. Click "Calculate Delivery Fees"
4. Verify fees are calculated correctly
5. Try entering an Abuja address - should show error

---

## How Location Validation Works

### State Extraction

The system extracts state from customer addresses using these patterns:

- Direct state names ("Cross River", "Lagos", "Abuja")
- City names ("Calabar" → "Cross River")
- Common abbreviations ("FCT" → "FCT")

### Validation Flow

1. Customer enters delivery address
2. System extracts state from address
3. System compares with restaurant's state
4. If different → "Cannot deliver to this location"
5. If same → Calculate distance and fees

### Example Scenarios

**✅ Allowed:**

- Customer: "Marina Resort, Calabar" (Cross River)
- Restaurant: Proxifeast (Cross River)
- Result: Delivery calculated

**❌ Blocked:**

- Customer: "17 Lugbe Street, Abuja" (FCT)
- Restaurant: Proxifeast (Cross River)
- Result: "This restaurant only delivers within Cross River"

---

## Fee Calculation Examples

### Example 1: Short Distance (3km)

- Distance: 3km
- Tier: 2-5km
- Delivery: ₦200 + (1km × ₦50) = ₦250
- Service: ₦50
- Small Order: ₦0 (if order ≥ ₦2000)
- **Total Fees: ₦300**

### Example 2: Medium Distance (7km)

- Distance: 7km
- Tier: 5-10km
- Delivery: ₦350 + (2km × ₦40) = ₦430
- Service: ₦50
- Small Order: ₦0
- **Total Fees: ₦480**

### Example 3: Long Distance (12km)

- Distance: 12km
- Tier: 10-15km
- Delivery: ₦550 + (2km × ₦30) = ₦610
- Service: ₦50
- Small Order: ₦0
- **Total Fees: ₦660**

### Example 4: Small Order (₦1500 subtotal)

- Distance: 3km
- Delivery: ₦250
- Service: ₦50
- Small Order: ₦300 (below ₦2000 minimum)
- **Total Fees: ₦600**

---

## Customization

### Changing Delivery Tiers

Edit the `deliveryTiers` JSON in a restaurant record:

```json
[
	{ "maxKm": 3, "baseFee": 250, "perKmRate": 0 },
	{ "maxKm": 7, "baseFee": 250, "perKmRate": 60 },
	{ "maxKm": 12, "baseFee": 490, "perKmRate": 50 }
]
```

### Changing Fees

Update fields directly in PocketBase:

- `serviceFee`: Change platform fee
- `minOrderValue`: Change minimum order threshold
- `smallOrderFee`: Change small order surcharge
- `maxDeliveryRadius`: Change maximum distance

---

## Troubleshooting

### "Cannot extract state from address"

- Make sure address includes city or state name
- Examples: "Marina Resort, Calabar" or "17 Murtala Mohammed Highway, Cross River"

### "This restaurant only delivers within [State]"

- Customer and restaurant are in different states
- Remove items from out-of-state restaurants
- Or customer should enter address in the restaurant's state

### All fees showing ₦0

- Check that restaurant has latitude/longitude set
- Check that ORS_API_KEY is configured in .env
- Check browser console for API errors

---

## Files Modified

1. `/src/routes/api/delivery-fee/+server.ts` - Updated with tiered pricing and state validation
2. `/src/routes/checkout/+page.svelte` - Updated UI to show detailed fee breakdown
3. `/src/routes/api/save-order/+server.ts` - Saves detailed fee information

---

## Next Steps

1. Add the required fields to PocketBase
2. Set the `state` field for each restaurant
3. Test with different addresses
4. Adjust pricing tiers as needed per restaurant
5. Monitor delivery calculations and adjust if needed
