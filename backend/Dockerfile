FROM node:22.18.0 as angular

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install -g @angular/cli

COPY .. .

RUN npm run build --config=production

FROM nginx:latest

COPY --from=angular /app/dist/ /usr/share/nginx/html

EXPOSE 80
