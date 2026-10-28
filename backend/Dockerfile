# Built from the tree of one commit: git archive --format=tar <hash>:backend | docker build -t infinity-grove-backend:<hash> -
FROM eclipse-temurin:25.0.4.1_1-jdk AS build
WORKDIR /src
COPY . .
# Tests are not run here: the regression suite against the started container is the gate
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon && cp build/libs/*.jar /app.jar

FROM eclipse-temurin:25.0.4.1_1-jre
WORKDIR /app
COPY --from=build /app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
