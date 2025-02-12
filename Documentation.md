# TechTales - Blog Platform API

**Version:** 1.0.0  
**Author:** Syed Tasavour  
**License:** ISC  

## Documentation & Resources

- **Postman Collection:** [Postman Collection](backend.postman_collection.json)
- **API Base URL:** [http://localhost:3000/api/v1/](http://localhost:3000/api/v1/)
- **GitHub Repository:** [Syed Tasavour](https://github.com/syedtasavour/TechTales)


## 🌟 Show Your Support
If you found this project helpful, give it a ⭐️!

### Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Setup & Installation](#setup--installation)
4. [API Features & Endpoints](#api-features--endpoints)
5. [Authentication System](#authentication-system)
6. [Database Design](#database-design)
7. [File Upload System](#file-upload-system)
8. [Deployment Guide (AWS)](#deployment-guide-aws)
9. [Security Measures](#security-measures)
10. [Testing Guide](#testing-guide)
11. [Monitoring & Logging](#monitoring--logging)
12. [Troubleshooting](#troubleshooting)
13. [Administrative Setup Guide](#administrative-setup-guide)

---

## 1. Introduction

TechTales is a professional blogging platform API built with:
- Node.js & Express.js for the backend
- MongoDB for the database
- JWT for authentication
- Cloudinary for media storage
- AWS for deployment

**Key Features:**
- Multi-user blogging platform
- Role-based access control
- Media management
- Comment system
- Like/Unlike functionality
- Search capabilities
- Admin dashboard

---

## 2. System Architecture

**Application Layers:**

1. **Presentation Layer:**
  - REST API endpoints
  - Request/Response handling
  - Input validation

2. **Business Layer:**
  - Controllers
  - Services
  - Middleware

3. **Data Layer:**
  - MongoDB models
  - Data access logic
  - Caching (future implementation)

4. **External Services:**
  - Cloudinary (media storage)
  - JWT (authentication)
  - AWS (hosting)

---

## 3. Setup & Installation

**Local Development Setup:**

### 1. Prerequisites:
```bash
# Required software
Node.js >= 14.x
MongoDB >= 4.x
Git
```

### 2. Clone & Install:
```bash
# Clone repository
git clone https://github.com/syedtasavour/TechTales.git
cd TechTales

# Install dependencies
npm install

# Create environment file
cp .env.sample .env
```

### 3. Environment Configuration:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/techtales

# Authentication
ACESS_TOKEN_SECRET=your_secure_token_here
REFRESH_TOKEN_SECRET=your_secure_refresh_token
ACESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 4. Start Development:
```bash
# Run with nodemon
npm run dev

# Run production
npm start
```

---

## 4. API Features & Endpoints

### Authentication Endpoints

1. **User Registration**  
  POST `/api/v1/users/register`
  ```json
  {
    "fullName": "User Name",
    "username": "unique_username",
    "email": "user@example.com",
    "password": "secure_password",
    "avatar": "file_upload"
  }
  ```

2. **User Login**  
  POST `/api/v1/users/login`
  ```json
  {
    "email": "user@example.com",
    "password": "secure_password"
  }
  ```

### Blog Management

1. **Create Blog**  
  POST `/api/v1/blogs`
  ```json
  {
    "title": "Blog Title",
    "content": "Blog Content",
    "featureImage": "file_upload",
    "contentImages": ["file_upload"],
    "category": "category_id",
    "isPublished": true
  }
  ```

2. **Update Blog**  
  PATCH `/api/v1/blogs/:permalink`
  ```json
  {
    "title": "Updated Title",
    "content": "Updated Content"
  }
  ```

---

## 5. Authentication System

JWT-based authentication with:

1. **Access Token:**
  - Short-lived (1 day)
  - Used for API requests
  - Stored in HTTP-only cookie

2. **Refresh Token:**
  - Long-lived (10 days)
  - Used to get new access tokens
  - Stored in HTTP-only cookie

3. **Security Features:**
  - Password hashing (bcrypt)
  - HTTP-only cookies
  - CORS protection
  - Rate limiting

---

## 6. Database Design

### MongoDB Collections

1. **users**
  ```javascript
  {
    fullName: String,
    username: String,
    email: String,
    password: String,
    avatar: String,
    role: String,
    refreshToken: String
  }
  ```

2. **blogs**
  ```javascript
  {
    title: String,
    content: String,
    permalink: String,
    featureImage: String,
    contentImages: [String],
    author: ObjectId,
    category: ObjectId,
    status: String,
    isPublished: Boolean
  }
  ```

---

## 7. File Upload System

Using Cloudinary for media storage:

1. **Supported File Types:**
  - Images: JPG, PNG, GIF
  - Max file size: 5MB

2. **Upload Process:**
  - Client uploads to server
  - Server uploads to Cloudinary
  - Cloudinary URL stored in database

---

## 8. Deployment Guide (AWS)

### A. EC2 Deployment

#### 1. Launch EC2 Instance:
```bash
# Connect to instance
ssh -i "key.pem" ec2-user@your-instance-ip

# Update system
sudo yum update -y

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs

# Install PM2
npm install pm2 -g
```

#### 2. Setup Application:
```bash
# Clone repository
git clone https://github.com/syedtasavour/TechTales.git
cd TechTales

# Install dependencies
npm install

# Setup environment
vim .env

# Start with PM2
pm2 start src/index.js --name techtales
```

#### 3. Setup Nginx:
```bash
# Install Nginx
sudo yum install nginx -y

# Configure Nginx
sudo vim /etc/nginx/conf.d/techtales.conf

# Example Nginx configuration
server {
    listen 80;
    server_name your-domain.com;

    location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
    }
}

# Start Nginx
sudo systemctl start nginx
```

### B. Using Elastic Beanstalk

#### 1. Setup EB CLI:
```bash
pip install awsebcli
```

#### 2. Initialize EB:
```bash
eb init techtales --platform node.js --region us-east-1
```

#### 3. Deploy:
```bash
eb create techtales-env
```

### C. Using ECS (Docker)

#### 1. Create Dockerfile:
```dockerfile
FROM node:14
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

#### 2. Build & Push:
```bash
docker build -t techtales .
aws ecr create-repository --repository-name techtales
docker tag techtales:latest $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/techtales
docker push $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/techtales
```

---

## 9. Security Measures

- Input Validation 
- XSS Protection  (future implementation)
- CSRF Protection  (future implementation)
- Rate Limiting  (future implementation)
- Security Headers  (future implementation)
- Data Encryption  (future implementation)

---

## 10. Testing Guide

**Using Postman Collection:**

1. **Import Collection:**
  - Import `backend.postman_collection.json`
  - Set environment variables

2. **Test Flow:**
  - Register user
  - Login
  - Create blog
  - Test CRUD operations

---

## 11. Monitoring & Logging

- AWS CloudWatch setup
- Error tracking
- Performance monitoring
- Log management

---

## 12. Troubleshooting

**Common Issues:**
- Connection errors
- Authentication issues
- File upload problems
- Performance issues

**Support:**
- GitHub Issues
- Email: Hi@syedtasavour.me
- Documentation: [TechTales Docs](Documentation.md)

---

## Administrative Setup Guide

### 1. Create Admin User

#### A. Register Normal User First:
```bash
POST /api/v1/users/register
{
  "fullName": "Admin User",
  "username": "admin",
  "email": "admin@techtales.com",
  "password": "secure_admin_password"
}
```

#### B. Update User Role in MongoDB:
```javascript
// Connect to MongoDB shell
mongosh "your_mongodb_uri"

// Switch to blog database
use blog

// Update user role to admin
db.users.updateOne(
  { email: "admin@techtales.com" },
  { $set: { role: "ADMIN" } }
)

// Verify update
db.users.findOne({ email: "admin@techtales.com" })
```

#### C. Using MongoDB Compass:
1. Open MongoDB Compass  
2. Connect to your database  
3. Navigate to the 'blog' database  
4. Open the 'users' collection  
5. Find the user by email  
6. Update the role field to "ADMIN"

---

### 2. Default Category Setup

#### A. Create Default Category:
```bash
# Login as admin first
POST /api/v1/category
{
  "name": "Uncategorized",
  "description": "Default category for all posts",
  "image": "optional_category_image"
}
```

#### B. Update Default Category ID:
```javascript
// In MongoDB shell
use blog

// Find category ID
```javascript
// Check for the "Uncategorized" category
let category = db.categories.findOne({ name: "Uncategorized" });

if (!category) {
  // Create "Uncategorized" category if it doesn't exist
  category = db.categories.insertOne({
    name: "Uncategorized",
    description: "Default category for all posts",
    image: "optional_category_image",
    status: "approved" // optional, if you have a status field
  });
  print("Created default category 'Uncategorized'.");
} else {
  print("Default category 'Uncategorized' already exists.");
}
```

// Add to .env file:
DEFAULT_CATEGORY_ID=your_category_id
```

#### C. Update Application Code:
```javascript
// In src/constants.js
export const DEFAULT_CATEGORY_ID = process.env.DEFAULT_CATEGORY_ID || "your_category_id";

// In blog creation logic (src/controllers/blog.controller.js)
const category = req.body.category || DEFAULT_CATEGORY_ID;
```

---

### 3. Admin Privileges

**Admin users can access:**

#### A. User Management:
- View all users
- Update user roles
- Disable/Enable users

#### B. Content Management:
- Approve/Reject blogs
- Manage categories
- Moderate comments

#### C. System Settings:
- Configure default settings
- Manage feature flags
- View system statistics

**Admin API Endpoints:**

##### The admin can access all endpoints without any checks, so you can assign any endpoint of authors or editors to the admin role as well, allowing them to access and manipulate all user data
```bash
# Blog Management
POST /api/v1/admin/blogs/status
{
  "permalink": "blog-permalink",
  "status": "approved"
}

# Category Management
POST /api/v1/admin/category/status
{
  "name": "Category Name",
  "status": "approved"
}

# Comment Moderation
GET /api/v1/admin/comments/pending
PATCH /api/v1/admin/comments/pending
{
  "commentId": "comment_id",
  "status": "approved"
}
```

---

### 4. Security Considerations

#### A. Admin Account Security:
- Use strong passwords
- Enable 2FA (future implementation)
- Regular password rotation
- IP restriction (future implementation)

#### B. Access Control:
- All admin routes are protected
- Role verification middleware
- Action logging

#### C. Audit Trail:  (future implementation)
```javascript
// Example audit log schema
{
  action: String,
  performedBy: ObjectId,
  targetResource: String,
  timestamp: Date,
  details: Object
}
```

---

### 5. Monitoring Admin Actions  (future implementation)

#### A. Logging System:
```javascript
// Example logging middleware
const adminActionLogger = async (req, res, next) => {
  const action = {
    adminId: req.user._id,
    action: req.method,
    path: req.path,
    timestamp: new Date(),
    details: req.body
  };
  await AdminLog.create(action);
  next();
};
```

#### B. Activity Dashboard:  (future implementation)
- View all admin actions
- Filter by action type
- Export activity logs

---