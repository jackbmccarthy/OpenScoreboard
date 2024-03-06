# # Use the official Node.js 20 Alpine image
# FROM node:20-alpine

# # Install Git
# RUN apk add --no-cache git

# # Set the working directory in the container
# WORKDIR /app

# # Clone the repository
# RUN git clone https://github.com/jackbmccarthy/OpenScoreboard.git .

# # Install dependencies and run preinstall
# RUN npm install \
#      && npm run preinstall \
#      && npm run build \
#      && rm -rf openscoreboard-app/node_modules openscoreboard-editor/node_modules openscoreboard-scoreboard/node_modules \
#      && npm prune --production





# # Expose port 8080
# EXPOSE 8080

# # Run the application
# CMD ["npm", "start"]
# Stage 1: Build the application
FROM node:20-alpine as build

# Install Git
RUN apk add --no-cache git

# Set the working directory in the container
WORKDIR /app

# Clone the repository
RUN git clone https://github.com/jackbmccarthy/OpenScoreboard.git .

# Install dependencies and run preinstall
RUN npm install --no-optional && npm run install:children && npm run build

# Stage 2: Create a smaller production image
FROM node:20-alpine

RUN apk add --no-cache git

# Set the working directory in the container
WORKDIR /app

# Copy built files from the previous stage
COPY --from=build /app/openscoreboard-app/dist /app/openscoreboard-app/dist
COPY --from=build /app/openscoreboard-editor/dist /app/openscoreboard-editor/dist
COPY --from=build /app/openscoreboard-scoreboard/dist /app/openscoreboard-scoreboard/dist

COPY --from=build /app/routes /app/routes
COPY --from=build /app/server.ts .
COPY --from=build /app/tsconfig.json .
COPY --from=build /app/index.ts .
COPY --from=build /app/package.json  .

# Prune unnecessary dependencies
RUN npm install --production --no-optional
 


ENV NODE_ENV=production
# Expose port if needed
EXPOSE 8080

# Command to run the application
CMD ["npm", "start"]

