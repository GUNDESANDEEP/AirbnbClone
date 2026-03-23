# 🏨 StayBNB - Airbnb Clone Application

A modern React-based vacation rental booking platform inspired by Airbnb. Explore destinations, browse properties, and manage bookings all in one place!

---

## 📋 Table of Contents
- [Features](#features)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)

---

## ✨ Features

### 🔐 Authentication
- **Host Login**: Special admin account for property management
  - Email: `staynb.sandeep@gmail.com`
  - Password: `sandeep@2026`
- **Customer Registration**: Create your own account and book properties
- **Role-based Access**: Different dashboards for hosts and customers

### 🏠 Property Management (Host Portal)
- **Create New Properties**: Add properties with images, amenities, pricing
- **Manage Listings**: Edit property details
- **Delete Properties**: Remove properties from platform
- **View Bookings**: See all customer bookings with timestamps
- **Track Timestamps**: Know exactly when customers booked

### 🔍 Property Discovery (Customer Portal)
- **Browse Destinations**: 12+ popular Indian destinations (Goa, Jaipur, Manali, Kerala, etc.)
- **Filter by Region**: North, South, East, West, Northeast, Mountains
- **Filter by Category**: Monument, Fort, Palace, Temple, Beach, Nature, Spiritual, etc.
- **Search Properties**: Find stays based on your preferences
- **View Details**: Full property information with photos, amenities, reviews

### 📅 Booking System
- **Book Properties**: Select check-in/check-out dates
- **Booking Confirmation**: Get instant confirmation with timestamps
- **View My Bookings**: See all confirmed bookings
- **Booking History**: Track all your reservations
- **Date & Time Tracking**: Know exactly when you made your booking

### 🌟 Premium Features
- **Ratings & Reviews**: See property ratings (4.5-5 stars)
- **Superhost Status**: Identify trusted hosts with superhost badges
- **Amenities List**: WiFi, Pool, AC, Kitchen, Parking, Beach Access, etc.
- **Photo Gallery**: Multiple high-quality images per property
- **Must-Visit Places**: 24 iconic Indian landmarks with descriptions

---

## 🎯 How It Works

### User Flow:

#### **As a Customer:**
1. **Visit the Platform** → Browse featured destinations and properties
2. **Search & Filter** → Find properties by region, category, price range
3. **View Details** → Check property photos, amenities, reviews, host info
4. **Create Account** → Register with email and password
5. **Make Booking** → Select dates and confirm reservation
6. **View Bookings** → See your confirmed bookings with booking timestamps
7. **Enjoy Your Stay** → Experience amazing destinations!

#### **As a Host:**
1. **Login** → Use special host credentials (already provided)
2. **Create Properties** → Add new vacation rental listings
3. **Upload Photos** → Add multiple high-quality images
4. **Set Pricing** → Define nightly rates
5. **Manage Bookings** → View all customer reservations with timestamps
6. **Delete Properties** → Remove listings when needed
7. **Monitor Activity** → Track bookings in real-time

### Data Persistence:
- **localStorage**: All customer data, bookings, and properties saved locally
- **Session Storage**: Temporary user session data
- **Real-time Updates**: Changes reflect immediately across the app

---

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- Git

### Clone Repository
```bash
git clone https://github.com/yourusername/staybnb.git
cd staybnb
```

### Install Dependencies
```bash
npm install
```

---

## 🏃 Running Locally

### Start Development Server
```bash
npm start
```

The app opens at: **http://localhost:3000**

### Build for Production
```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

---

## 🌐 Deployment

### Option 1: Deploy on Vercel (Recommended) ⭐

**Easiest & fastest deployment for React apps**

1. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/yourusername/staybnb.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Visit https://vercel.com
   - Click "Sign up" (sign up with GitHub)
   - Click "New Project"
   - Select your GitHub repository
   - Click "Import"
   - Vercel auto-detects it's a React app
   - Click "Deploy"

3. **Done!** Your app is live at a URL like: `https://staybnb.vercel.app`

---

### Option 2: Deploy on Netlify

1. **Push to GitHub** (same as above)

2. **Connect to Netlify**:
   - Visit https://netlify.com
   - Click "Sign up with GitHub"
   - Click "New site from Git"
   - Select your repository
   - Build command: `npm run build`
   - Publish directory: `build`
   - Click "Deploy"

3. **Live at**: `https://your-site-name.netlify.app`

---

### Option 3: Deploy on GitHub Pages

1. **Update package.json**:
   ```json
   "homepage": "https://yourusername.github.io/staybnb"
   ```

2. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Add deploy scripts** to package.json:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d build"
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

5. **Enable Pages** in GitHub repo settings

---

## 📁 Project Structure

```
staybnb/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── App.js (Main component - contains all logic)
│   ├── App.css (Styling)
│   ├── index.js (Entry point)
│   └── setupTests.js
├── build/ (Production build)
├── package.json
├── config-overrides.js
└── README.md
```

---

## 🛠️ Technologies Used

- **Frontend**: React.js
- **Styling**: CSS3 (Custom CSS)
- **State Management**: React Hooks (useState, useContext, useEffect)
- **Storage**: Browser localStorage
- **Build Tool**: Create React App
- **Icons**: Unicode/Emoji
- **Images**: External URLs (Unsplash, Picsum)

---

## 📊 API Data

### Built-in Database:
- **24 Must-Visit Places**: Taj Mahal, Red Fort, Hawa Mahal, Golden Temple, etc.
- **12 Destinations**: Goa, Jaipur, Manali, Kerala, Agra, etc.
- **100+ Property Listings**: Villas, Heritage stays, Cabins, etc.
- **6 Regions**: North, South, East, West, Northeast, Mountains
- **9 Categories**: Monument, Fort, Palace, Temple, Spiritual, Nature, Beach, Wildlife

---

## 🔐 Default Login Credentials

### Host Account:
- **Email**: staynb.sandeep@gmail.com
- **Password**: sandeep@2026
- **Role**: Host (Property owner)

### Customer Accounts:
- Register your own account in the app
- Create with any email and password
- Access customer dashboard

---

## 📝 Recent Updates

✅ **Delete Property Option** - Hosts can now remove properties  
✅ **Create New Properties** - Add properties with full details  
✅ **Booking Timestamps** - Track exactly when customers book  
✅ **Enhanced UI** - Better navigation and user experience  

---

## 📞 Support

For issues or questions, open a GitHub issue or contact the author.

**Author**: Sandeep (Host)  
**GitHub**: https://github.com/yourusername/staybnb

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🎉 Happy Travels with StayBNB!

Explore India's most beautiful destinations and book your perfect stay today! 🏖️🏔️🕌
