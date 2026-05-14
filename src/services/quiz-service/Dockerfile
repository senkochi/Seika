FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q -Dmaven.test.skip=true package
RUN JAR_FILE=$(ls target/*.jar | grep -v 'original' | head -n 1) && cp "$JAR_FILE" /workspace/app.jar

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /workspace/app.jar /app/app.jar
ENTRYPOINT ["java","-jar","/app/app.jar"]
