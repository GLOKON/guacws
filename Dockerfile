FROM node:16

ENV GUACD_HOST=127.0.0.1
ENV GUACD_PORT=4822
ENV CRYPT_CYPHER='AES-256-CBC'
EXPOSE 8080

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD [ "node", "server.js" ]
