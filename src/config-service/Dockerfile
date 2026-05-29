FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
ARG MODULE_DIR=src/config-service
COPY . .
RUN mvn -q -N -DskipTests install
RUN mvn -q -DskipTests -pl ${MODULE_DIR} -am dependency:go-offline
RUN mvn -q -DskipTests -pl ${MODULE_DIR} -am package
RUN JAR_FILE=$(ls ${MODULE_DIR}/target/*.jar | grep -v 'original' | head -n 1) && cp "$JAR_FILE" /workspace/app.jar

FROM eclipse-temurin:21-jre-jammy
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /workspace/app.jar /app/app.jar
ENTRYPOINT ["java","-jar","/app/app.jar"]
