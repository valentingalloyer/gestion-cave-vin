# Étape 1 : Build de l'application avec Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
# Copier le fichier pom.xml et les sources
COPY pom.xml .
COPY src ./src
# Construire le JAR en ignorant les tests pour gagner du temps au déploiement
RUN mvn clean package -DskipTests

# Étape 2 : Exécution de l'application
FROM eclipse-temurin:21-jre
WORKDIR /app
# On récupère le JAR généré à l'étape précédente
COPY --from=build /app/target/*.jar app.jar
# Port par défaut utilisé par Spring Boot et souvent attendu par Render
EXPOSE 8080
# Commande pour lancer l'application
ENTRYPOINT ["java", "-jar", "app.jar"]