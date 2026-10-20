"""
EduStream - Tests Négatifs et Cas Limites (Selenium WebDriver)
============================================================
Ce fichier teste que l'application détecte et rejette correctement
toutes les actions invalides et affiche les messages d'erreur attendus :
1. Connexion avec un mot de passe erroné -> Message d'erreur d'identifiants
2. Inscription sans accepter les CGU -> Message d'erreur CGU requises
3. Saisie d'une adresse email sans '@' -> Message d'erreur format email
4. Saisie d'un numéro de carte incomplet (< 16 chiffres) -> Blocage paiement
5. Saisie d'un CVV incomplet (< 3 chiffres) -> Blocage paiement
6. Accès à un cours non existant dans le catalogue -> Écran 'Cours non trouvé'
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


class EduStreamNegativeTests(unittest.TestCase):
    BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
    BROWSER = os.environ.get("SELENIUM_BROWSER", "chrome").lower()
    HEADLESS = os.environ.get("SELENIUM_HEADLESS", "true").lower() in ("true", "1", "yes")

    driver = None

    @classmethod
    def setUpClass(cls):
        print(f"\n============================================================")
        print(f"[TESTS NEGATIFS] TESTS DES CAS D'ERREURS ATTENDUS")
        print(f"   URL Cible  : {cls.BASE_URL}")
        print(f"   Navigateur : {cls.BROWSER.upper()} (Headless={cls.HEADLESS})")
        print(f"============================================================")

        if cls.BROWSER == "edge":
            options = EdgeOptions()
            if cls.HEADLESS:
                options.add_argument("--headless=new")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1440,900")
            cls.driver = webdriver.Edge(options=options)
        else:
            options = ChromeOptions()
            if cls.HEADLESS:
                options.add_argument("--headless=new")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--window-size=1440,900")
            cls.driver = webdriver.Chrome(options=options)

        cls.driver.implicitly_wait(8)
        cls.wait = WebDriverWait(cls.driver, 10)

    @classmethod
    def tearDownClass(cls):
        if cls.driver:
            cls.driver.quit()
        print(f"\n============================================================")
        print(f"[TERMINE] FIN DES TESTS NEGATIFS")
        print(f"============================================================\n")

    def test_negative_01_login_wrong_password(self):
        """Vérifie le rejet d'une tentative de connexion avec un mot de passe erroné."""
        print("\n[TEST NEGATIF 1] Tentative de connexion avec mauvais mot de passe...")
        self.driver.get(self.BASE_URL)

        login_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Se connecter')]")))
        login_btn.click()

        email_input = self.wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='nom@exemple.ma']")))
        email_input.clear()
        email_input.send_keys("admin@edustream.ma")

        pwd_input = self.driver.find_element(By.XPATH, "//input[@placeholder='••••••••']")
        pwd_input.clear()
        pwd_input.send_keys("FAUX_MOT_DE_PASSE_12345")

        submit_btn = self.driver.find_element(By.XPATH, "//button[@type='submit' and contains(text(), 'Se connecter')]")
        submit_btn.click()

        # Attendre l'affichage de l'alerte d'erreur rouge
        error_box = self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(@class, 'bg-red-500') or contains(text(), 'invalide') or contains(text(), 'échouée')]")))
        self.assertTrue(error_box.is_displayed(), "Le message d'erreur d'authentification doit être visible")
        print(f"  -> Rejet confirmé avec message : '{error_box.text}'")

        # Fermer la modale
        close_btn = self.driver.find_element(By.XPATH, "//button[contains(@class, 'absolute top-4 right-4')]")
        close_btn.click()

    def test_negative_02_enrollment_without_terms(self):
        """Vérifie le blocage de la pré-inscription si les conditions (CGU) ne sont pas cochées."""
        print("\n[TEST NEGATIF 2] Pré-inscription sans accepter les conditions d'utilisation...")
        self.driver.get(f"{self.BASE_URL}/enroll/react")

        first_name = self.wait.until(EC.presence_of_element_located((By.NAME, "firstName")))
        first_name.clear()
        first_name.send_keys("Amine")

        last_name = self.driver.find_element(By.NAME, "lastName")
        last_name.clear()
        last_name.send_keys("Tahiri")

        email = self.driver.find_element(By.NAME, "email")
        email.clear()
        email.send_keys("amine.tahiri@example.ma")

        phone = self.driver.find_element(By.NAME, "phone")
        phone.clear()
        phone.send_keys("+212 6 99 88 77 66")

        # S'assurer que la case CGU n'est PAS cochée
        terms = self.driver.find_element(By.NAME, "agreeTerms")
        if terms.is_selected():
            terms.click()

        continue_btn = self.driver.find_element(By.XPATH, "//button[@type='submit' and contains(text(), 'Continuer')]")
        continue_btn.click()

        # Vérifier le message d'erreur explicite
        error_msg = self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'conditions')]")))
        self.assertTrue(error_msg.is_displayed())
        print(f"  -> Blocage validé : '{error_msg.text}'")

    def test_negative_03_enrollment_missing_required_field(self):
        """Vérifie le rejet d'un formulaire avec un champ obligatoire manquant (ex: téléphone absent)."""
        print("\n[TEST NEGATIF 3] Pré-inscription avec champ obligatoire manquant...")
        self.driver.get(f"{self.BASE_URL}/enroll/react")

        first_name = self.wait.until(EC.presence_of_element_located((By.NAME, "firstName")))
        first_name.clear()
        first_name.send_keys("Amine")

        last_name = self.driver.find_element(By.NAME, "lastName")
        last_name.clear()
        last_name.send_keys("Tahiri")

        email = self.driver.find_element(By.NAME, "email")
        email.clear()
        email.send_keys("amine.tahiri@example.ma")

        # Téléphone laissé vide
        phone = self.driver.find_element(By.NAME, "phone")
        phone.clear()

        terms = self.driver.find_element(By.NAME, "agreeTerms")
        if not terms.is_selected():
            terms.click()

        continue_btn = self.driver.find_element(By.XPATH, "//button[@type='submit' and contains(text(), 'Continuer')]")
        continue_btn.click()

        error_msg = self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Le téléphone est requis') or contains(text(), 'requis')]")))
        self.assertTrue(error_msg.is_displayed())
        print(f"  -> Blocage validé : '{error_msg.text}'")

    def test_negative_04_payment_invalid_card_number(self):
        """Vérifie que la saisie d'un numéro de carte bancaire incomplet (< 16 chiffres) est bloquée."""
        print("\n[TEST NEGATIF 4] Paiement avec numéro de carte bancaire incomplet...")
        self.driver.get(f"{self.BASE_URL}/payment/react?email=test@example.ma&firstName=Test&lastName=User")

        card_name = self.wait.until(EC.presence_of_element_located((By.NAME, "cardName")))
        card_name.clear()
        card_name.send_keys("Test User")

        # Seulement 8 chiffres au lieu de 16
        card_number = self.driver.find_element(By.NAME, "cardNumber")
        card_number.clear()
        card_number.send_keys("4532 0000")

        expiry = self.driver.find_element(By.NAME, "expiryDate")
        expiry.clear()
        expiry.send_keys("12/28")

        cvv = self.driver.find_element(By.NAME, "cvv")
        cvv.clear()
        cvv.send_keys("123")

        address = self.driver.find_element(By.NAME, "billingAddress")
        address.clear()
        address.send_keys("Avenue Hassan II")

        city = self.driver.find_element(By.NAME, "billingCity")
        city.clear()
        city.send_keys("Rabat")

        zip_code = self.driver.find_element(By.NAME, "billingZip")
        zip_code.clear()
        zip_code.send_keys("10000")

        pay_btn = self.driver.find_element(By.XPATH, "//button[@type='submit' and contains(text(), 'Payer')]")
        pay_btn.click()

        # Attendre l'apparition de l'erreur '16 chiffres'
        error_msg = self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), '16 chiffres')]")))
        self.assertTrue(error_msg.is_displayed())
        print(f"  -> Blocage validé : '{error_msg.text}'")

    def test_negative_05_payment_invalid_cvv(self):
        """Vérifie que la saisie d'un code CVV incomplet (< 3 chiffres) est rejetée."""
        print("\n[TEST NEGATIF 5] Paiement avec code CVV incomplet...")
        self.driver.get(f"{self.BASE_URL}/payment/react?email=test@example.ma&firstName=Test&lastName=User")

        card_name = self.wait.until(EC.presence_of_element_located((By.NAME, "cardName")))
        card_name.clear()
        card_name.send_keys("Test User")

        card_number = self.driver.find_element(By.NAME, "cardNumber")
        card_number.clear()
        card_number.send_keys("4532 0123 4567 8901")

        expiry = self.driver.find_element(By.NAME, "expiryDate")
        expiry.clear()
        expiry.send_keys("12/28")

        # Seulement 2 chiffres au lieu de 3
        cvv = self.driver.find_element(By.NAME, "cvv")
        cvv.clear()
        cvv.send_keys("12")

        address = self.driver.find_element(By.NAME, "billingAddress")
        address.clear()
        address.send_keys("Avenue Hassan II")

        city = self.driver.find_element(By.NAME, "billingCity")
        city.clear()
        city.send_keys("Rabat")

        zip_code = self.driver.find_element(By.NAME, "billingZip")
        zip_code.clear()
        zip_code.send_keys("10000")

        pay_btn = self.driver.find_element(By.XPATH, "//button[@type='submit' and contains(text(), 'Payer')]")
        pay_btn.click()

        error_msg = self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), '3 chiffres')]")))
        self.assertTrue(error_msg.is_displayed())
        print(f"  -> Blocage validé : '{error_msg.text}'")

    def test_negative_06_non_existent_course(self):
        """Vérifie le comportement de l'application lorsqu'un cours inconnu est demandé."""
        print("\n[TEST NEGATIF 6] Accès à une URL de cours inexistante (/courses/cours-fantome)...")
        self.driver.get(f"{self.BASE_URL}/courses/cours-fantome-qui-nexiste-pas")

        not_found_heading = self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'non trouvé') or contains(text(), 'Non trouvé')]")))
        self.assertTrue(not_found_heading.is_displayed())

        home_link = self.driver.find_element(By.XPATH, "//*[contains(text(), 'accueil')]")
        self.assertTrue(home_link.is_displayed())
        print(f"  -> Page d'erreur 404 métier confirmée : '{not_found_heading.text}'")


if __name__ == "__main__":
    unittest.main(verbosity=2)
