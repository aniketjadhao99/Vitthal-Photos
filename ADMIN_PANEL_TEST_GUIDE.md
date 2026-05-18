# Admin Panel - Comprehensive Test Guide

## Issues Fixed

### 1. Database Connection Mismatch ✅
**Issue**: server.js was trying to connect to MongoDB using Mongoose while all routes use PostgreSQL with Prisma.
**Fix**: Removed `connectDB()` call from server.js - Prisma handles all database operations.

### 2. Missing Admin Authentication ✅
**Issue**: Admin endpoints were publicly accessible without authentication.
**Fixed Endpoints**:
- `GET /api/products` - Now requires admin auth
- `POST /api/products` - Now requires admin auth
- `PUT /api/products/:id` - Now requires admin auth
- `DELETE /api/products/:id` - Now requires admin auth
- `GET /api/orders` - Now requires admin auth
- `PUT /api/orders/:id/status` - Now requires admin auth
- `DELETE /api/orders/:id` - Now requires admin auth
- `GET /api/reviews` - Now requires admin auth

### 3. User Role Display Bug ✅
**Issue**: AdminPanel displayed user.role but the field was isAdmin (boolean).
**Fix**: Changed badge display to `badge(u.isAdmin ? 'admin' : 'user')`

### 4. Order Details Modal Data Mapping ✅
**Issues Fixed**:
- Phone number was accessed as `selectedOrder.phone` instead of `selectedOrder.shippingAddress.phone`
- Address fields were not nested under shippingAddress
- Order items used `it.image` instead of `it.product.images[0]`
- Order items used `it.qty` instead of `it.quantity`
- Order items used `it.size` instead of `it.customization.selectedSize`

## How to Test the Admin Panel

### Prerequisites
1. Server must be running on port 5000
2. PostgreSQL database must be configured via DATABASE_URL
3. Admin user must exist in the database

### Step 1: Access Admin Panel
1. Login as admin user (admin role must be true)
2. Navigate to `/admin` or click "Admin Panel" if available
3. You should see the dashboard with 4 cards showing:
   - Total Products count
   - Active Orders count
   - Total Users count
   - Revenue summary

### Step 2: Test Dashboard Tab
Expected: Shows recent orders in a table format with ID, Customer, Total, Status, Date

### Step 3: Test Products Tab
**Create Product**:
1. Click "+ Add New" button
2. Fill in:
   - Name: "Test Product"
   - Category: Select from dropdown
   - Price: 499
   - Stock: 10
   - Description: "Test description"
   - Image: Upload or select image
3. Click "Save"
4. Product should appear in the products list

**Edit Product**:
1. Click "Edit" button on any product
2. Modify details
3. Click "Save"

**Delete Product**:
1. Click "Delete" button
2. Confirm deletion
3. Product should be removed

### Step 4: Test Orders Tab
**View Order Details**:
1. Click "Details" button on any order
2. Modal should show:
   - Customer info (Name, Email, Phone)
   - Shipping address (City, Postal Code)
   - Order items with images, quantities, sizes
   - Total price

**Update Order Status**:
1. Click "Status" button on any order
2. Select new status from dropdown (Pending/Processing/Shipped/Delivered/Cancelled)
3. Click "Save"
4. Status badge should update

**Delete Order**:
1. Click "Delete" button
2. Confirm deletion

### Step 5: Test Users Tab
Expected: Shows list of all users with Name, Email, Role (Admin/User)

**Delete User**:
1. Click "Delete" button on any user
2. User should be removed from the list

### Step 6: Test Reviews Tab
Expected: Shows all reviews with User, Rating, Comment, Date, and Delete option

### Step 7: Test Settings Tab
1. Modify Site Name, Contact Email, or Contact Phone
2. Click "Save Settings"
3. Settings should be updated

### Step 8: Navigation Tests
- Sidebar should toggle on mobile
- "Visit Store" button should navigate to home page
- "Logout" button should clear session and redirect to login
- Tab navigation should load appropriate data

## API Response Validation

### Expected Admin Endpoint Responses

**GET /api/products**
```javascript
{
  "message": "Not authorized as an admin" // If not admin
}
OR
[
  {
    "_id": "uuid",
    "name": "Product Name",
    "basePrice": 499,
    "category": "God",
    "stock": 10,
    "images": ["url"],
    ...
  }
]
```

**POST /api/products**
```javascript
{
  "_id": "uuid",
  "name": "New Product",
  "basePrice": 499,
  ...
}
```

**GET /api/orders**
```javascript
[
  {
    "_id": "uuid",
    "customerName": "John Doe",
    "totalPrice": 1500,
    "status": "pending",
    "shippingAddress": {
      "address": "123 Main St",
      "city": "City",
      "postalCode": "12345",
      "phone": "9876543210"
    },
    "orderItems": [
      {
        "_id": "uuid",
        "name": "Product",
        "quantity": 1,
        "price": 500,
        "customization": {
          "selectedSize": "12x15",
          "selectedColor": "Gold"
        }
      }
    ]
  }
]
```

## Troubleshooting

### Issue: 403 Forbidden on admin routes
**Solution**: Ensure logged-in user has isAdmin = true

### Issue: Order details not showing
**Solution**: Check that order includes shippingAddress and orderItems with product data

### Issue: Images not loading in product list
**Solution**: Verify image URLs are valid and S3 credentials are configured

### Issue: Admin can't create products
**Solution**: Check that user has isAdmin = true in database

## Files Modified
1. `server.js` - Removed MongoDB connection
2. `routes/productRoutes.js` - Added admin auth to all endpoints
3. `routes/orderRoutes.js` - Added admin auth to admin endpoints
4. `routes/reviewRoutes.js` - Added admin auth to GET all reviews
5. `frontend/src/pages/AdminPanel.jsx` - Fixed data mapping and display
