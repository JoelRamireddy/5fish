# Build image
FROM node:lts AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm install --no-fund
COPY . ./
RUN npm run build

# Run image
FROM alpine:latest AS run
RUN apk add npm
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --production --no-fund
COPY --from=build /build ./
RUN chown -R node .

ARG NODE_PORT=8080
EXPOSE $NODE_PORT
ENV HOST=0.0.0.0
ENV PORT=$NODE_PORT

CMD ["npm", "run", "start"]
USER node

