# Job Portal API

A RESTful API for a freelancing job portal where employers can post jobs and freelancers can bid on them.

## Features

- User authentication (JWT-based)
- Job posting and management
- Bidding system
- Role-based access control
- API documentation with Swagger
- Rate limiting to prevent abuse
- Docker support for easy deployment

## API Endpoints

### User Authentication

- **POST** `/api/auth/register` - Register a new user (Freelancer or Employer)
- **POST** `/api/auth/login` - Authenticate user & return JWT token
- **GET** `/api/auth/profile` - Get user profile

### Job Posting

- **POST** `/api/jobs/create` - Employers can post a job
- **GET** `/api/jobs` - Retrieve all job postings
- **GET** `/api/jobs/:jobId` - Retrieve details of a specific job
- **GET** `/api/jobs?skills=react,nodejs` - Filter jobs by required skills
- **GET** `/api/jobs/my-jobs` - Get jobs posted by the logged in employer

### Freelancer Bidding

- **POST** `/api/bids/:jobId` - Freelancers can place a bid
- **GET** `/api/bids/:jobId` - Retrieve all bids for a job
- **GET** `/api/bids/my-bids` - Get bids placed by the logged in freelancer

### Bid Management

- **PATCH** `/api/bids/:bidId/accept` - Employers accept a bid
- **PATCH** `/api/bids/:bidId/reject` - Employers reject a bid

## Technology Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT for authentication
- Swagger for API documentation
- Express Rate Limit for preventing abuse
- Docker for containerization

## Rate Limiting

To protect the API from abuse and ensure fair usage, the following rate limits are implemented:

- **Global Limit**: 100 requests per 15 minutes per IP address
- **Authentication Endpoints**: 10 requests per hour per IP address
- **Job Posting**: 20 job posts per hour per IP address
- **Bidding**: 30 bids per hour per IP address

Rate limit headers are included in responses to indicate usage status.

## Getting Started

### Prerequisites

- Node.js
- MongoDB
- Docker and Docker Compose (optional, for containerized setup)

### Standard Installation

1. Clone the repository
2. Install dependencies
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/job-portal
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```
4. Start the server
   ```
   npm run dev
   ```

### Docker Installation

1. Clone the repository
2. Run with Docker Compose:
   ```
   docker-compose up
   ```
   This will start both the application and MongoDB in containers.

3. For production, you may want to run in detached mode:
   ```
   docker-compose up -d
   ```

4. To stop the containers:
   ```
   docker-compose down
   ```

### API Documentation

Once the server is running, you can access the API documentation at:
```
http://localhost:5000/api-docs
```

## Testing with Postman

Import the included Postman collection and environment files to test the API:
- `job-portal-api.postman_collection.json`
- `job-portal-api.postman_environment.json`

## License

MIT 