# syntax=docker/dockerfile:1.4

FROM node:18 AS base
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Optional corporate CA bundle for npm (local dev only).
# Safely skipped on dev-server and production if not present.
ARG USE_CORP_CA=false

RUN --mount=type=secret,id=corp_ca \
    if [ "$USE_CORP_CA" = "true" ] && [ -f /run/secrets/corp_ca ]; then \
      cp /run/secrets/corp_ca /usr/local/share/ca-bundle.crt && \
      npm config set cafile /usr/local/share/ca-bundle.crt; \
    else \
      echo "No corporate CA bundle (skipping)"; \
    fi

ENV PUPPETEER_SKIP_DOWNLOAD=1

RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps

COPY . .

# ---------- DEV TARGET (local dev: npm start) ----------
FROM base AS dev
ARG PORT_ARG=3000
ENV PORT=$PORT_ARG
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "start"]

# ---------- BUILD TARGET (dev-server + prod build) ----------
FROM base AS build
# React build-time variables
ARG PUBLIC_URL=/
ENV PUBLIC_URL=$PUBLIC_URL

# Select config file at build time
ARG CONFIG_PATH=public/configs/prod/config.js
RUN test -f "$CONFIG_PATH"
COPY ${CONFIG_PATH} /usr/src/app/src/services/config.js

ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

# Install serve while we still have npm configured (corp CA, etc.)
RUN npm i -g serve

# ---------- RUNTIME TARGET (nginx serves build output) ----------
FROM nginx:alpine AS runtime

# Optional SPA config (recommended)
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /usr/src/app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
