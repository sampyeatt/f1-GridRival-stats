# Two stages so the runtime image does not carry TypeScript, Vitest and the
# rest of the build toolchain.
FROM node:22.18.0-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22.18.0-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# `npm start` applies pending migrations before the server accepts traffic.
USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
