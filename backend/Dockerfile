# Stage 1: Build Java Spring Boot Artifact
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copy POM and download dependencies for caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build application JAR
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Lightweight Runtime Image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install wget for Docker healthcheck
RUN apk add --no-cache wget

# Copy built JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose Spring Boot port
EXPOSE 8080

# Environment Defaults
ENV SERVER_PORT=8080
ENV ADMIN_PASSWORD=mysuperdupercoopersecret

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
