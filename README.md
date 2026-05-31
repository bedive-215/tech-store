# Tech Store

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=111)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.83-61DAFB?style=for-the-badge&logo=react&logoColor=111)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Event_Driven-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Kong](https://img.shields.io/badge/Kong-API_Gateway-003459?style=for-the-badge&logo=kong&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Tech Store** is a full-stack e-commerce platform for technology products. It includes a React web application, a React Native mobile app, and a microservices backend that handles authentication, product catalog management, carts, orders, payments, warranties, coupons, and analytics.

The backend follows a domain-based microservices architecture. Each service owns its database, Kong Gateway centralizes API routing, and RabbitMQ supports asynchronous communication between services.

## Tech Stack

- **Web Frontend:** React 18, Vite, React Router, Tailwind CSS, Axios, React Hook Form, Yup, Recharts, i18next
- **Mobile App:** React Native 0.83, React Navigation, Async Storage, Axios, React Hook Form, Yup
- **Backend:** Node.js, Express, Sequelize, MySQL2, JWT, bcrypt, multer
- **Databases:** MySQL 8.0 for service data, PostgreSQL for Kong metadata
- **Messaging:** RabbitMQ
- **API Gateway:** Kong Gateway
- **Integrations:** VNPay, Cloudinary, Nodemailer SMTP
- **DevOps:** Docker, Docker Compose

## Features

### Authentication & User Management

- User registration and login
- Email verification and verification-code resend
- JWT authentication and refresh-token flow
- OAuth login endpoint
- Forgot-password and reset-password flow
- User profile management
- Role-based access control for admin endpoints

### Product Catalog

- Product listing and product detail APIs
- Admin product creation, update, and deletion
- Brand and category management
- Product media upload support
- Flash sale management

### Cart & Checkout

- Authenticated user cart
- Add product to cart
- Update product quantity
- Remove product from cart
- Clear cart
- Checkout-ready order creation flow

### Orders, Coupons & Analytics

- Customer order creation and order history
- Order detail and cancellation
- Admin order status updates
- Coupon creation, validation, listing, and deletion
- Revenue analytics by week, month, and year
- Chart-ready revenue reporting endpoints

### Payments

- VNPay payment URL generation
- VNPay return callback handling
- Payment status persistence
- Payment success event publishing through RabbitMQ
- Order amount lookup through asynchronous messaging

### Warranty

- Warranty request creation with file uploads
- Customer warranty request history
- Admin warranty request listing
- Warranty status updates
- Warranty validation endpoint

### Client Applications

- Web storefront for products, categories, cart, orders, payment, and profile
- Admin dashboard for users, products, orders, discounts, flash sales, and analytics
- Mobile app screens for authentication, home, products, cart, orders, and profile

## Project Structure

```text
tech-store/
|-- backend/
|   |-- auth-service/
|   |-- cart-service/
|   |-- order-service/
|   |-- payment-service/
|   |-- product-service/
|   `-- warranty-service/
|-- database/
|   |-- schemas/
|   `-- seeds/
|-- deployment/
|   |-- docker/
|   |   `-- docker-compose.yml
|   `-- rabbitmq/
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- contexts/
|   |   |-- hooks/
|   |   |-- layouts/
|   |   |-- pages/
|   |   |-- providers/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|   |-- index.html
|   |-- vite.config.js
|   `-- package.json
|-- kong-gateway/
|   `-- kong.yaml
|-- mobile/
|   `-- MobileApp/
|       |-- android/
|       |-- ios/
|       |-- src/
|       `-- package.json
`-- README.md
```

## Installation

### Prerequisites

- Node.js 20+
- npm
- Docker and Docker Compose
- Android Studio or Xcode for mobile development
- VNPay sandbox credentials for payment testing
- Cloudinary credentials for media uploads
- SMTP credentials for email flows

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd tech-store
```

### 2. Configure Environment Variables

Create a `.env` file inside each backend service directory. Docker Compose provides database URLs for the service containers, but integration secrets still need to be configured.

Example for `backend/auth-service/.env`:

```env
PORT=8386
DATABASE_URL=mysql://root:root@auth-database:3306/auth_service
JWT_SECRET=replace_with_a_strong_secret
JWT_REFRESH_SECRET=replace_with_a_strong_refresh_secret
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET_KEY=your_cloudinary_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_app_password
EMAIL_FROM=Tech Store <your_email@example.com>
```

Example for `backend/payment-service/.env`:

```env
PORT=4002
DATABASE_URL=mysql://root:root@payment-database:3306/payment_service
JWT_SECRET=replace_with_a_strong_secret
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

VNP_TMN_CODE=your_vnpay_tmn_code
VNP_HASH_SECRET=your_vnpay_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:8000/api/v1/payments/vnpay_return
```

Example for `frontend/.env`:

```env
VITE_API_GATEWAY_URL=http://localhost:8000
```

### 3. Start Backend Services with Docker Compose

```bash
cd deployment/docker
docker compose up --build
```

This starts the MySQL databases, RabbitMQ, Kong Gateway, and all backend services.

Default ports:

| Service | Port |
| --- | ---: |
| Kong proxy | 8000 |
| Kong admin | 8001 |
| RabbitMQ | 5672 |
| RabbitMQ management | 15672 |
| Auth service | 8386 |
| Product service | 8585 |
| Cart service | 6000 |
| Order service | 3000 |
| Payment service | 4002 |
| Warranty service | 3006 |

### 4. Run the Web Application

```bash
cd frontend
npm install
npm run dev
```

The web app usually runs at:

```text
http://localhost:5173
```

### 5. Run the Mobile Application

```bash
cd mobile/MobileApp
npm install
npm run start
```

Run Android:

```bash
npm run android
```

Run iOS:

```bash
npm run ios
```

## Usage

### Docker

```bash
cd deployment/docker
docker compose up --build
docker compose logs -f
docker compose down
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run preview
npm run lint
```

### Backend Services

Run these commands inside a backend service directory, for example `backend/auth-service`:

```bash
npm install
npm start
```

The order service also includes:

```bash
npm run dev
```

### Mobile

```bash
cd mobile/MobileApp
npm run start
npm run android
npm run ios
npm run lint
npm run test
```

## API Overview

All gateway routes are exposed through Kong:

```text
http://localhost:8000
```

### Auth Service

Base path: `/api/v1/auth`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/register` | Register a new account |
| POST | `/login` | Login with email and password |
| POST | `/verify` | Verify email code |
| POST | `/verification-code/resend` | Resend verification code |
| POST | `/refresh-token` | Refresh authentication state |
| POST | `/logout` | Logout authenticated user |
| POST | `/login/oauth` | OAuth login |
| POST | `/forgot-password` | Send reset-password code |
| POST | `/verify-reset-code` | Verify reset code |
| POST | `/reset-password` | Reset password |

### User, Review & Wishlist APIs

| Base Path | Description |
| --- | --- |
| `/api/v1/users` | Authenticated user profile and user management APIs |
| `/api/v1/reviews` | Product review APIs |
| `/api/v1/wishlist` | Authenticated wishlist APIs |

### Product Service

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/v1/products` | List products |
| GET | `/api/v1/products/:id` | Get product detail |
| POST | `/api/v1/products` | Create product, admin only |
| PUT | `/api/v1/products/:id` | Update product, admin only |
| DELETE | `/api/v1/products/:id` | Delete product, admin only |
| GET | `/api/v1/brands` | List brands |
| POST | `/api/v1/brands` | Create brand, admin only |
| DELETE | `/api/v1/brands/:id` | Delete brand, admin only |
| GET | `/api/v1/categories` | List categories |
| POST | `/api/v1/categories` | Create category, admin only |
| DELETE | `/api/v1/categories/:id` | Delete category, admin only |
| Multiple | `/api/v1/flash-sales` | Flash sale APIs |

### Cart Service

Base path: `/api/v1/carts`

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | Get current user's cart |
| POST | `/` | Add item to cart |
| PUT | `/update` | Update item quantity |
| DELETE | `/remove/:product_id` | Remove item from cart |
| DELETE | `/clear` | Clear cart |

### Order Service

Base path: `/api/v1/orders`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/` | Create order |
| GET | `/` | List current user's orders |
| GET | `/:id` | Get order detail |
| PUT | `/:id/cancel` | Cancel order |
| GET | `/admin/all` | List all orders, admin |
| PUT | `/:id/ship` | Mark order as shipping |
| PUT | `/:id/complete` | Mark order as completed |
| PUT | `/:id/confirmed` | Mark order as confirmed |

### Coupon & Analytics APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/v1/coupons/validate` | Validate coupon |
| POST | `/api/v1/coupons` | Create coupon, admin only |
| GET | `/api/v1/coupons` | List coupons |
| DELETE | `/api/v1/coupons/:id` | Delete coupon, admin only |
| GET | `/api/v1/analytics/revenue/week` | Weekly revenue summary |
| GET | `/api/v1/analytics/revenue/month` | Monthly revenue summary |
| GET | `/api/v1/analytics/revenue/year` | Yearly revenue summary |
| GET | `/api/v1/analytics/revenue/chart/day` | Daily revenue chart data |
| GET | `/api/v1/analytics/revenue/chart/month` | Monthly revenue chart data |
| GET | `/api/v1/analytics/revenue/chart/year` | Yearly revenue chart data |

### Payment Service

Base path: `/api/v1/payments`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/` | Create VNPay payment URL |
| GET | `/vnpay_return` | VNPay callback endpoint |

### Warranty Service

Base path: `/api/v1/warranty`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/` | Create warranty request |
| GET | `/my` | Get current user's warranty requests |
| GET | `/` | List all warranty requests, admin only |
| PATCH | `/:id/status` | Update warranty status, admin only |
| POST | `/:warranty_id/valid` | Validate warranty request, admin only |

## Notes & Highlights

- **Domain-based microservices:** Each major business capability is isolated into its own service.
- **Database isolation:** Each backend service owns a separate MySQL database and schema.
- **Gateway-first access:** Kong Gateway provides a single entry point for web and mobile clients.
- **Asynchronous workflows:** RabbitMQ decouples payment and order workflows.
- **Production-oriented integrations:** The system includes VNPay payments, Cloudinary media uploads, SMTP email, and Docker-based deployment.
- **Multi-platform clients:** The repository includes both a web app and a mobile app backed by the same API gateway.

## License

This project is currently maintained for academic and portfolio purposes. Add a license file before distributing it as open source.
