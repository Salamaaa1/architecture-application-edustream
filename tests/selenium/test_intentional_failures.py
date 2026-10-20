"""
EduStream - Tests avec Échecs Volontaires et Actions Riches (Démonstration Selenium)
=====================================================================================
Ce fichier contient des scénarios Selenium complets et hautement interactifs configurés
pour ÉCHOUER à une étape précise.

Idéal pour observer en mode VISUEL (--headed) :
1. Les actions utilisateur réelles :
   - Saisie progressive au clavier (human-like typing)
   - Défilement fluide de la page (smooth scrolling)
   - Recherche en direct dans la barre du catalogue
   - Clics et surbrillances (glowing outline) sur les cartes, filtres, boutons
   - Remplissage complet des formulaires d'inscription et de paiement
   - Interaction avec le lecteur vidéo et le bloc-notes étudiant
2. Le rapport d'anomalie exact généré par Selenium :
   - FAIL (AssertionError) : incohérence de texte ou de tarif
   - ERROR (TimeoutException) : élément inexistant après attente explicite
"""

import os
import sys
import time
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.edge.options import Options as EdgeOptions

# Support encodage UTF-8 pour la console Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


class EduStreamIntentionalFailuresTest(unittest.TestCase):
    BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
    BROWSER = os.environ.get("SELENIUM_BROWSER", "chrome").lower()
    HEADLESS = os.environ.get("SELENIUM_HEADLESS", "true").lower() in ("true", "1", "yes")

    driver = None

    @classmethod
    def setUpClass(cls):
        print(f"\n============================================================")
        print(f"[TESTS D'ECHEC VOLONTAIRE AVEC ACTIONS VISUELLES]")
        print(f"   Mode Headless  : {cls.HEADLESS}")
        print(f"   Navigateur     : {cls.BROWSER.upper()}")
        print(f"   URL Cible      : {cls.BASE_URL}")
        print(f"============================================================")

        if cls.BROWSER == "edge":
            options = EdgeOptions()
            if cls.HEADLESS:
                options.add_argument("--headless=new")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1366,850")
            cls.driver = webdriver.Edge(options=options)
        else:
            options = ChromeOptions()
            if cls.HEADLESS:
                options.add_argument("--headless=new")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--window-size=1366,850")
            cls.driver = webdriver.Chrome(options=options)

        cls.driver.implicitly_wait(3)
        cls.wait = WebDriverWait(cls.driver, 4)

    @classmethod
    def tearDownClass(cls):
        if cls.driver:
            cls.driver.quit()
        print(f"\n============================================================")
        print(f"[FIN] SUITE DE TESTS D'ECHECS VOLONTAIRES TERMINEE")
        print(f"============================================================\n")

    def get_delay(self):
        return float(os.environ.get("SELENIUM_DELAY", "0.0" if self.HEADLESS else "1.0"))

    def visual_pause(self, factor=1.0):
        """Pause visible pour permettre à l'utilisateur d'observer l'action à l'écran."""
        delay = self.get_delay()
        if delay > 0:
            time.sleep(delay * factor)
        else:
            time.sleep(0.05)

    def human_type(self, element, text, delay=0.035):
        """Tape du texte de manière visible et progressive dans un champ."""
        element.clear()
        if self.get_delay() > 0:
            for char in text:
                element.send_keys(char)
                time.sleep(delay)
            self.visual_pause(0.3)
        else:
            element.send_keys(text)

    def smooth_scroll(self, pixels=350):
        """Défilement fluide de la page pour une démonstration visuelle claire."""
        if self.get_delay() > 0:
            self.driver.execute_script(f"window.scrollBy({{top: {pixels}, behavior: 'smooth'}});")
            self.visual_pause(0.5)

    def scroll_into_view(self, element):
        """Centre un élément dans la fenêtre avec animation fluide."""
        if self.get_delay() > 0:
            self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element)
            self.visual_pause(0.3)

    def highlight_element(self, element, color="#ec4899"):
        """Entoure visuellement un élément pour attirer l'attention avant l'action."""
        if not self.HEADLESS:
            self.driver.execute_script(
                f"arguments[0].style.outline = '3px solid {color}'; arguments[0].style.boxShadow = '0 0 15px {color}';",
                element
            )
            time.sleep(0.25)

    # -------------------------------------------------------------------------
    # TEST 1 : Recherche interactive, exploration du cours & assertion sur tarif erroné
    # -------------------------------------------------------------------------
    def test_fail_01_catalog_search_exploration_and_discount_assertion(self):
        """
        [ECHEC PREVU 1 - AssertionError]
        Actions :
        1. Ouvre la page d'accueil.
        2. Défile vers le bas jusqu'au catalogue de formations.
        3. Tape 'React' dans la barre de recherche avec saisie progressive.
        4. Met en valeur la carte de cours trouvée.
        5. Clique sur 'Voir le cours' ou 'Accéder au cours'.
        6. Arrive sur la page /courses/react et fait défiler le programme pédagogique.
        7. Inspecte l'encart tarifaire dans la barre latérale.
        8. ÉCHEC : Affirme que le cours est gratuit ('0 DH (Offre Spéciale 100% Gratuite)').
        """
        print("\n------------------------------------------------------------")
        print("[ACTION 1] Recherche catalogue, consultation du cours & assertion tarif")
        print("------------------------------------------------------------")
        self.driver.get(self.BASE_URL)
        self.visual_pause(0.8)

        # 1. Défilement vers la section catalogue
        print("  -> Défilement fluide vers le catalogue...")
        self.smooth_scroll(550)

        # 2. Utilisation de la barre de recherche
        try:
            search_input = self.wait.until(
                EC.presence_of_element_located((By.XPATH, "//input[contains(@placeholder, 'Rechercher')]"))
            )
            self.scroll_into_view(search_input)
            self.highlight_element(search_input, "#8b5cf6")
            print("  -> Saisie progressive dans la barre de recherche : 'React'...")
            self.human_type(search_input, "React")
            self.visual_pause(0.6)
        except Exception:
            pass

        # 3. Localiser la carte du cours React et cliquer sur le lien
        react_card = self.wait.until(
            EC.presence_of_element_located((By.XPATH, "//article[contains(., 'React avancé')]"))
        )
        self.scroll_into_view(react_card)
        self.highlight_element(react_card, "#06b6d4")

        course_link = react_card.find_element(By.XPATH, ".//a[contains(@href, '/courses/')]")
        self.highlight_element(course_link, "#22c55e")
        print("  -> Clic sur la fiche du cours React...")
        course_link.click()
        self.visual_pause(1.0)

        # 4. Consultation du programme et défilement
        print("  -> Défilement pour examiner les modules du cours...")
        self.smooth_scroll(450)
        self.smooth_scroll(450)
        self.smooth_scroll(-500)

        # 5. Inspection du tarif réel dans l'encart d'inscription
        price_elem = self.wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), '1490') or contains(text(), 'DH')]"))
        )
        self.scroll_into_view(price_elem)
        self.highlight_element(price_elem, "#ef4444")
        actual_price_text = price_elem.text
        print(f"  -> Tarif affiché à l'écran : '{actual_price_text}'")

        # 6. Assertion erronée volontaire
        expected_free_price = "0 DH (Offre Spéciale 100% Gratuite)"
        print(f"  -> [ASSERTION VOLONTAIREMENT FAUSSE] Attend : '{expected_free_price}'")
        self.assertIn(
            expected_free_price,
            actual_price_text,
            f"ECHEC VOLONTAIRE : Le test affirme que la formation est gratuite ('{expected_free_price}'), mais elle coûte réellement '{actual_price_text}' !"
        )

    # -------------------------------------------------------------------------
    # TEST 2 : Tunnel d'inscription, formulaire paiement & bouton introuvable
    # -------------------------------------------------------------------------
    def test_fail_02_full_checkout_flow_and_missing_proforma_button_timeout(self):
        """
        [ECHEC PREVU 2 - TimeoutException / Element Not Found]
        Actions :
        1. Se rend sur la formation React.
        2. Clique sur 'S'inscrire à cette formation'.
        3. Remplit interactivement les champs de pré-inscription (Nom, Prénom, Email, Tél).
        4. Coche la case des Conditions Générales d'Utilisation (CGU).
        5. Valide vers l'étape de confirmation, puis procède au paiement.
        6. Arrive sur la page de paiement sécurisé.
        7. Saisit le nom du titulaire, le numéro de carte, la date et le CVV.
        8. ÉCHEC : Recherche pendant 4s un bouton inexistant 'btn-telecharger-facture-proforma-tva'.
        """
        print("\n------------------------------------------------------------")
        print("[ACTION 2] Tunnel d'inscription complet & recherche d'un bouton introuvable")
        print("------------------------------------------------------------")
        self.driver.get(f"{self.BASE_URL}/courses/react")
        self.visual_pause(0.8)

        # 1. Clic sur le bouton d'inscription
        enroll_link = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(@href, '/enroll/react')]"))
        )
        self.scroll_into_view(enroll_link)
        self.highlight_element(enroll_link, "#a855f7")
        print("  -> Clic sur 'S'inscrire à cette formation'...")
        enroll_link.click()
        self.visual_pause(0.8)

        # 2. Remplissage progressif du formulaire apprenant
        print("  -> Remplissage interactif du formulaire de pré-inscription...")
        self.smooth_scroll(200)

        first_name = self.wait.until(EC.presence_of_element_located((By.NAME, "firstName")))
        self.human_type(first_name, "Mehdi")

        last_name = self.driver.find_element(By.NAME, "lastName")
        self.human_type(last_name, "Benjelloun")

        email_input = self.driver.find_element(By.NAME, "email")
        self.human_type(email_input, "mehdi.benjelloun@edustream-demo.ma")

        phone_input = self.driver.find_element(By.NAME, "phone")
        self.human_type(phone_input, "+212 6 61 22 33 44")

        # 3. Clic sur la case des CGU
        cgu_checkbox = self.driver.find_element(By.NAME, "agreeTerms")
        self.scroll_into_view(cgu_checkbox)
        self.highlight_element(cgu_checkbox, "#10b981")
        if not cgu_checkbox.is_selected():
            print("  -> Coche de la case des CGU...")
            cgu_checkbox.click()
        self.visual_pause(0.5)

        # 4. Soumission vers l'étape de confirmation
        submit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Continuer vers la confirmation')]")
        self.highlight_element(submit_btn, "#8b5cf6")
        submit_btn.click()
        self.visual_pause(0.7)

        # 5. Clic sur 'Procéder au paiement'
        proceed_btn = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Procéder au paiement')]"))
        )
        self.highlight_element(proceed_btn, "#06b6d4")
        print("  -> Validation de la confirmation et redirection vers le paiement...")
        proceed_btn.click()
        self.visual_pause(1.0)

        # 6. Saisie des coordonnées de paiement sur la page sécurisée
        print("  -> Saisie interactive des coordonnées bancaires...")
        self.smooth_scroll(250)

        card_name = self.wait.until(EC.presence_of_element_located((By.NAME, "cardName")))
        self.human_type(card_name, "MEHDI BENJELLOUN")

        card_number = self.driver.find_element(By.NAME, "cardNumber")
        self.human_type(card_number, "4242 4242 4242 4242")

        expiry_input = self.driver.find_element(By.NAME, "expiryDate")
        self.human_type(expiry_input, "12/28")

        cvv_input = self.driver.find_element(By.NAME, "cvv")
        self.human_type(cvv_input, "999")

        self.smooth_scroll(200)

        # 7. ÉCHEC VOLONTAIRE : Recherche d'un bouton introuvable
        fictional_button_xpath = "//button[@id='btn-telecharger-facture-proforma-tva']"
        print(f"  -> [ATTENTE TIMEOUT VOLONTAIRE] Recherche du bouton : {fictional_button_xpath}")
        self.wait.until(
            EC.presence_of_element_located((By.XPATH, fictional_button_xpath)),
            message="ECHEC VOLONTAIRE : Le bouton de téléchargement de facture pro-forma fiscale n'a pas été trouvé sur la page de paiement !"
        )

    # -------------------------------------------------------------------------
    # TEST 3 : Dashboard étudiant, lecteur de cours, progression & diplôme
    # -------------------------------------------------------------------------
    def test_fail_03_dashboard_player_progression_and_diploma_timeout(self):
        """
        [ECHEC PREVU 3 - TimeoutException sur certification]
        Actions :
        1. Pré-inscrit la session locale avec le cours React possédé.
        2. Ouvre le tableau de bord /dashboard.
        3. Parcourt les statistiques ('1 Cours acquis', 'Volume de cours').
        4. Teste le champ de synchronisation par email avec saisie animée.
        5. Clique sur 'Accéder au cours' pour entrer dans l'espace de lecture.
        6. Interagit avec le lecteur vidéo (Clic Play/Pause).
        7. Sélectionne la 2ème leçon ('02 - Composants composés & Inversion de contrôle').
        8. Saisit des notes personnelles dans le bloc-notes étudiant.
        9. Clique sur 'Sauvegarder mes notes'.
        10. Clique sur 'Marquer comme terminée' pour faire progresser la barre de complétion.
        11. ÉCHEC : Recherche un bouton de certification d'État 'btn-tampon-ministere-accreditation'.
        """
        print("\n------------------------------------------------------------")
        print("[ACTION 3] Espace apprenant, lecteur interactif & recherche diplôme")
        print("------------------------------------------------------------")

        # 1. Initialiser le cours dans le localStorage
        self.driver.get(self.BASE_URL)
        self.driver.execute_script("""
            localStorage.setItem('edustream_enrolled_courses', JSON.stringify(['react']));
            localStorage.setItem('edustream_user_session', JSON.stringify({
                email: 'etudiant.actif@edustream.ma',
                firstName: 'Etudiant',
                lastName: 'Actif',
                enrolledCourses: ['react']
            }));
        """)

        # 2. Navigation vers le dashboard
        self.driver.get(f"{self.BASE_URL}/dashboard")
        self.visual_pause(0.8)

        print("  -> Consultation des statistiques du tableau de bord...")
        self.smooth_scroll(200)

        # 3. Interaction avec le champ de synchronisation email
        try:
            sync_input = self.driver.find_element(By.XPATH, "//input[@placeholder='exemple@domaine.com']")
            self.scroll_into_view(sync_input)
            self.highlight_element(sync_input, "#8b5cf6")
            print("  -> Test de saisie dans le champ de synchronisation...")
            self.human_type(sync_input, "etudiant.actif@edustream.ma")

            sync_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Synchroniser')]")
            self.highlight_element(sync_btn, "#10b981")
            sync_btn.click()
            self.visual_pause(0.7)
        except Exception:
            pass

        # 4. Entrée dans le cours acquis
        access_btn = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(@href, '/courses/react')]//button | //a[contains(@href, '/courses/react')]"))
        )
        self.scroll_into_view(access_btn)
        self.highlight_element(access_btn, "#06b6d4")
        print("  -> Clic sur 'Accéder au cours' pour ouvrir le lecteur interactif...")
        access_btn.click()
        self.visual_pause(1.0)

        # 5. Interaction avec le lecteur vidéo
        print("  -> Interaction avec le lecteur vidéo...")
        self.smooth_scroll(200)
        try:
            play_btn = self.driver.find_element(By.XPATH, "//button[@aria-label='Lire la leçon' or @aria-label='Pause']")
            self.highlight_element(play_btn, "#ec4899")
            print("  -> Lancement de la vidéo (Play)...")
            play_btn.click()
            self.visual_pause(0.8)
            print("  -> Pause de la vidéo...")
            play_btn.click()
            self.visual_pause(0.5)
        except Exception:
            pass

        # 6. Sélection de la leçon suivante dans la liste
        self.smooth_scroll(300)
        try:
            lesson_items = self.driver.find_elements(By.XPATH, "//button[contains(., 'Composants composés') or contains(., 'State')]")
            if lesson_items:
                print("  -> Clic pour sélectionner la leçon 2...")
                self.highlight_element(lesson_items[0], "#8b5cf6")
                lesson_items[0].click()
                self.visual_pause(0.7)
        except Exception:
            pass

        # 7. Saisie de notes personnelles
        try:
            notes_area = self.driver.find_element(By.TAG_NAME, "textarea")
            self.scroll_into_view(notes_area)
            self.highlight_element(notes_area, "#10b981")
            print("  -> Prise de notes de l'étudiant dans l'espace dédié...")
            self.human_type(notes_area, "Note de cours : Maîtriser le pattern compound components et les Custom Hooks !")
            
            save_notes_btn = self.driver.find_element(By.XPATH, "//button[contains(., 'Sauvegarder')]")
            self.highlight_element(save_notes_btn, "#06b6d4")
            save_notes_btn.click()
            self.visual_pause(0.6)
        except Exception:
            pass

        # 8. Progression : marquer la leçon comme terminée
        try:
            done_btn = self.driver.find_element(By.XPATH, "//button[contains(., 'Marquer comme terminée')]")
            self.scroll_into_view(done_btn)
            self.highlight_element(done_btn, "#22c55e")
            print("  -> Clic sur 'Marquer comme terminée'...")
            done_btn.click()
            self.visual_pause(0.8)
        except Exception:
            pass

        # 9. ÉCHEC VOLONTAIRE : Recherche du bouton d'accréditation ministérielle
        fake_certif_xpath = "//button[@id='btn-tampon-ministere-accreditation']"
        print(f"  -> [ATTENTE TIMEOUT VOLONTAIRE] Recherche de l'élément : {fake_certif_xpath}")
        self.wait.until(
            EC.presence_of_element_located((By.XPATH, fake_certif_xpath)),
            message="ECHEC VOLONTAIRE : Le bouton d'accréditation officielle d'État n'a pas été trouvé dans l'espace de formation !"
        )

    # -------------------------------------------------------------------------
    # TEST 4 : Connexion au panneau Admin & tentative d'accès console Root
    # -------------------------------------------------------------------------
    def test_fail_04_admin_login_and_root_shell_assertion(self):
        """
        [ECHEC PREVU 4 - AssertionError sur les droits SuperAdmin]
        Actions :
        1. Ouvre la page d'accueil.
        2. Clique sur le lien 'Admin' dans la barre de navigation.
        3. Défile jusqu'au formulaire de connexion d'administration.
        4. Saisit le mot de passe d'administration.
        5. Clique sur 'Se connecter en tant qu'Admin'.
        6. ÉCHEC : Affirme que le texte 'CONSOLE ROOT BASH PRODUCTION DÉBLOQUÉE' apparaît.
        """
        print("\n------------------------------------------------------------")
        print("[ACTION 4] Connexion Admin & vérification de privilèges Root")
        print("------------------------------------------------------------")
        self.driver.get(self.BASE_URL)
        self.visual_pause(0.8)

        # 1. Clic sur le lien Admin dans la barre de navigation
        admin_link = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(@href, '/admin')]")))
        self.highlight_element(admin_link, "#ef4444")
        print("  -> Clic sur l'onglet 'Admin' dans le menu...")
        admin_link.click()
        self.visual_pause(0.8)

        # 2. Saisie du mot de passe dans le champ d'administration
        print("  -> Saisie interactive du mot de passe administrateur...")
        self.smooth_scroll(150)

        password_field = self.wait.until(
            EC.presence_of_element_located((By.XPATH, "//input[@type='password']"))
        )
        self.highlight_element(password_field, "#8b5cf6")
        self.human_type(password_field, "admin123")

        # 3. Clic sur le bouton de connexion
        login_btn = self.driver.find_element(By.XPATH, "//button[@type='submit']")
        self.highlight_element(login_btn, "#ef4444")
        print("  -> Soumission de la demande de connexion administrative...")
        login_btn.click()
        self.visual_pause(1.2)

        # 4. ÉCHEC VOLONTAIRE : Assertion sur un privilège imaginaire
        body_text = self.driver.find_element(By.TAG_NAME, "body").text
        expected_root_access = "CONSOLE ROOT BASH PRODUCTION DÉBLOQUÉE"
        print(f"  -> [ASSERTION VOLONTAIREMENT FAUSSE] Recherche de : '{expected_root_access}'")
        self.assertIn(
            expected_root_access,
            body_text,
            f"ECHEC VOLONTAIRE : L'accès direct Root Server ('{expected_root_access}') n'a pas été octroyé dans l'interface !"
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
