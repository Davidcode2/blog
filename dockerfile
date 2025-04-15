FROM node:22-alpine AS builder

WORKDIR /app

# Install Java, Graphviz, and PlantUML
RUN apk add --no-cache openjdk17-jre graphviz
# Create the PlantUML directory
RUN mkdir -p /root/.plantuml
# Download PlantUML jar
RUN wget -O /root/.plantuml/plantuml.jar https://github.com/plantuml/plantuml/releases/latest/download/plantuml.jar

COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
RUN echo "text/yaml                   yaml yml;" >> /etc/nginx/mime.types
COPY --from=builder /app/_site /var/www/html

EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

