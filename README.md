# Decision Fatigue Management App

A comprehensive web application to help users reduce daily mental overload through intelligent automation and planning.

## 🌟 Features

- **Smart Schedule Planner**: Auto-generates daily schedules based on goals, work hours, and energy levels
- **Meal Decision Assistant**: Suggests daily meals with recipes and grocery lists
- **Outfit Generator**: AI outfit recommendations from your digital wardrobe
- **Task Prioritization**: Auto-sorts tasks using Eisenhower Matrix and AI scoring
- **Decision Automation Mode**: "Autopilot Day" feature for minimal input days
- **Energy & Mood Tracking**: Log mood and energy levels with AI-adjusted plans
- **Notifications & Reminders**: Gentle prompts for meals, meetings, and prep
- **Analytics Dashboard**: Track decision load saved and productivity trends

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd d:\DecisionFatigue
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` (already done)
   - Update `JWT_SECRET` in `.env` for production

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - Create an account or sign in

### Development Mode

For development with auto-reload:
```bash
npm run dev
```

## 📁 Project Structure

```
DecisionFatigue/
├── server.js                 # Express server entry point
├── package.json              # Dependencies and scripts
├── .env                      # Environment configuration
├── db/
│   ├── schema.sql           # Database schema
│   ├── database.js          # Database initialization
│   └── decisonfatigue.db    # SQLite database (auto-created)
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── schedules.js         # Schedule management
│   ├── meals.js             # Meal planning
│   ├── outfits.js           # Outfit suggestions
│   ├── tasks.js             # Task prioritization
│   ├── mood.js              # Mood tracking
│   └── analytics.js         # Analytics & stats
└── public/
    ├── index.html           # Landing page
    ├── login.html           # Login page
    ├── signup.html          # Registration page
    ├── dashboard.html       # Main dashboard
    ├── css/
    │   ├── style.css        # Main stylesheet
    │   ├── auth.css         # Authentication pages styles
    │   └── dashboard.css    # Dashboard styles
    └── js/
        └── api.js           # API client module
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/preferences` - Update user preferences (protected)

### Schedules
- `POST /api/schedules/generate` - Generate daily schedule
- `GET /api/schedules/:date` - Get schedule for date
- `PUT /api/schedules/:date` - Update schedule

### Meals
- `POST /api/meals/suggest` - Get meal suggestion
- `POST /api/meals/save` - Save meal plan
- `GET /api/meals/:date` - Get meals for date
- `POST /api/meals/grocery-list` - Generate grocery list

### Outfits
- `POST /api/outfits/wardrobe` - Add wardrobe item
- `GET /api/outfits/wardrobe` - Get all wardrobe items
- `DELETE /api/outfits/wardrobe/:id` - Remove item
- `POST /api/outfits/suggest` - Get outfit suggestion
- `GET /api/outfits/:date` - Get outfit for date

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/top-priorities` - Get top 3 priorities
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Mood
- `POST /api/mood` - Log mood/energy
- `GET /api/mood` - Get mood logs
- `GET /api/mood/analytics` - Get mood analytics

### Analytics
- `GET /api/analytics` - Get comprehensive analytics
- `POST /api/analytics/update-stats` - Update decision stats

## 🎨 Design System

The app features a premium, modern design with:
- **Glassmorphism effects** with backdrop blur
- **Gradient-based color scheme** (purple/blue/pink)
- **Smooth animations** and transitions
- **Dark theme** optimized for reduced eye strain
- **Responsive design** for mobile, tablet, and desktop

## 🔧 Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Design**: Modern CSS with custom properties, Google Fonts (Inter, Outfit)

## 📱 Usage

1. **Sign Up**: Create an account with your email and password
2. **Set Preferences**: Configure your diet type, work hours, and goals
3. **Dashboard**: View your daily overview with tasks, schedule, meals, and outfit
4. **Generate Schedule**: Let the AI create an optimized daily schedule
5. **Plan Meals**: Get meal suggestions based on your dietary preferences
6. **Build Wardrobe**: Add clothing items to your digital closet
7. **Manage Tasks**: Add tasks and let the Eisenhower Matrix prioritize them
8. **Track Mood**: Log your daily energy and mood levels
9. **Enable Autopilot**: Let the app make all decisions for you
10. **View Analytics**: Check your productivity trends and decision load saved

## 🛡️ Security

- Passwords are hashed using bcrypt
- JWT tokens for secure authentication
- Protected API routes with authentication middleware
- Input validation on all forms
- SQL injection prevention with prepared statements

## 📝 License

MIT

## 👥 Author

Created with ❤️ for people who want to reduce decision fatigue and increase productivity.

---

**Note**: For production deployment, make sure to:
- Change the `JWT_SECRET` in `.env`
- Use a production-grade database (PostgreSQL/MySQL)
- Enable HTTPS
- Set up proper logging and monitoring
- Configure CORS appropriately
