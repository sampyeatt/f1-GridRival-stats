FROM node:22.18.0-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
