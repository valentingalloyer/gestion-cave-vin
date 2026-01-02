FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copier le wrapper et le pom d'abord (pour mettre en cache les dépendances)
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
# Donner les permissions d'exécution au wrapper
RUN chmod +x mvnw
# Télécharger les dépendances (cette étape sera mise en cache)
RUN ./mvnw dependency:go-offline

# Copier les sources et construire
COPY src ./src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]