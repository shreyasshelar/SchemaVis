# ── Stage 1: Build ──────────────────────────────────────────────
FROM maven:3.9.7-eclipse-temurin-21 AS builder
WORKDIR /build

# Download deps first (layer caching)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Build the fat JAR
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: Runtime ─────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Non-root user for security
RUN addgroup -S schemavis && adduser -S schemavis -G schemavis
USER schemavis

COPY --from=builder /build/target/schema-visualiser-1.0.0.jar app.jar

# Expose HTTP port
EXPOSE 8080

# Health check (uses Spring Actuator)
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
