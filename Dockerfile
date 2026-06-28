# Use an official lightweight Node.js runtime as a parent image
FROM node:18-slim

# Install system dependencies (ffmpeg, python3, and curl)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Download and set up yt-dlp globally inside the container
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy the rest of your local application code
COPY . .

# Expose the port your server listens on
EXPOSE 3000

# Start the Node.js server
CMD [ "node", "server.js" ]

