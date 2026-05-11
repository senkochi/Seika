FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw -q -DskipTests dependency:go-offline
COPY src/ src/
RUN ./mvnw -q -Dmaven.test.skip=true package
RUN rm -f target/original-*.jar
RUN mv target/*.jar /app/app.jar

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/app.jar /app/app.jar
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
