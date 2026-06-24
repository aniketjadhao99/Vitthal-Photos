# Razorpay Integration Debugging Guide

## Current Status
- **Issue**: Razorpay modal not displaying for Card/UPI payments
- **Symptom**: 400 errors when submitting orders with `paymentId: null`
- **Root Cause**: Unknown - need to test on live site and observe console logs

## What Changed in This Update

### 1. **Enhanced Frontend Logging**
All console messages now include structured prefixes like `[Script Check]`, `[Order Creation]`, `[Modal]`, `[Verification]`, and `[Order Submission]` to help identify exactly where the flow breaks.

### 2. **Security Checks**
Added strict validation that:
- Card/UPI orders cannot be created without `paymentId`
- Only COD can proceed without payment verification
- Razorpay orders must have valid `paymentId` before submission
- Payment method must be selected before form submission

### 3. **Error Handling**
Every major step now:
- Has early returns if errors occur
- Logs full error details and stack traces
- Prevents fallthrough to subsequent steps
- Shows user-friendly error messages

## Testing Instructions

### Step 1: Deploy Frontend Changes
Since the live site at `https://vitthalphotos.com` is running old code, you need to:
```bash
# Build frontend
cd frontend
npm run build

# Deploy the dist/ folder to production server
# (exact steps depend on your hosting provider)
```

### Step 2: Test Payment Flow
1. Open https://vitthalphotos.com in browser
2. Open **DevTools Console** (F12)
3. Add a product to cart and go to checkout
4. Fill in all required billing details
5. **Select UPI or Card payment method**
6. Click "Place Order"
7. **Watch the console logs**

### Step 3: Identify Failure Point
Look for these log messages in order:
```
[Script Check] Razorpay confirmed ready
[Order Creation] Creating Razorpay order...
[Order Creation] Response received
[Order Creation] Razorpay order created successfully
[Modal] Creating Razorpay instance...
[Modal] Razorpay instance created
[Modal] Opening payment modal...
✅ [Modal] Modal opened
```

If the logs STOP at any point, that's where the issue is:

| Stopping Point | Issue | Solution |
|---|---|---|
| Before `[Script Check]` | Razorpay script not loading | Clear cache, reload page, check CDN |
| At `[Script Check]` | `window.Razorpay` undefined after 2 seconds | Script loading timeout, check network tab |
| At `[Order Creation]` | Backend endpoint failing | Check error details in console |
| At `[Modal]` | Error creating Razorpay instance | Log will show error message |
| At Modal open | Unknown issue | Very rare, check Razorpay docs |

### Step 4: Check Network Tab
1. Open DevTools → **Network** tab
2. Filter by `Fetch/XHR`
3. Look for:
   - **POST to `/payment/create-order`** - Should get 200 with orderId and key
   - **Scripts** - Should see `checkout.razorpay.com/v1/checkout.js` loading

If `/payment/create-order` returns 400/500:
- Check the Response tab for error details
- Verify backend is running latest code
- Check `.env` has valid `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

## Log Messages Explained

### Success Flow Logs
```
✅ [Script Check] Razorpay confirmed ready on attempt X
📤 [Order Creation] Creating Razorpay order...
✅ [Order Creation] Razorpay order created successfully: ORD_xxx
💳 [Modal Setup] Payment method: upi
🎯 [Modal] Creating Razorpay instance...
✅ [Modal] Razorpay instance created
🚀 [Modal] Opening payment modal...
✅ [Modal] Modal opened
```

### Error Flow Logs
```
❌ [Script Check] Razorpay payment script is not available
❌ [Order Creation] Server error: ...
🚫 [Security Check] SECURITY BLOCK: ...
❌ [Modal] Failed to open payment modal: ...
❌ [Order Submission] SERVER REJECTED ORDER
```

## Critical Checks

### 1. **Razorpay Script Loading**
In console, type:
```javascript
window.Razorpay
```
Should return the Razorpay constructor function, not `undefined`.

If undefined:
- Check HTML includes: `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`
- Clear browser cache (Ctrl+Shift+Delete)
- Try incognito window
- Check Network tab for 404 errors on script

### 2. **Environment Variables**
Backend `.env` file must have:
```
RAZORPAY_KEY_ID=rzp_test_T577krxJ8yuzny
RAZORPAY_KEY_SECRET=1v4HU2f3PGS2Uisvg4nsml5d
```
Without these, `/payment/create-order` will fail.

### 3. **API URL Configuration**
In `frontend/src/pages/Checkout.jsx`, check:
```javascript
const API_URL = 'your-backend-url'; // Should point to correct backend
```

### 4. **Backend Running with Latest Code**
If testing locally:
```bash
# Kill old server (if running)
taskkill /F /IM node.exe

# Start fresh with latest code
node server.js
```

## Next Steps If Still Failing

1. **Check console logs systematically** - Reply with the exact log output
2. **Check Network tab** - Reply with request/response details
3. **Verify environment variables** - Confirm `.env` is correct
4. **Test on different browser** - Try Chrome, Firefox, or Edge
5. **Test with different products** - See if it's product-specific
6. **Disable ad blockers** - Sometimes they block payment scripts

## Expected Behavior After Fix

### For COD (Cash on Delivery)
- No modal appears
- Order submitted directly
- Success page shows immediately

### For Card/UPI (Razorpay)
- Razorpay modal appears
- User completes payment in modal
- Modal closes after payment
- Order created with verified `paymentId`
- Success page shows with Razorpay order details

## Files Modified in This Update
- `frontend/src/pages/Checkout.jsx` - Enhanced logging and error handling
- `routes/orderRoutes.js` - Validation to block unpaid orders (from previous commit)

## Important Security Note
✅ The backend now correctly blocks any non-COD orders without verified payment.
This prevents users from bypassing payment.

The frontend now ensures Razorpay modal opens BEFORE attempting order submission.
