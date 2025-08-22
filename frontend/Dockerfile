FROM node:22.18.0-alpine as build
WORKDIR /app
COPY package*.json .
RUN npm install -g @angular/cli
RUN npm install
CMD ["ng", "build"]
COPY . .
CMD ["ng", "serve", "--host", "0.0.0.0"]
