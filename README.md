# 👛 HNG Wallet Service

A battle-tested, secure backend wallet service built with NestJS. This application provides a complete financial system including user authentication (Google OAuth2), automated wallet creation, secure deposits via Paystack, atomic fund transfers, and a dual-authentication system using JWTs and API Keys.

---

## Live Demo & Documentation

* **Live Base URL:** `https://allet-ervice-adewoyesaheed1845-4cd9xhr2.leapcell.dev`
* **Swagger API Docs:** `https://allet-ervice-adewoyesaheed1845-4cd9xhr2.leapcell.dev/api`

---

## Key Features

### **Authentication & Security**
* **Google OAuth2:** Seamless, passwordless sign-in using Google accounts.
* **JWT Authentication:** Stateless, secure session management for users.
* **Service-to-Service Access (API Keys):**
    * Users can generate API keys for external services.
    * **Granular Permissions:** Keys can be scoped to specific actions (`read`, `deposit`, `transfer`).
    * **Auto-Expiry:** Keys enforce expiration policies (`1H`, `1D`, `1M`, `1Y`).
* **Composite Guard:** A custom security layer that accepts *either* a valid Bearer Token *or* an `x-api-key` header transparently.

### **Wallet Operations**
* **Instant Wallet Creation:** A unique wallet is automatically generated and linked when a new user registers.
* **Paystack Integration:** Secure fiat deposits.
    * Initializes transactions and generates payment links.
    * **Secure Webhook:** Verifies Paystack signatures to prevent fraud and handles idempotency (preventing double-crediting).
* **Atomic Transfers:** Internal wallet-to-wallet transfers use **ACID-compliant transactions**. If any part of the transfer fails, the entire operation is rolled back to ensure money is never lost.
* **Real-time Balance:** Instant balance checks and transaction history tracking.

---

## Technology Stack

* **Framework:** [NestJS](https://nestjs.com/) (Node.js v20)
* **Language:** TypeScript
* **Database:** PostgreSQL (Hosted on **Neon**)
* **ORM:** TypeORM
* **Authentication:** Passport.js (Google Strategy, JWT, HeaderAPIKey)
* **Payments:** Paystack API
* **Hosting:** Leapcell

---

## Environment Variables

To run this project, you need to configure the following environment variables.

| Variable | Description | Example / Note |
| :--- | :--- | :--- |
| **Database (Neon)** | | |
| `DB_HOST` | Neon Host URL | `ep-cool-site.us-east-1.aws.neon.tech` |
| `DB_PORT` | Database Port | `5432` |
| `DB_USER` | Database User | `neondb_owner` |
| `DB_PASSWORD` | Database Password | `npg_XQJK5...` |
| `DB_NAME` | Database Name | `neondb` |
| **Security** | | |
| `JWT_SECRET` | Secret key for signing tokens | `supersecret_key_change_me` |
| **Paystack** | | |
| `PAYSTACK_SECRET_KEY` | Paystack Secret Key | `sk_test_xxxxxxxx...` |
| `PAYSTACK_CALLBACK_URL` | URL to redirect users after payment | `https://your-app.leapcell.dev/api` |
| **Google OAuth** | | |
| `GOOGLE_CLIENT_ID` | OAuth Client ID from Google Cloud | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret | `GOCSPX-xxxxxxxx...` |
| `CALLBACK_URL` | OAuth Callback URL | `https://your-app.leapcell.dev/auth/google/callback` |

---

## Installation & Local Setup

**Prerequisites:** Node.js (v18+), npm, and a running PostgreSQL instance (or Neon connection).

1.  **Clone the repository:**
    ```
    git clone [https://github.com/adewoye-saheed-dML/Wallet-Service.git](https://github.com/adewoye-saheed-dML/Wallet-Service.git)
    cd Wallet-Service
    ```

2.  **Install dependencies:**
    ```
    npm install
    ```

3.  **Configure Environment:**
    * Create a `.env` file in the root directory.
    * Copy the variables from the table above and fill in your keys.

4.  **Run the application:**
    ```
    # Development mode
    npm run start:dev
    ```
    The server will start on `http://localhost:3000`.

---

## Deployment (Leapcell)

This project is optimized for deployment on Leapcell connected to a Neon database.

1.  **Push to GitHub:** Ensure your latest code is on the `main` branch.
2.  **Create Service on Leapcell:**
    * Connect your GitHub repository.
    * **Build Command:** `npm install && npm run build`
    * **Start Command:** `npm run start:prod`
    * **Port:** `3000`
3.  **Add Environment Variables:**
    * Copy all variables from your `.env` into the Leapcell dashboard.
    * *Critical:* Update `CALLBACK_URL` and `PAYSTACK_CALLBACK_URL` to use your new `https://....leapcell.dev` domain.
4.  **Deploy:** Click deploy.

---

## API Endpoints

Full interactive documentation is available via Swagger at `/api`.

### **Authentication**
* `GET /auth/google` - Initiates Google Login flow.
* `GET /auth/google/callback` - Handles the redirect and issues a JWT.

### **Wallet Operations**
* `GET /wallet/balance` - View wallet balance (Requires Auth).
* `POST /wallet/deposit` - Initialize a deposit via Paystack.
* `POST /wallet/transfer` - Transfer funds to another user's wallet.
* `GET /wallet/transactions` - View deposit and transfer history.
* `POST /wallet/paystack/webhook` - **Public** webhook for Paystack notifications.

### **API Key Management**
* `POST /keys/create` - Generate a new API Key with scopes.
* `POST /keys/rollover` - Invalidate an old key and generate a new one.

---

## Database Schema

```mermaid
erDiagram
    User ||--|| Wallet : "owns 1:1"
    User ||--o{ ApiKey : "manages 1:N"
    Wallet ||--o{ Transaction : "has N"

    User {
        uuid id PK
        string email
        string googleId
    }
    Wallet {
        uuid id PK
        string wallet_number
        decimal balance
    }
    ApiKey {
        uuid id PK
        string key
        string[] permissions
        date expires_at
    }
    Transaction {
        uuid id PK
        string reference
        enum type "deposit|transfer"
        enum status "pending|success"
        decimal amount
    }