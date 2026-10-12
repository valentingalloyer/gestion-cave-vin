package com.beaupapa.gestioncave;

import com.beaupapa.gestioncave.entity.Degustation;
import com.beaupapa.gestioncave.entity.User;
import com.beaupapa.gestioncave.entity.Vin;
import com.beaupapa.gestioncave.repository.DegustationRepository;
import com.beaupapa.gestioncave.repository.UserRepository;
import com.beaupapa.gestioncave.repository.VinRepository;
import com.beaupapa.gestioncave.service.InitialisationProprietaire;
import com.beaupapa.gestioncave.service.ReinitialisationMotDePasse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests de l'API de bout en bout (HTTP -> sécurité -> base H2 en mémoire).
 * Chaque test repart d'une base vide (@Transactional annule ses écritures).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ApiTests {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository userRepository;
    @Autowired VinRepository vinRepository;
    @Autowired DegustationRepository degustationRepository;
    @Autowired PasswordEncoder passwordEncoder;

    User jack;
    User autre;
    Vin margaux;
    Vin vinDeLAutre;

    @BeforeEach
    void cave() {
        jack = utilisateur("jack", "secret");
        autre = utilisateur("autre", "secret");
        margaux = vin(jack, "Château Margaux", 2015, 6);
        vinDeLAutre = vin(autre, "Petrus", 2010, 3);
    }

    // --- Outils ---

    User utilisateur(String username, String password) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    Vin vin(User proprietaire, String nom, int millesime, int quantite) {
        Vin vin = new Vin();
        vin.setNom(nom);
        vin.setDomaine(nom);
        vin.setAppellation("Bordeaux");
        vin.setCouleur("Rouge");
        vin.setMillesime(millesime);
        vin.setQuantite(quantite);
        vin.setUser(proprietaire);
        return vinRepository.save(vin);
    }

    String token(String username, String password) throws Exception {
        String reponse = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("username", username, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(reponse).get("token").asText();
    }

    /** Requête authentifiée en tant que Jack */
    MockHttpServletRequestBuilder commeJack(MockHttpServletRequestBuilder requete) throws Exception {
        return requete.header("Authorization", "Bearer " + token("jack", "secret"))
                .contentType(MediaType.APPLICATION_JSON);
    }

    int quantite(Vin vin) {
        return vinRepository.findById(vin.getId()).orElseThrow().getQuantite();
    }

    // --- Tests ---

    @Nested
    class Authentification {

        @Test
        void connexionReussieRenvoieUnToken() throws Exception {
            assertThat(token("jack", "secret")).isNotBlank();
        }

        @Test
        void mauvaisMotDePasseOuCompteInconnuRefuses() throws Exception {
            for (String[] identifiants : new String[][]{{"jack", "faux"}, {"inconnu", "secret"}}) {
                mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                                .content(json.writeValueAsString(Map.of("username", identifiants[0], "password", identifiants[1]))))
                        .andExpect(status().isUnauthorized());
            }
        }

        @Test
        void ancienMotDePasseEnClairAccepteEtHashe() throws Exception {
            User ancien = new User();
            ancien.setUsername("ancien");
            ancien.setPassword("en-clair");
            userRepository.save(ancien);

            token("ancien", "en-clair");

            assertThat(userRepository.findByUsername("ancien").orElseThrow().getPassword()).startsWith("$2");
        }

        @Test
        void sansTokenOuAvecUnFauxTokenTouteLApiEstFermee() throws Exception {
            for (String url : new String[]{"/api/vins", "/api/degustations"}) {
                mvc.perform(get(url)).andExpect(status().isUnauthorized());
                mvc.perform(get(url).header("Authorization", "Bearer faux.token.jwt")).andExpect(status().isUnauthorized());
            }
            mvc.perform(put("/api/compte/mot-de-passe").contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void pingEstPublicEtLesInscriptionsFermees() throws Exception {
            mvc.perform(get("/api/ping")).andExpect(status().isOk());
            mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    class IsolationEntreComptes {

        @Test
        void chacunNeVoitQueSaCave() throws Exception {
            mvc.perform(commeJack(get("/api/vins")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].nom").value("Château Margaux"));
        }

        @Test
        void impossibleDeModifierOuSupprimerLaBouteilleDUnAutre() throws Exception {
            mvc.perform(commeJack(put("/api/vins/" + vinDeLAutre.getId())).content("{\"quantite\": 0}"))
                    .andExpect(status().isNotFound());
            mvc.perform(commeJack(delete("/api/vins/" + vinDeLAutre.getId())))
                    .andExpect(status().isNotFound());

            assertThat(quantite(vinDeLAutre)).isEqualTo(3);
        }

        @Test
        void impossibleDOuvrirLaBouteilleDUnAutre() throws Exception {
            mvc.perform(commeJack(post("/api/degustations")).content("{\"vinId\": " + vinDeLAutre.getId() + "}"))
                    .andExpect(status().isNotFound());

            assertThat(quantite(vinDeLAutre)).isEqualTo(3);
        }

        @Test
        void journalPersonnelEtImpossibleDeSupprimerLaDegustationDUnAutre() throws Exception {
            Degustation degustationDeLAutre = new Degustation();
            degustationDeLAutre.setUser(autre);
            degustationDeLAutre.setNom("Petrus");
            degustationDeLAutre.setDate(LocalDate.now());
            degustationRepository.save(degustationDeLAutre);

            mvc.perform(commeJack(get("/api/degustations"))).andExpect(jsonPath("$", hasSize(0)));
            mvc.perform(commeJack(delete("/api/degustations/" + degustationDeLAutre.getId())))
                    .andExpect(status().isNotFound());
            assertThat(degustationRepository.findById(degustationDeLAutre.getId())).isPresent();
        }
    }

    @Nested
    class Bouteilles {

        @Test
        void uneBouteilleAjouteeAppartientAuCompteConnecte() throws Exception {
            // Un id envoyé par le client ne doit pas écraser une bouteille existante
            mvc.perform(commeJack(post("/api/vins"))
                            .content("{\"id\": " + vinDeLAutre.getId() + ", \"nom\": \"Sancerre\", \"millesime\": 2023, \"quantite\": 2}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", not(vinDeLAutre.getId().intValue())));

            mvc.perform(commeJack(get("/api/vins"))).andExpect(jsonPath("$[*].nom", hasItem("Sancerre")));
            assertThat(vinRepository.findById(vinDeLAutre.getId()).orElseThrow().getNom()).isEqualTo("Petrus");
        }

        @Test
        void modificationDeTousLesChamps() throws Exception {
            mvc.perform(commeJack(put("/api/vins/" + margaux.getId())).content("""
                            {"nom": "Château Margaux", "domaine": "Château Margaux", "millesime": 2016,
                             "couleur": "Rouge", "appellation": "Bordeaux", "quantite": 4, "emplacement": "Cave B2",
                             "note": 5, "apogeeDebut": 2026, "apogeeFin": 2046, "notePersonnelle": "Superbe"}"""))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.millesime").value(2016))
                    .andExpect(jsonPath("$.emplacement").value("Cave B2"))
                    .andExpect(jsonPath("$.notePersonnelle").value("Superbe"));

            assertThat(vinRepository.findById(margaux.getId()).orElseThrow().getUser().getId()).isEqualTo(jack.getId());
        }
    }

    @Nested
    class JournalDeDegustation {

        @Test
        void ouvrirUneBouteilleLaRetireDeLaCave() throws Exception {
            mvc.perform(commeJack(post("/api/degustations")).content("""
                            {"vinId": %d, "date": "2026-10-10", "occasion": "Anniversaire", "note": 4, "commentaire": "Superbe"}"""
                            .formatted(margaux.getId())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.nom").value("Château Margaux"))
                    .andExpect(jsonPath("$.millesime").value(2015))
                    .andExpect(jsonPath("$.date").value("2026-10-10"))
                    .andExpect(jsonPath("$.occasion").value("Anniversaire"));

            assertThat(quantite(margaux)).isEqualTo(5);
        }

        @Test
        void jamaisSousZeroBouteille() throws Exception {
            Vin bu = vin(jack, "Bandol", 2022, 0);
            mvc.perform(commeJack(post("/api/degustations")).content("{\"vinId\": " + bu.getId() + "}"))
                    .andExpect(status().isOk());
            assertThat(quantite(bu)).isZero();
        }

        @Test
        void dateDuJourParDefaut() throws Exception {
            mvc.perform(commeJack(post("/api/degustations")).content("{\"vinId\": " + margaux.getId() + "}"))
                    .andExpect(jsonPath("$.date").value(LocalDate.now().toString()));
        }

        @Test
        void noteHorsLimitesRefusee() throws Exception {
            mvc.perform(commeJack(post("/api/degustations")).content("{\"vinId\": " + margaux.getId() + ", \"note\": 9}"))
                    .andExpect(status().isBadRequest());
            assertThat(quantite(margaux)).isEqualTo(6);
        }

        @Test
        void leJournalSurvitALaSuppressionDuVin() throws Exception {
            mvc.perform(commeJack(post("/api/degustations")).content("{\"vinId\": " + margaux.getId() + "}"));
            mvc.perform(commeJack(delete("/api/vins/" + margaux.getId()))).andExpect(status().isOk());

            mvc.perform(commeJack(get("/api/degustations")))
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].nom").value("Château Margaux"));
        }
    }

    @Nested
    class MotDePasse {

        void changer(String ancien, String nouveau, int statutAttendu) throws Exception {
            mvc.perform(commeJack(put("/api/compte/mot-de-passe"))
                            .content(json.writeValueAsString(Map.of("ancien", ancien, "nouveau", nouveau))))
                    .andExpect(status().is(statutAttendu));
        }

        @Test
        void ancienMotDePasseFauxRefuseSansDeconnecter() throws Exception {
            // 403 et pas 401 : un 401 déconnecterait l'utilisateur côté front
            changer("faux", "nouveau", 403);
        }

        @Test
        void quatreCaracteresMinimum() throws Exception {
            changer("secret", "abc", 400);
            changer("secret", "abcd", 204);
        }

        @Test
        void leNouveauMotDePasseRemplaceLAncien() throws Exception {
            changer("secret", "nouveau", 204);
            assertThat(token("jack", "nouveau")).isNotBlank();
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content(json.writeValueAsString(Map.of("username", "jack", "password", "secret"))))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    class MotDePasseOublie {

        void reinitialiser(String username, String password) {
            new ReinitialisationMotDePasse(userRepository, passwordEncoder, username, password).run(null);
        }

        @Test
        void imposeLeNouveauMotDePasse() throws Exception {
            reinitialiser("jack", "oubli");
            assertThat(token("jack", "oubli")).isNotBlank();
        }

        @Test
        void neSAppliqueQuUneFoisMemeSiLesVariablesRestent() throws Exception {
            reinitialiser("jack", "oubli");
            // Jack choisit ensuite son propre mot de passe...
            mvc.perform(put("/api/compte/mot-de-passe")
                            .header("Authorization", "Bearer " + token("jack", "oubli"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json.writeValueAsString(Map.of("ancien", "oubli", "nouveau", "perso"))))
                    .andExpect(status().isNoContent());

            // ... et le redémarrage suivant de Render ne doit pas l'écraser
            reinitialiser("jack", "oubli");
            assertThat(token("jack", "perso")).isNotBlank();
        }

        @Test
        void uneNouvelleValeurEstAppliqueeAUneNouvelleFois() throws Exception {
            reinitialiser("jack", "oubli");
            reinitialiser("jack", "oubli-2");
            assertThat(token("jack", "oubli-2")).isNotBlank();
        }

        @Test
        void ignoreUnCompteInconnuOuUnMotDePasseTropCourt() throws Exception {
            reinitialiser("inconnu", "oubli");
            reinitialiser("jack", "abc");
            assertThat(token("jack", "secret")).isNotBlank();
        }
    }

    @Nested
    class CompteProprietaire {

        @Test
        void creeLeCompteEtRecupereLesVinsSansProprietaire() throws Exception {
            Vin orphelin = vin(null, "Vin d'avant l'authentification", 2012, 2);

            new InitialisationProprietaire(userRepository, vinRepository, passwordEncoder, "proprietaire", "abcd")
                    .run(null);

            User proprietaire = userRepository.findByUsername("proprietaire").orElseThrow();
            assertThat(vinRepository.findByUserId(proprietaire.getId()))
                    .extracting(Vin::getId).containsExactly(orphelin.getId());
            // Les vins qui ont déjà un propriétaire ne bougent pas
            assertThat(vinRepository.findByUserId(jack.getId())).hasSize(1);
        }

        @Test
        void neTouchePasAUnCompteExistant() throws Exception {
            String hashAvant = jack.getPassword();
            new InitialisationProprietaire(userRepository, vinRepository, passwordEncoder, "jack", "autre-mot-de-passe")
                    .run(null);
            assertThat(userRepository.findByUsername("jack").orElseThrow().getPassword()).isEqualTo(hashAvant);
        }
    }
}
