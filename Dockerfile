FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Default environment variables that can be overridden by docker-compose
ENV MONGODB_URI=mongodb://host.docker.internal:27017/job-portal
ENV JWT_SECRET=your_jwt_secret_key
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"] 