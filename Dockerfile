FROM node:24.14-bookworm-slim

# Enable Corepack for Yarn 4 (requires root)
RUN corepack enable

# Set the working directory inside the container
RUN mkdir -p /app && chown node:node /app
WORKDIR /app

# Setting user as node and not using root user for security purpose
USER node

# Copy Yarn configuration and lockfile first for better layer caching
COPY --chown=node:node package.json .
COPY --chown=node:node yarn.lock .
COPY --chown=node:node .yarnrc.yml .

# Install dependencies
RUN yarn install --immutable

# Copy the rest of the application files to the working directory
COPY --chown=node:node . .

# Expose port
EXPOSE 5051

# this gets replaced by the command in docker-compose
CMD ["tail", "-f", "/dev/null"]
