# Belay - Real-time Chat Application

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.3+-green.svg)
![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)
![SQLite](https://img.shields.io/badge/SQLite-3+-003B57.svg)

A modern, real-time chat application inspired by Slack, built with Flask and React. Belay provides seamless communication through organized channels, threaded conversations, and real-time messaging capabilities.

## 🚀 Features

### Core Messaging
- **Real-time Chat**: Send and receive messages instantly across multiple channels
- **Channel Management**: Create, join, and manage organized discussion channels
- **Threaded Conversations**: Reply to specific messages to maintain context
- **Message Reactions**: Express reactions with emoji responses
- **Image Support**: Automatic image URL parsing and display
- **Unread Message Tracking**: Keep track of unread messages across all channels

### User Experience
- **Single Page Application**: Smooth navigation without page reloads
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Updates**: Messages appear instantly without manual refresh
- **Persistent Sessions**: Stay logged in across browser sessions
- **URL Navigation**: Direct links to specific channels and message threads

### Security & Authentication
- **User Authentication**: Secure signup and login system
- **API Key Authorization**: Token-based authentication for API endpoints
- **Input Sanitization**: Protection against SQL injection attacks
- **Session Management**: Secure user session handling

## 🛠 Technologies Used

### Backend
- **Flask** - Lightweight WSGI web application framework
- **SQLite** - Embedded relational database
- **Python 3.11+** - Core programming language

### Frontend
- **React** - Component-based UI library
- **JavaScript (ES6+)** - Modern JavaScript features
- **CSS3** - Modern styling with gradients and animations
- **React Router** - Client-side routing for SPA functionality

### Development Tools
- **Git** - Version control
- **RESTful API Design** - Clean API architecture
- **Responsive Web Design** - Mobile-first approach

## 📋 Prerequisites

- Python 3.11 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Git (for cloning the repository)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/belay-chat-app.git
cd belay-chat-app
```

### 2. Set Up Python Environment
```bash
# Create virtual environment (recommended)
python -m venv belay_env
source belay_env/bin/activate  # On Windows: belay_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Initialize Database
The SQLite database is already set up with sample data. If you need to reset it, you can find the schema in `db/belay.sql`.

### 4. Configure Environment
```bash
export FLASK_APP=app.py
export FLASK_ENV=development  # Optional: for development mode
```

### 5. Start the Application
```bash
flask run
```

The application will be available at `http://127.0.0.1:5000/`

## 📊 Database Schema

### Tables Overview
- **users** - User accounts and authentication
- **channels** - Chat rooms/channels
- **messages** - Chat messages and replies
- **reactions** - Emoji reactions to messages
- **user_message_views** - Track read/unread status

### Detailed Schema
```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(40) UNIQUE,
    password VARCHAR(40),
    api_key VARCHAR(40)
);

-- Channels table
CREATE TABLE channels (
    id INTEGER PRIMARY KEY,
    name VARCHAR(40) UNIQUE
);

-- Messages table (includes both messages and replies)
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    channels_id INTEGER,
    replies_to INTEGER,  -- NULL for main messages, message_id for replies
    body TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (channels_id) REFERENCES channels(id),
    FOREIGN KEY (replies_to) REFERENCES messages(id)
);

-- Reactions table
CREATE TABLE reactions (
    id INTEGER PRIMARY KEY,
    emoji VARCHAR(10),
    message_id INTEGER,
    user_id INTEGER,
    FOREIGN KEY (message_id) REFERENCES messages(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User message views (for unread tracking)
CREATE TABLE user_message_views (
    user_id INTEGER,
    channel_id INTEGER,
    last_message_id_seen INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(channel_id) REFERENCES channels(id),
    FOREIGN KEY(last_message_id_seen) REFERENCES messages(id),
    PRIMARY KEY (user_id, channel_id)
);
```

## 🔌 API Documentation

### Authentication Endpoints

#### Sign Up
```http
POST /api/signup
```
Creates a new user account with auto-generated credentials.

**Response:**
```json
{
    "id": 1,
    "username": "Unnamed User #123456",
    "api_key": "abc123def456..."
}
```

#### Login
```http
POST /api/login
Content-Type: application/json

{
    "username": "user123",
    "password": "password123"
}
```

### Channel Endpoints

#### Get All Channels
```http
GET /api/channel
```

#### Create New Channel
```http
POST /api/channel
Authorization: your_api_key_here
```

#### Get Channel Details
```http
GET /api/channel/{channel_id}
Authorization: your_api_key_here
```

#### Update Channel Name
```http
POST /api/channel/{channel_id}
Authorization: your_api_key_here
Content-Type: application/json

{
    "name": "New Channel Name"
}
```

### Message Endpoints

#### Get Channel Messages
```http
GET /api/channel/{channel_id}/messages
Authorization: your_api_key_here
```

#### Post Message
```http
POST /api/channel/{channel_id}/messages
Authorization: your_api_key_here
Content-Type: application/json

{
    "body": "Hello, world!"
}
```

#### Get Message Replies
```http
GET /api/messages/{message_id}/replies
Authorization: your_api_key_here
```

#### Post Reply
```http
POST /api/messages/{message_id}/replies
Authorization: your_api_key_here
Content-Type: application/json

{
    "body": "This is a reply"
}
```

### Reaction Endpoints

#### Get Message Reactions
```http
GET /api/message/{message_id}/reaction
Authorization: your_api_key_here
```

#### Add Reaction
```http
POST /api/message/{message_id}/reaction
Authorization: your_api_key_here
Content-Type: application/json

{
    "emoji": "👍"
}
```

### User Endpoints

#### Get Unread Message Counts
```http
GET /api/user/unread-messages
Authorization: your_api_key_here
```

#### Update Profile
```http
POST /api/profile
Authorization: your_api_key_here
Content-Type: application/json

{
    "name": "New Username",
    "password": "new_password"
}
```

## 📁 Project Structure

```
belay-chat-app/
├── app.py                 # Flask application entry point
├── requirements.txt       # Python dependencies
├── README.md             # Project documentation
├── static/               # Frontend static files
│   ├── index.html        # Main HTML template
│   ├── index.css         # Styling and responsive design
│   ├── index.js          # React components and logic
│   └── assets/           # Images and other static assets
├── db/                   # Database files
│   └── belay.sql         # Database schema
├── migrations/           # Database migrations
│   ├── 20240222161801_create_channels_table.sql
│   ├── 20240222161901_create_users_table.sql
│   ├── 20240222162001_create_messages_table.sql
│   ├── 20240222162101_create_reactions_table.sql
│   ├── 20240222162201_create_user_message_view_table.sql
│   └── 20240222162501_belay.sqlite3  # SQLite database file
└── docs/                 # Additional documentation
```

## 🎨 Design Features

- **Modern UI**: Clean, professional interface with gradient backgrounds
- **Responsive Layout**: Adapts seamlessly to different screen sizes
- **Real-time Updates**: Automatic message polling for live chat experience
- **Smooth Animations**: Subtle hover effects and transitions
- **Accessibility**: Keyboard navigation and screen reader support

## 🔄 Real-time Features

- **Message Polling**: New messages check every 500ms when in a channel
- **Unread Count Updates**: Updates every second across all channels
- **Automatic Read Marking**: Messages marked as read when viewing channel
- **Live Reply Counts**: Real-time updates of reply counts on messages

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Set `FLASK_ENV=production`
2. **Database**: Consider PostgreSQL for production use
3. **Static Files**: Serve static files through a web server (nginx/Apache)
4. **Security**: Use HTTPS and secure session cookies
5. **Monitoring**: Implement logging and error tracking

### Docker Support (Optional)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["flask", "run", "--host=0.0.0.0"]
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and submit a pull request

### Code Style
- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure responsive design for CSS changes

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Known Issues

- Image URLs must be directly accessible (no authentication required)
- Message history is limited to database storage capacity
- Real-time updates require active polling (consider WebSocket upgrade)

## 🚧 Future Enhancements

- [ ] WebSocket integration for true real-time messaging
- [ ] File upload and sharing capabilities
- [ ] Private direct messaging
- [ ] User presence indicators
- [ ] Message search functionality
- [ ] Push notifications
- [ ] Dark mode theme
- [ ] Message formatting (markdown support)
- [ ] User roles and permissions
- [ ] Channel archiving

---



**Built with ❤️ using Flask and React**
