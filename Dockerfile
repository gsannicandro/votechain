FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY hardhat.config.js ./

RUN npm install

COPY contracts ./contracts
COPY scripts ./scripts

EXPOSE 8545 8546

CMD ["npx", "hardhat", "node"]