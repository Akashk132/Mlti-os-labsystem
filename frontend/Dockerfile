FROM node:18-alpine

WORKDIR /app

# Copy package files (we will initialize a react app next)
COPY package.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "dev", "--", "--host"]
