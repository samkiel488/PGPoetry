# PGPoetry - Priceless Gift Poetry

A minimalist, emotion-driven blog designed for publishing original written poems to the public.

## 🌟 Features

### Public Site (Client Side)
- **Browse Poems**: View all published poems with beautiful cards
- **Search Functionality**: Search through poems by title, content, or tags
- **Individual Poem View**: Read full poems with elegant typography
- **Mobile-First Design**: Responsive design that works on all devices
- **Minimalist UI**: Clean, poetry-focused design with serif fonts

### Admin Portal (Private)
- **Secure Authentication**: JWT-based login system
- **Create Poems**: Add new poems with title, content, tags, and featured status
- **Edit Poems**: Update existing poems
- **Delete Poems**: Remove poems from the collection
- **Dashboard**: Manage all poems from a clean interface

## 🛠️ Technology Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Security**: bcryptjs for password hashing, helmet for security headers

## 📁 Project Structure

```
PGPoetry/
├── client/                 # Public-facing site
│   ├── index.html         # Homepage
│   ├── poems.html         # Poems listing page
│   ├── poem.html          # Individual poem view
│   ├── css/
│   │   └── style.css      # Main stylesheet
│   └── js/
│       ├── app.js         # Homepage functionality
│       ├── poems.js       # Poems listing functionality
│       └── poem.js        # Individual poem functionality
│
├── admin/                  # Admin portal
│   ├── login.html         # Admin login page
│   ├── dashboard.html     # Admin dashboard
│   ├── css/
│   │   └── admin.css      # Admin stylesheet
│   └── js/
│       ├── login.js       # Login functionality
│       └── dashboard.js   # Dashboard functionality
│
├── server/                 # Node backend
│   ├── models/
│   │   └── Poem.js        # Poem Mongoose model
│   ├── routes/
│   │   ├── auth.js        # Authentication routes
│   │   └── poems.js       # Poem CRUD routes
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   └── poemController.js  # Poem CRUD logic
│   ├── middleware/
│   │   └── auth.js        # JWT authentication middleware
│   ├── env.example        # Environment variables template
│   └── server.js          # Main server file
│
├── package.json           # Node.js dependencies
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PGPoetry
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp server/env.example server/.env
   ```
   
   Edit `server/.env` with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/pgpoetry
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   NODE_ENV=development
   ```

4. **Start MongoDB**
   - Local: Make sure MongoDB is running on your machine
   - Cloud: Use MongoDB Atlas or another cloud provider

5. **Start the server**
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

6. **Access the application**
   - Public site: http://localhost:3000
   - Admin portal: http://localhost:3000/admin
   - Default admin credentials: admin / admin123

## 📚 API Endpoints

### Public Endpoints
- `GET /api/poems` - Get all poems
- `GET /api/poems/:slug` - Get single poem by slug

### Protected Endpoints (Admin Only)
- `POST /api/auth/login` - Admin authentication
- `POST /api/poems` - Create new poem
- `PUT /api/poems/:id` - Update poem
- `DELETE /api/poems/:id` - Delete poem

## 🎨 Design Features

- **Typography**: Playfair Display for headings, Source Sans Pro for body text
- **Color Scheme**: Minimalist with red accent color (#e74c3c)
- **Layout**: Grid-based responsive design
- **Animations**: Smooth hover effects and transitions
- **Mobile-First**: Optimized for mobile devices

## 🔒 Security Features

- JWT-based authentication for admin access
- Password hashing with bcryptjs
- Security headers with helmet
- Rate limiting to prevent abuse
- CORS configuration
- Input validation and sanitization

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Variables for Production
- Change `JWT_SECRET` to a strong, unique key
- Update `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- Set `NODE_ENV=production`
- Use a production MongoDB instance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with love for poetry enthusiasts
- Designed for minimalism and readability
- Inspired by the beauty of written words

---

**PGPoetry** - Where emotions find their voice through words.
