# StudyNook Backend Server 🚀

A modern and secure backend server for the **StudyNook** platform — a premium study room booking application built with **Node.js, Express.js, MongoDB, and JWT Authentication**.

This backend handles:

- Room Management
- Booking System
- Booking Conflict Detection
- Protected Routes
- User-specific Listings
- Featured Rooms
- MongoDB Filtering & Searching
- JWT Verification using JOSE

---

# 🌐 Live API

```bash
https://your-backend-url.onrender.com
```

---

# ⚙️ Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- JWT Authentication
- JOSE
- CORS
- dotenv

---

# 📦 Installed Packages

```bash
npm install express mongodb cors dotenv jose-cjs
```

---

# 📁 Project Structure

```bash
studynook-backend/
│
├── node_modules/
├── .env
├── .gitignore
├── index.js
├── package.json
├── package-lock.json
└── README.md
```

---

# 🔐 Environment Variables

Create a `.env` file in the root directory.

```env
PORT=5004

MONGODB_URI=your_mongodb_connection_uri

CLIENT_URL=http://localhost:3000
```

---

# ▶️ Run Locally

## Clone Repository

```bash
git clone https://github.com/your-username/studynook-backend.git
```

---

## Install Dependencies

```bash
npm install
```

---

## Start Server

```bash
node index.js
```

OR

```bash
npm run dev
```

---

# 🛡 Authentication System

StudyNook uses:

- JWT Token Verification
- JOSE Remote JWK Verification
- Protected API Routes

### Token Verification Middleware

```js
const verifyToken = async (req, res, next) => {
  ...
};
```

Protected routes require:

```bash
Authorization: Bearer YOUR_TOKEN
```

---

# 🏠 Room APIs

---

## 📌 Get All Rooms

### GET `/room`

### Features:

- Search by room name
- Filter by amenities
- Filter by hourly rate
- Filter by floor

### Query Parameters

| Query     | Description         |
| --------- | ------------------- |
| search    | Search room name    |
| amenities | Filter amenities    |
| minRate   | Minimum hourly rate |
| maxRate   | Maximum hourly rate |
| floor     | Filter by floor     |

### Example

```bash
/api/room?search=silent&amenities=Wi-Fi,Projector
```

---

## 📌 Add Room

### POST `/room`

Protected Route ✅

### Body Example

```json
{
  "roomName": "Silent Focus Hub",
  "image": "https://image-url.com",
  "floor": "2nd Floor",
  "capacity": 6,
  "hourlyRate": 10,
  "description": "Peaceful premium study room",
  "amenities": ["Wi-Fi", "Projector"]
}
```

---

## 📌 Get Single Room

### GET `/room/:id`

Protected Route ✅

---

## 📌 Update Room

### PUT `/room/:id`

Protected Route ✅

Only room owner can update.

---

## 📌 Delete Room

### DELETE `/room/:id`

Protected Route ✅

Only room owner can delete.

---

# 📅 Booking APIs

---

## 📌 Create Booking

### POST `/bookings`

Protected Route ✅

### Features

- Prevents booking conflicts
- Prevents past-date booking
- Calculates booking data
- Updates booking count

### Booking Conflict Logic

```js
const conflict = await bookingCollection.findOne({
  roomId,
  bookingDate,
  status: "confirmed",
  startTime: { $lt: endTime },
  endTime: { $gt: startTime },
});
```

---

## 📌 Get User Bookings

### GET `/bookings`

Protected Route ✅

Returns logged-in user bookings.

---

## 📌 Cancel Booking

### PATCH `/bookings/:id/cancel`

Protected Route ✅

### Features

- Cancels booking
- Decreases room booking count
- Removes booking from user profile

---

# ⭐ Featured Rooms API

---

## 📌 Get Featured Rooms

### GET `/featured`

Returns latest 6 rooms from database.

### MongoDB Operations Used

```js
.sort({ _id: -1 }).limit(6)
```

---

# 📋 My Listings API

---

## 📌 Get User Listings

### GET `/my-listings`

Protected Route ✅

Returns rooms added by current user.

---

# 🔎 MongoDB Features Used

---

## Search by Name

```js
$regex;
```

---

## Amenities Filtering

```js
$in;
```

---

## Range Filtering

```js
$gte;
$lte;
```

---

## Sorting

```js
.sort()
```

---

## Limiting Results

```js
.limit()
```

---

# 🔥 Main Features

✅ JWT Authentication
✅ Protected Routes
✅ MongoDB Atlas Integration
✅ Room CRUD Operations
✅ Booking System
✅ Booking Conflict Detection
✅ Featured Rooms
✅ Dynamic Filtering
✅ User-specific Listings
✅ Responsive API Design
✅ Error Handling

---

# 🚀 Deployment

---

## Frontend

Deploy on:

- Vercel

---

## Backend

Deploy on:

- Render

---

## Database

Use:

- MongoDB Atlas

---

# 🧠 Future Improvements

- Payment Gateway Integration
- Booking Approval System
- Room Reviews & Ratings
- Admin Dashboard
- Pagination
- Email Notifications
- Availability Calendar
- Advanced Search

---

# 👨‍💻 Developer

### Md Shahadat Hossain

Full Stack Web Developer

---

# 📄 License

This project is licensed for educational and personal use.

---

# ❤️ StudyNook

A modern platform for booking peaceful and productive study rooms.
