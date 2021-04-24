FROM node:latest

# get ts
RUN npm install -g typescript

# set prod env
ENV NODE_ENV=production

# create workdir
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

# copy and install dependencies
COPY package*.json ./
RUN npm install --production

# copy and install bot
COPY . .
RUN npm run build

# expose http/https
EXPOSE 80
EXPOSE 443

# start bot
CMD ["node", "index.js"]