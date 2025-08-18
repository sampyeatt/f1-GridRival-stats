FROM node:22.18.0-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm","run","start"]

#FROM nginx:stable-alpine
#
#EXPOSE 80
##COPY ./nginx.conf /etc/nginx/conf.d/nginx.conf
#COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
