"""
EduStream - Suite de Tests E2E Automatisés avec Selenium WebDriver
================================================================
Ce fichier implémente une suite complète de tests de bout en bout (E2E)
couvrant le parcours utilisateur complet :
1. Navigation et exploration du catalogue (devises en DH, recherche).
2. Tentative de connexion avec compte inexistant, puis création d'un compte aléatoire.
3. Parcours d'inscription et paiement bancaire (Étape 1 & Étape 2).
4. Page de succès et accès immédiat à la formation débloquée.
5. Espace d'apprentissage interactif (lecteur, complétion de leçon, progression).
6. Tableau de bord étudiant (/dashboard) avec affichage des cours acquis.
7. Protection contre les paiements en double (Already Enrolled).

Support du mode ralenti (--slow / --delay) :
Permet d'observer à vitesse humaine la saisie, le défilement et les clics.
"""

import os
import sys
import time
import unittest
import uuid

# Ensure UTF-8 output encoding on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.edge.options import Options as EdgeOptions


class EduStreamSeleniumE2ETest(unittest.TestCase):
    BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
    BROWSER = os.environ.get("SELENIUM_BROWSER", "chrome").lower()
    HEADLESS = os.environ.get("SELENIUM_HEADLESS", "true").lower() in ("true", "1", "yes")

    driver = None

    @classmethod
    def setUpClass(cls):
        print(f"\n============================================================")
        print(f"[SELENIUM] DEMARRAGE DE LA SUITE DE TESTS EDUSTREAM")
        print(f"   URL Cible  : {cls.BASE_URL}")
        print(f"   Navigateur : {cls.BROWSER.upper()} (Headless={cls.HEADLESS})")
        print(f"   Délai pas  : {os.environ.get('SELENIUM_DELAY', '0.0')}s")
        print(f"============================================================")

        if cls.BROWSER == "edge":
            options = EdgeOptions()
            if cls.HEADLESS:
                options.add_argument("--headless=new")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1400,900")
            cls.driver = webdriver.Edge(options=options)
        else:
            options = ChromeOptions()
            if cls.HEADLESS:
                options.add_argument("--headless=new")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--window-size=1400,900")
            cls.driver = webdriver.Chrome(options=options)

        cls.driver.implicitly_wait(10)
        cls.wait = WebDriverWait(cls.driver, 15)

        # Génération d'un étudiant unique pour ce cycle de test
        uid = uuid.uuid4().hex[:6]
        cls.test_student = {
            "firstName": "Youssef",
            "lastName": "El Amrani",
            "email": f"youssef.elamrani-{uid}@example.ma",
            "password": "Password123!",
            "phone": "+212 6 12 34 56 78",
        }

    @classmethod
    def tearDownClass(cls):
        if cls.driver:
            cls.driver.quit()
        print(f"\n============================================================")
        print(f"[TERMINE] FIN DES TESTS SELENIUM EDUSTREAM")
        print(f"============================================================\n")

    # -------------------------------------------------------------------------
    # Helpers d'interaction visuelle et de ralentissement
    # -------------------------------------------------------------------------
    def get_delay(self):
        """Récupère le délai configuré (par défaut 1.0s en mode visible, 0 en headless)."""
        return float(os.environ.get("SELENIUM_DELAY", "0.0"))

    def visual_pause(self, factor=1.0):
        """Pause visible pour permettre à l'utilisateur d'observer l'action à l'écran."""
        delay = self.get_delay()
        if delay > 0:
            time.sleep(delay * factor)
        else:
            time.sleep(0.05)

    def highlight_element(self, element, color="#a855f7"):
        """Entoure visuellement l'élément d'un halo coloré avant l'action."""
        if self.get_delay() > 0:
            try:
                self.driver.execute_script(
                    f"arguments[0].style.outline = '3px solid {color}'; arguments[0].style.boxShadow = '0 0 15px {color}';",
                    element
                )
                time.sleep(0.2)
            except Exception:
                pass

    def smooth_scroll(self, pixels=350):
        """Défilement fluide animé de la page."""
        if self.get_delay() > 0:
            self.driver.execute_script(f"window.scrollBy({{top: {pixels}, behavior: 'smooth'}});")
            self.visual_pause(0.5)

    def scroll_into_view(self, element):
        """Centre l'élément avec une animation fluide."""
        if self.get_delay() > 0:
            self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element)
            self.visual_pause(0.3)

    def fill_input(self, element, text, delay_per_char=0.035):
        """Efface et saisit du texte de façon progressive et compatible React."""
        self.scroll_into_view(element)
        self.highlight_element(element, "#06b6d4")
        element.send_keys(Keys.CONTROL + "a")
        element.send_keys(Keys.BACKSPACE)
        if self.get_delay() > 0:
            for char in text:
                element.send_keys(char)
                time.sleep(delay_per_char)
            self.visual_pause(0.3)
        else:
            element.send_keys(text)

    def click_element(self, element, color="#22c55e"):
        """Met en valeur un élément et clique dessus avec une pause visuelle."""
        self.scroll_into_view(element)
        self.highlight_element(element, color)
        self.visual_pause(0.4)
        element.click()
        self.visual_pause(0.6)

    # -------------------------------------------------------------------------
    # TESTS
    # -------------------------------------------------------------------------
    def test_01_catalogue_and_dh_pricing(self):
        """Vérifie la page d'accueil, le catalogue et la tarification en Dirhams (DH)."""
        print("\n[TEST 1] Vérification du catalogue et de la devise DH...")
        self.driver.get(self.BASE_URL)
        self.visual_pause(0.8)

        # Vérifier la présence de la marque edustream
        brand = self.wait.until(EC.presence_of_element_located((By.XPATH, "//span[contains(text(), 'edustream')]")))
        self.highlight_element(brand, "#ec4899")
        self.assertIsNotNone(brand)

        # Défilement fluide vers le catalogue
        self.smooth_scroll(500)

        # Attendre que les cartes du catalogue soient affichées
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "article")))

        # Vérifier les cartes du catalogue et les prix en DH
        cards = self.driver.find_elements(By.TAG_NAME, "article")
        self.assertGreaterEqual(len(cards), 3, "Le catalogue doit afficher au moins 3 cours")
        for card in cards:
            self.highlight_element(card, "#8b5cf6")
            self.assertIn("DH", card.text, "Chaque cours doit afficher son tarif en Dirhams (DH)")
        print(f"  -> {len(cards)} cours trouvés dans le catalogue avec tarif en DH validé.")
        self.visual_pause(0.6)

        # Tester le champ de recherche
        search_box = self.wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Rechercher un cours...']")))
        print("  -> Saisie progressive dans la recherche : 'React'...")
        self.fill_input(search_box, "React")
        self.visual_pause(0.6)

        react_heading = self.driver.find_element(By.XPATH, "//h3[contains(text(), 'React avancé')]")
        self.highlight_element(react_heading, "#10b981")
        self.assertTrue(react_heading.is_displayed())
        print("  -> Filtrage du catalogue fonctionnel pour 'React'.")
        self.visual_pause(0.8)

    def test_02_student_registration_and_login(self):
        """
        Teste d'abord une tentative de connexion avec des identifiants inexistants,
        vérifie le rejet d'authentification, puis crée un nouveau compte étudiant aléatoire.
        """
        print("\n[TEST 2] Tentative de connexion avec compte inexistant puis création de compte aléatoire...")
        self.driver.get(self.BASE_URL)
        self.visual_pause(0.8)

        # 1. Ouvrir la modale d'authentification
        login_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Se connecter')]")))
        print("  -> Clic sur 'Se connecter'...")
        self.click_element(login_btn, "#a855f7")

        # 2. Saisir un email et mot de passe inexistants
        fake_email = f"inconnu-{uuid.uuid4().hex[:6]}@inexistant.ma"
        fake_pwd = "FauxMotDePasse999!"
        print(f"  -> Test de connexion avec compte inexistant : '{fake_email}'...")

        email_input = self.wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='nom@exemple.ma']")))
        self.fill_input(email_input, fake_email)

        password_input = self.driver.find_element(By.XPATH, "//input[@placeholder='••••••••']")
        self.fill_input(password_input, fake_pwd)

        # 3. Soumettre la tentative de connexion
        submit_login = self.driver.find_element(By.XPATH, "//button[@type='submit' and contains(text(), 'Se connecter')]")
        self.click_element(submit_login, "#ef4444")

        # 4. Vérifier que la tentative échoue avec le message d'erreur
        error_box = self.wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(@class, 'bg-red-500') or contains(text(), 'invalide') or contains(text(), 'incorrect')]"))
        )
        self.highlight_element(error_box, "#ef4444")
        self.assertTrue(error_box.is_displayed(), "Le message d'erreur d'authentification doit apparaître pour un compte inexistant.")
        print(f"  -> Rejet validé avec succès pour le compte inexistant : '{error_box.text}'")
        self.visual_pause(1.0)

        # 5. Basculer sur l'onglet 'Créer un compte'
        print("  -> Bascule vers l'onglet 'Créer un compte'...")
        register_tab = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Créer un compte')]")))
        self.click_element(register_tab, "#a855f7")

        # 6. Générer une nouvelle identité étudiante aléatoire et unique
        new_uid = uuid.uuid4().hex[:6]
        self.__class__.test_student = {
            "firstName": f"Youssef{new_uid[:3]}",
            "lastName": f"ElAmrani{new_uid[3:]}",
            "email": f"etudiant.auto-{new_uid}@example.ma",
            "password": "SecurePassword123!",
            "phone": "+212 6 12 34 56 78",
        }
        print(f"  -> Création d'un nouveau compte aléatoire : {self.test_student['email']}...")

        # 7. Remplir le formulaire d'inscription
        first_name_input = self.wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Jean']")))
        self.fill_input(first_name_input, self.test_student["firstName"])

        last_name_input = self.driver.find_element(By.XPATH, "//input[@placeholder='Dupont']")
        self.fill_input(last_name_input, self.test_student["lastName"])

        email_reg = self.driver.find_element(By.XPATH, "//input[@placeholder='nom@exemple.ma']")
        self.fill_input(email_reg, self.test_student["email"])

        password_reg = self.driver.find_element(By.XPATH, "//input[@placeholder='••••••••']")
        self.fill_input(password_reg, self.test_student["password"])

        # 8. Soumettre l'inscription
        submit_btn = self.driver.find_element(By.XPATH, "//button[@type='submit' and contains(text(), \"S'inscrire\")]")
        print("  -> Clic sur 'S'inscrire'...")
        self.click_element(submit_btn, "#22c55e")

        # 9. Vérifier que la modale se ferme et que la session est active (bouton 'Tableau de bord' visible)
        dashboard_btn = self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Tableau de bord')]")))
        self.highlight_element(dashboard_btn, "#10b981")
        self.assertTrue(dashboard_btn.is_displayed())
        print(f"  -> Compte étudiant créé et connecté avec succès : {self.test_student['email']}.")
        self.visual_pause(0.8)

    def test_03_course_details_and_enrollment_journey(self):
        """Effectue le parcours d'inscription et paiement pour le cours React."""
        print("\n[TEST 3] Parcours d'inscription et paiement bancaire...")
        self.driver.get(f"{self.BASE_URL}/courses/react")
        self.visual_pause(0.8)

        # Vérifier le titre du cours et le bouton 'S'inscrire maintenant'
        title = self.wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'React avancé')]")))
        self.highlight_element(title, "#06b6d4")
        self.assertTrue(title.is_displayed())

        self.smooth_scroll(300)

        enroll_link = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), \"S'inscrire maintenant\")]")))
        print("  -> Clic sur 'S'inscrire maintenant'...")
        self.click_element(enroll_link, "#a855f7")

        # Étape 1 : Formulaire de pré-inscription (/enroll/react)
        self.wait.until(EC.url_contains("/enroll/react"))
        self.smooth_scroll(200)

        # S'assurer que tous les champs apprenant sont renseignés
        for name, val in [
            ("firstName", self.test_student["firstName"]),
            ("lastName", self.test_student["lastName"]),
            ("email", self.test_student["email"]),
            ("phone", self.test_student["phone"]),
        ]:
            field = self.driver.find_element(By.NAME, name)
            self.fill_input(field, val)

        terms_checkbox = self.driver.find_element(By.NAME, "agreeTerms")
        if not terms_checkbox.is_selected():
            print("  -> Coche des conditions d'utilisation...")
            self.click_element(terms_checkbox, "#10b981")

        continue_btn = self.driver.find_element(By.XPATH, "//button[@type='submit' and contains(text(), 'Continuer')]")
        self.click_element(continue_btn, "#a855f7")

        # Étape 1.2 : Confirmation
        confirm_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Procéder au paiement')]")))
        print("  -> Confirmation de la pré-inscription...")
        self.click_element(confirm_btn, "#06b6d4")

        # Étape 2 : Page de paiement sécurisé (/payment/react)
        self.wait.until(EC.url_contains("/payment/react"))
        print("  -> Arrivée sur la page de paiement sécurisé.")
        self.smooth_scroll(250)

        # Saisie des coordonnées bancaires de test
        card_name = self.wait.until(EC.presence_of_element_located((By.NAME, "cardName")))
        self.fill_input(card_name, f"{self.test_student['firstName']} {self.test_student['lastName']}")

        card_num_input = self.driver.find_element(By.NAME, "cardNumber")
        self.fill_input(card_num_input, "4532 0123 4567 8901")

        expiry_input = self.driver.find_element(By.NAME, "expiryDate")
        self.fill_input(expiry_input, "12/28")

        cvv_input = self.driver.find_element(By.NAME, "cvv")
        self.fill_input(cvv_input, "123")

        address_input = self.driver.find_element(By.NAME, "billingAddress")
        self.fill_input(address_input, "Boulevard d'Anfa")

        city_input = self.driver.find_element(By.NAME, "billingCity")
        self.fill_input(city_input, "Casablanca")

        zip_input = self.driver.find_element(By.NAME, "billingZip")
        self.fill_input(zip_input, "20000")

        self.smooth_scroll(200)

        # Clic sur le bouton de paiement
        pay_btn = self.driver.find_element(By.XPATH, "//button[@type='submit' and (contains(., 'Payer') or contains(., 'payer'))]")
        print("  -> Validation et paiement du cours...")
        self.click_element(pay_btn, "#22c55e")

        # Vérifier la redirection vers /success
        try:
            self.wait.until(EC.url_contains("/success"))
        except Exception as err:
            err_box = self.driver.find_elements(By.XPATH, "//*[contains(@class, 'bg-red') or contains(@class, 'text-red')]")
            for box in err_box:
                print(f"  [DEBUG ERREUR PAIEMENT] : '{box.text}'")
            print(f"  [DEBUG URL COURANTE] : {self.driver.current_url}")
            raise err

        success_title = self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Inscription réussie !')]")))
        self.highlight_element(success_title, "#10b981")
        self.assertTrue(success_title.is_displayed())
        print("  -> Paiement validé, page de succès affichée.")
        self.visual_pause(1.2)

    def test_04_learning_space_and_lesson_completion(self):
        """Accède au cours débloqué, vérifie l'espace de formation et valide une leçon."""
        print("\n[TEST 4] Accès au cours débloqué et complétion d'une leçon...")
        
        # Cliquer sur 'Accéder au cours maintenant' depuis la page de succès
        access_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Accéder au cours maintenant')]")))
        print("  -> Clic sur 'Accéder au cours maintenant'...")
        self.click_element(access_btn, "#06b6d4")

        self.wait.until(EC.url_contains("/courses/react"))

        # Vérifier le badge de possession du cours
        unlocked_badge = self.wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Vous possédez cette formation') or contains(text(), 'Vous êtes inscrit')]"))
        )
        self.highlight_element(unlocked_badge, "#10b981")
        self.assertTrue(unlocked_badge.is_displayed())
        print("  -> Badge d'accès illimité confirmé.")
        self.visual_pause(0.8)

        # Vérifier que le bouton d'inscription ne s'affiche plus
        enroll_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), \"S'inscrire maintenant\")]")
        self.assertEqual(len(enroll_buttons), 0, "Le bouton d'inscription ne doit plus apparaître pour un cours acquis")

        # Marquer une leçon comme terminée
        self.smooth_scroll(300)
        mark_done_btn = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Marquer comme terminée')]"))
        )
        print("  -> Clic sur 'Marquer comme terminée'...")
        self.click_element(mark_done_btn, "#22c55e")

        # Vérifier que le statut passe à 'Leçon terminée !'
        done_indicator = self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Leçon terminée !')]")))
        self.highlight_element(done_indicator, "#22c55e")
        self.assertTrue(done_indicator.is_displayed())
        print("  -> Progression enregistrée : leçon validée avec succès.")
        self.visual_pause(1.0)

    def test_05_student_dashboard(self):
        """Vérifie le tableau de bord étudiant (/dashboard) et les cours acquis."""
        print("\n[TEST 5] Consultation du tableau de bord étudiant (/dashboard)...")
        self.driver.get(f"{self.BASE_URL}/dashboard")
        self.visual_pause(0.8)

        # Vérifier le titre de l'espace apprenant
        dashboard_title = self.wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Mes Formations Disponibles')]"))
        )
        self.highlight_element(dashboard_title, "#a855f7")
        self.assertTrue(dashboard_title.is_displayed())

        self.smooth_scroll(250)

        # Vérifier que le cours React est affiché avec le badge 'Acquis'
        react_card = self.driver.find_element(By.XPATH, "//h3[contains(text(), 'React avancé & architecture')]")
        self.highlight_element(react_card, "#06b6d4")
        self.assertTrue(react_card.is_displayed())

        acquis_badge = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Acquis')]")
        self.highlight_element(acquis_badge, "#10b981")
        self.assertTrue(acquis_badge.is_displayed())

        # Vérifier le bouton 'Accéder à la formation'
        access_link = self.driver.find_element(By.XPATH, "//a[contains(@href, '/courses/react')]//button[contains(text(), 'Accéder')]")
        self.highlight_element(access_link, "#22c55e")
        self.assertTrue(access_link.is_displayed())
        print("  -> Cours 'React avancé' présent sur le tableau de bord avec accès direct.")
        self.visual_pause(1.0)

    def test_06_prevent_duplicate_payment(self):
        """Tente de réinscrire l'étudiant au cours déjà acheté et vérifie la protection anti-doublon."""
        print("\n[TEST 6] Vérification de la protection contre les paiements en double...")
        self.driver.get(f"{self.BASE_URL}/enroll/react")
        self.visual_pause(0.8)

        # La page doit détecter que le cours est déjà acquis
        already_enrolled_banner = self.wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Vous êtes déjà inscrit à ce cours !') or contains(text(), 'déjà inscrit')]"))
        )
        self.highlight_element(already_enrolled_banner, "#a855f7")
        self.assertTrue(already_enrolled_banner.is_displayed())

        # Les boutons directs d'accès doivent être proposés à la place du paiement
        access_btn = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Accéder au cours maintenant')]")
        self.highlight_element(access_btn, "#06b6d4")
        self.assertTrue(access_btn.is_displayed())
        print("  -> Protection anti-doublon validée : réinscription bloquée et lien direct fourni.")
        self.visual_pause(1.2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
