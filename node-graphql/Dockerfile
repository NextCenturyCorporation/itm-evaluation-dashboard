FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Create Arguments
ARG PORT_ARG=9100
ENV PORT=$PORT_ARG

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Optional corporate CA bundle for npm (local dev only).
# Safely skipped on dev-server and production if not present.
ARG USE_CORP_CA=false

RUN --mount=type=bind,source=ca-bundle.crt,target=/tmp/ca-bundle.crt,required=false \
    if [ "$USE_CORP_CA" = "true" ] && [ -f /tmp/ca-bundle.crt ]; then \
      cp /tmp/ca-bundle.crt /usr/local/share/ca-bundle.crt && \
      npm config set cafile /usr/local/share/ca-bundle.crt; \
    else \
      echo "No corporate CA bundle (skipping)"; \
    fi

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE $PORT_ARG
CMD [ "node", "server.accounts.js" ]