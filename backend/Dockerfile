FROM node:20-alpine

# FIX: Install OpenSSL dan library kompatibilitas untuk Prisma
RUN apk update && apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Generate Prisma Client (Penting dilakukan SETELAH install openssl)
RUN npx prisma generate

RUN npm run build

EXPOSE 8000

CMD ["npm", "start"]