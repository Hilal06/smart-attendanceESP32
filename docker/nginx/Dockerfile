FROM node:20-alpine as frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY docker/nginx/conf.d/app.conf /etc/nginx/conf.d/default.conf
COPY public /var/www/public
COPY --from=frontend /app/public/build /var/www/public/build
