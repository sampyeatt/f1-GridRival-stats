FROM node:latest as build

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm build

FROM nginx:latest

COPY --from=angular /app/dist/ /usr/share/nginx/html

EXPOSE 80
