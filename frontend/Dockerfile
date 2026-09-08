# Build the app, then serve the static output. The previous image ran
# `ng serve` — the Angular dev server — in production, had two CMDs where only
# the last took effect, and copied the sources *after* the build stage, so the
# build it appeared to run could never have seen them.
FROM node:22.18.0-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:stable-alpine AS runtime
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
