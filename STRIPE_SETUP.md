# Stripe Payment Setup for Post Creation

## Current Issue
The Stripe Payment Link needs to be configured to redirect back to your application after successful payment.

## Steps to Fix

### 1. Access Your Stripe Payment Link
Go to your Stripe Dashboard:
- https://dashboard.stripe.com/payment-links

### 2. Edit Your Existing Payment Link
Find the payment link: `https://buy.stripe.com/4gM9AT2mP7MgggogGS8bS0n`

Click on it to edit the settings.

### 3. Configure the Success URL
**CRITICAL:** Set the "After payment" success URL to:
```
https://YOUR_APP_DOMAIN/success
```

Examples:
- If your app is at `https://myapp.bolt.new`, use: `https://myapp.bolt.new/success`
- If testing locally at `http://localhost:5173`, use: `http://localhost:5173/success`

### 4. Save Changes
Save the payment link configuration.

## How It Works

1. User fills out post form → data saved to browser localStorage
2. User clicks "Post for $1" → redirects to Stripe Payment Link
3. User completes payment on Stripe
4. Stripe redirects to `/success` page (configured in step 3)
5. Success page reads localStorage and creates the post in database
6. User is redirected to home page to see their live post

## Testing the Flow

1. Fill out the post creation form with all required fields:
   - City ✓
   - Category ✓
   - Title ✓
   - Description ✓

2. Click "Post for $1 (7 days)"

3. You should be redirected to Stripe payment page

4. Complete test payment (use test card: `4242 4242 4242 4242`)

5. After payment, you should be redirected back to `/success`

6. Your post should be created and you'll be redirected to home page

## Troubleshooting

### Not redirecting to Stripe?
- Check browser console for errors
- Ensure all required form fields are filled
- Check that `VITE_STRIPE_PAYMENT_LINK` is set in `.env`

### Redirected to Stripe but not back after payment?
- **This is the main issue** - configure the success URL in Stripe Dashboard (step 3 above)

### Post not created after payment?
- Check browser console on `/success` page for errors
- Ensure localStorage has `pendingPost` data
- Check database permissions (RLS policies)
