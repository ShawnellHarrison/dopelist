# Stripe Payment Setup for Post Creation

## The Problem
When users create a post and pay, they get stuck on Stripe's page and never return to your app.

## The Solution (Choose One)

### ✅ OPTION 1: Stripe Price ID (RECOMMENDED)

This method automatically redirects users back to your app after payment.

#### Steps:

1. **Go to Stripe Products**
   - Visit: https://dashboard.stripe.com/products
   - Click "+ Add product"

2. **Create the Product**
   - Name: "Post Listing - 7 Days"
   - Description: "7-day classified listing"
   - Pricing: One-time payment
   - Price: $1.00 USD

3. **Copy the Price ID**
   - After creating, you'll see a Price ID (starts with `price_`)
   - Example: `price_1AbCdEfGhIjKlMnO`

4. **Add to .env**
   ```
   VITE_STRIPE_POST_PRICE_ID=price_YOUR_ACTUAL_PRICE_ID
   ```

5. **Done!** The app will now automatically redirect users back after payment.

---

### OPTION 2: Payment Link (FALLBACK)

Only use this if you can't use Option 1.

#### Steps:

1. **Access Stripe Payment Links**
   - Visit: https://dashboard.stripe.com/payment-links

2. **Edit Your Payment Link**
   - Find: `https://buy.stripe.com/4gM9AT2mP7MgggogGS8bS0n`
   - Click to edit

3. **Configure Success URL**
   - Set "After payment" URL to: `https://YOUR_DOMAIN/success`
   - Example: `https://myapp.bolt.new/success`

4. **Save Changes**

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
