#!/usr/bin/env python3
"""
EduStream - Lanceur de Tests Selenium E2E
========================================
Options :
  --mode [e2e|negative|failing|all]  Type de test à exécuter (défaut : e2e)
                                      - e2e      : Parcours d'achat complet nominal (tests qui réussissent)
                                      - negative : Validation des erreurs (mauvais mot de passe, carte incomplète...)
                                      - failing  : Tests d'échec volontaire (pour voir les rapports d'erreur Selenium)
                                      - all      : Exécute l'ensemble des suites
  --browser [chrome|edge]             Navigateur à utiliser (défaut : chrome)
  --headed                            Ouvre le navigateur en mode visible (avec fenêtre)
  --headless                          Exécute en mode arrière-plan sans fenêtre (défaut)
  --url <URL>                         URL de base (défaut : http://localhost:3000)

Exemples :
  python scripts/run-selenium-tests.py                     # Tests E2E classiques
  python scripts/run-selenium-tests.py --mode negative     # Tests de rejets et cas limites
  python scripts/run-selenium-tests.py --mode failing      # Tests qui échouent volontairement
  python scripts/run-selenium-tests.py --mode failing --headed  # Voir les échecs en direct dans le navigateur
"""

import argparse
import os
import sys
import unittest


def main():
    parser = argparse.ArgumentParser(description="Lanceur de tests Selenium E2E pour EduStream")
    parser.add_argument(
        "--mode",
        choices=["e2e", "negative", "failing", "all"],
        default="e2e",
        help="Mode de test : 'e2e' (nominal), 'negative' (cas d'erreurs), 'failing' (échecs volontaires), 'all'"
    )
    parser.add_argument("--browser", choices=["chrome", "edge"], default="chrome", help="Navigateur (chrome ou edge)")
    parser.add_argument("--headed", action="store_true", help="Lancer en mode visible (avec fenêtre)")
    parser.add_argument("--headless", action="store_true", help="Lancer en mode headless (sans fenêtre, défaut)")
    parser.add_argument("--url", default="http://localhost:3000", help="URL cible (défaut: http://localhost:3000)")
    parser.add_argument("--slow", action="store_true", help="Ralentit l'exécution pour bien observer chaque action à l'écran")
    parser.add_argument("--delay", type=float, default=None, help="Délai en secondes entre chaque action (ex: --delay 1.5)")
    parser.add_argument("--fast", action="store_true", help="Force l'exécution rapide sans pause même en mode headed")

    args = parser.parse_args()

    os.environ["BASE_URL"] = args.url
    os.environ["SELENIUM_BROWSER"] = args.browser

    if args.headed:
        os.environ["SELENIUM_HEADLESS"] = "false"
    else:
        os.environ["SELENIUM_HEADLESS"] = "true"

    # Calcul du délai visuel entre les actions
    if args.fast:
        step_delay = 0.0
    elif args.delay is not None:
        step_delay = args.delay
    elif args.slow:
        step_delay = 1.5
    elif args.headed:
        step_delay = 1.0
    else:
        step_delay = 0.0

    os.environ["SELENIUM_DELAY"] = str(step_delay)

    # Importer les suites de test
    test_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "tests", "selenium"))
    sys.path.insert(0, test_dir)

    import test_edustream_e2e
    import test_negative_cases
    import test_intentional_failures

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    if args.mode == "e2e":
        suite.addTests(loader.loadTestsFromTestCase(test_edustream_e2e.EduStreamSeleniumE2ETest))
    elif args.mode == "negative":
        suite.addTests(loader.loadTestsFromTestCase(test_negative_cases.EduStreamNegativeTests))
    elif args.mode == "failing":
        suite.addTests(loader.loadTestsFromTestCase(test_intentional_failures.EduStreamIntentionalFailuresTest))
    elif args.mode == "all":
        suite.addTests(loader.loadTestsFromTestCase(test_edustream_e2e.EduStreamSeleniumE2ETest))
        suite.addTests(loader.loadTestsFromTestCase(test_negative_cases.EduStreamNegativeTests))
        suite.addTests(loader.loadTestsFromTestCase(test_intentional_failures.EduStreamIntentionalFailuresTest))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    sys.exit(0 if result.wasSuccessful() else 1)


if __name__ == "__main__":
    main()
