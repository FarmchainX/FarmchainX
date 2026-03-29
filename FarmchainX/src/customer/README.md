# Customer Portal (FarmchainX)

This folder contains the Customer role frontend module.

## Pages
- `CustomerHomePage.jsx` - featured products + AI score badges
- `CustomerShopPage.jsx` - product listing with search and filters
- `CustomerProductDetailsPage.jsx` - product detail, reviews, add to cart
- `CustomerCartPage.jsx` - cart summary + checkout
- `CustomerOrdersPage.jsx` - order history + detail panel
- `CustomerScanQrPage.jsx` - batch authenticity verification
- `CustomerProfilePage.jsx` - profile, addresses, payment methods, password
- `CustomerLayout.jsx` - navigation shell

## API paths used
- `GET /api/customer/products`
- `GET /api/customer/products/{id}`
- `GET/POST/PUT/DELETE /api/customer/cart`
- `GET/POST /api/customer/orders`
- `GET /api/customer/orders/{id}`
- `GET /api/customer/orders/{id}/tracking`
- `GET/POST/PUT/DELETE /api/customer/addresses`
- `GET/POST/PUT/DELETE /api/customer/payments`
- `GET /api/customer/qr/verify?batchId=`
- `GET/PUT /api/customer/profile`
- `PUT /api/customer/profile/password`
- `GET /api/customer/reviews/product/{productId}`
- `POST /api/customer/reviews`

## Notes
- Auth token is read from `localStorage.fcx_token`.
- Role guard expects `localStorage.fcx_role === 'CUSTOMER'`.
- Profile name and avatar use `fcx_fullName` and `fcx_customer_profile`.

