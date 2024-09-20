FROM node:20.13.1-alpine3.20

ENV NODE_ENV production

WORKDIR /app

COPY package*.json ./
RUN npm i ffmpeg-static
RUN npm install
COPY . .

RUN node ./deploy-commands.js

CMD ["node", "bot.js"]
