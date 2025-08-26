FROM node:22.18.0-alpine as build
WORKDIR /app
COPY package*.json .
RUN npm install -g @angular/cli
RUN npm install
CMD ["ng","build", "--configuration", "production"]
COPY . .
CMD ["ng", "serve", "--configuration", "production", "--host", "0.0.0.0"]
