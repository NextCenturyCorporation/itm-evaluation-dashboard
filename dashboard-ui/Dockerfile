# syntax=docker/dockerfile:1.4
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Create Arguments
ARG PORT_ARG=3000
ENV PORT=$PORT_ARG
ENV PUPPETEER_SKIP_DOWNLOAD=1

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY ca-bundle.crt ./

RUN npm config set cafile ca-bundle.crt
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE $PORT_ARG
CMD [ "npm", "start" ]