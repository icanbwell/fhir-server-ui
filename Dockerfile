FROM node:20.11.1-bookworm-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json to the working directory
COPY package.json .

# Install dependencies
RUN yarn install

# Copy the rest of the application files to the working directory
COPY . .

# Expose port
EXPOSE 5051

# this gets replaced by the command in docker-compose
CMD ["tail", "-f", "/dev/null"]
