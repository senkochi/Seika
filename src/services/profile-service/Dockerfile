FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
ARG MODULE_DIR
COPY ${MODULE_DIR}/target/*.jar /app/app.jar
ENTRYPOINT ["java","-jar","/app/app.jar"]
