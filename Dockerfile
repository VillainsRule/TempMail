FROM node:21.3.0-bullseye-slim
WORKDIR /app
COPY . .
RUN cd app && npm install && npx vite build
RUN cd ../server && npm install
COPY . .
CMD [ "node", "server/main.js" ]
