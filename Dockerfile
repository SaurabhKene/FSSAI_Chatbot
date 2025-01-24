# Step 1: Use the official Node.js image as the base
# You can choose a specific version, e.g., node:18-alpine for a lightweight image
FROM node:18-alpine AS build

# Step 2: Set the working directory in the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the application code to the container
COPY . .

# Step 6: Build the React application
RUN npm run build

# Step 7: Use a lightweight web server for production
FROM nginx:stable-alpine

# Step 8: Copy the build files to Nginx's default HTML directory
COPY --from=build /app/build /usr/share/nginx/html

# Step 9: Expose port 80
EXPOSE 80

# Step 10: Start Nginx
CMD ["nginx", "-g", "daemon off;"]
