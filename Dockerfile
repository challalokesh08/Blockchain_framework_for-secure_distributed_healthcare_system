FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/
RUN npm install --prefix client
RUN npm install --prefix server
COPY server ./server
COPY client ./client
RUN npm run build --prefix client

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist
WORKDIR /app/server
RUN npm install --production
EXPOSE 4000
CMD ["node", "index.js"]
