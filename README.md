# Fundr - Commission-Free Crowdfunding Platform
Live application URL - https://fundr-4cvj.onrender.com/index.html 

Fundr is a production-quality, responsive, and commission-free crowdfunding web application. By showcasing the campaigner's UPI ID and QR code, donations are sent directly from the donor's UPI app to the organizer's bank account, bypass intermediators entirely, and eliminate platform fees.

---

##  Key Features - 

- **0% Commission Direct-to-UPI Payments**: Bypasses conventional payment gateway processing schedules and fee structures.
- **Dynamic Real-Time Filters & Instant Search**: Search campaigns by title, keywords, or location, filter by category tabs, and sort by goals or creation dates.
- **Interactive UPI Scan-and-Pay Section**: Automatically generates scanable UPI protocol links as QR codes if the creator doesn't upload a custom image.
- **Creator Dashboard & CRUD controls**: Manage created campaigns, edit details, or delete campaigns using a secure session-based creator token stored in `localStorage` (no passwords required).
- **Aesthetic Modern UI**: Features smooth glassmorphism, glowing custom progress bars, soft-shaded card elements, loading skeletons, responsive hamburger navbars, dark/light themes, and custom alerts.
- **Rate-Limiting & Security Headers**: Integrated Helmet headers, Express Validator sanitization, Multer file extension/size verifications, and Express Rate-Limit to safeguard APIs.

---

##  Project Structure -

```
fundr/
├── package.json               # Root package.json to manage dependencies & run scripts
├── README.md                  # Detailed platform setup and deployment manuals
├── .gitignore                 # Exclusion configuration for git tracking
├── frontend/
│   ├── index.html             # Main Landing Page
│   ├── explore.html           # Campaign Explorer Listing Page
│   ├── campaign.html          # Campaign Detail Checkout Page
│   ├── profile.html           # Creator Dashboard / Create Form Page
│   ├── 404.html               # Custom 404 Error Page
│   ├── css/
│   │   └── style.css          # Custom CSS design system, themes, and animations
│   ├── js/
│   │   ├── main.js            # Shared JS: dynamic navbar, footer, theme, toasts
│   │   ├── index.js           # Homepage counters animation and featured logs
│   │   ├── explore.js         # Search inputs, pill actions, and sort filters
│   │   ├── campaign.js        # Details render, QR charts, copy-clipboard, confirmations
│   │   └── profile.js         # Drag-drop validation, form submission, edits/deletes
│   └── images/
│       └── .gitkeep           # Placeholder file
└── backend/
    ├── package.json           # Backend package dependencies
    ├── server.js              # Express Application startup file
    ├── .env                   # Configuration file (ignored by Git)
    ├── .env.example           # Example configuration file
    ├── config/
    │   └── db.js              # Database connection manager
    ├── controllers/
    │   ├── campaignController.js # Campaigns CRUD, stats calculator
    │   └── donationController.js # Simulated transaction logger
    ├── middleware/
    │   ├── upload.js          # Multer storage controls
    │   ├── validation.js      # Express validator rule maps
    │   └── errorHandler.js    # Exception capture & response builder
    ├── models/
    │   ├── Campaign.js        # Campaign Mongoose schema
    │   └── Donation.js        # Donation Mongoose schema
    ├── routes/
    │   ├── campaignRoutes.js  # Campaigns routing endpoints
    │   └── donationRoutes.js  # Transactions routing endpoints
    └── uploads/
        └── .gitkeep           # Target folder for uploaded images
```

---

##  Local Development Startup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed (v18.0.0 or higher recommended).
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally, or a MongoDB Atlas account.

### 2. Installation
Clone or navigate to the project directory and install dependencies from the root:
```bash
npm install
```

### 3. Environment Setup
Configure your environment variables:
1. Navigate to the `backend/` directory.
2. Duplicate `.env.example` and rename it to `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Open `backend/.env` and update the connection URI if you are not using a default local MongoDB connection.

### 4. Running the App
From the root workspace folder, launch the development script:
```bash
npm start
```
The server will boot on port `5000` by default. Open `http://localhost:5000` in your web browser to explore Fundr.

---

## GitHub Repository Setup

To host your project on GitHub:

1. **Initialize Git**:
   ```bash
   git init
   ```
2. **Add Files**:
   ```bash
   git add .
   ```
3. **Commit**:
   ```bash
   git commit -m "Initial commit of Fundr crowdfunding application"
   ```
4. **Create GitHub Repo**:
   - Open GitHub in your browser, click **New Repository**.
   - Set the repository name (e.g., `fundr`). Keep it public or private.
   - Do **NOT** initialize it with a README, `.gitignore`, or License (as we already have them).
   - Click **Create Repository**.
5. **Push Code**:
   - Copy the remote origin commands from the GitHub success page.
   - Run:
     ```bash
     git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
     git branch -M main
     git push -u origin main
     ```

---

## Render Deployment Instructions

Render makes it easy to deploy full-stack Node.js applications with static frontends.

### Step 1: Link Github to Render
1. Sign up/log in to [Render](https://render.com/).
2. Connect your GitHub account.

### Step 2: Create a Web Service
1. Click **New +** at the top right and select **Web Service**.
2. Select your repository from the list.
3. Configure the following settings:
   - **Name**: `fundr` (or any unique name)
   - **Region**: Select region nearest to your target audience.
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select the **Free** tier.

### Step 3: Configure Environment Variables
1. Scroll down or click the **Environment** tab in your web service page.
2. Add the following variables:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = *[Your MongoDB Atlas Connection String]*
   - `ALLOWED_ORIGIN` = *[Your Render App URL (e.g., `https://fundr.onrender.com`)]*
3. Click **Save Changes**.

Render will trigger a build, install all dependencies, bind to port `10000` (assigned automatically), and make the application public. Click the unique URL link displayed at the top of your Render dashboard to access your production platform!
