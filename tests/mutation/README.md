# Tests de mutation — EduStream

Les tests unitaires vérifient que le code fait ce qu'on attend. Les **tests de mutation** vérifient
que les tests unitaires sont **capables de détecter une erreur** : on modifie volontairement le code
(un « mutant »), puis on relance les tests. Si au moins un test échoue, le mutant est **tué** (bien).
Si tous les tests passent, le mutant **survit** : il existe un comportement que personne ne vérifie.

```
score de mutation = mutants tués / (mutants tués + mutants survivants)
```

## Lancer la campagne

```bash
pnpm test:mutation:baseline   # tour 1 : tests unitaires initiaux seulement
pnpm test:mutation            # tour 2 : tests initiaux + tests « tueurs » (tests/mutation/killers)
```

Options du moteur (`node tests/mutation/run-mutation.mjs ...`) :

| Option | Rôle |
|---|---|
| `--round 1` | tests initiaux seulement (référence) |
| `--round 2` (ou plus) | tests initiaux + tests tueurs, mutants équivalents ignorés |
| `--only validators` | ne muter que les fichiers dont le chemin contient ce texte |
| `--limit 20` | n'exécuter que les 20 premiers mutants (essai rapide) |
| `--list` | compter les mutants par opérateur sans rien exécuter |
| `--no-equivalents` | ne pas ignorer les mutants listés dans `equivalents.json` |

Durée : quelques secondes par mutant (environ 270 mutants) ; prévoir plusieurs minutes.
Les résultats sont écrits dans `tests/mutation/reports/round-N.json`.

## Organisation du dossier

| Élément | Rôle |
|---|---|
| `run-mutation.mjs` | moteur : génère les mutants, lance les tests, calcule le score |
| `engine/operators.mjs` | opérateurs de mutation (comparaisons, logique, arithmétique, conditions, négations, chaînes, nombres, expressions régulières, suppression d'instructions) |
| `mutation.config.mjs` | fichiers à muter et tests associés |
| `killers/` | tests ajoutés pour tuer les mutants survivants (un fichier par module) |
| `equivalents.json` | mutants qui ne changent pas le comportement du programme, avec la justification |
| `reports/` | résultats de chaque tour |

## Méthode (la même à chaque tour)

1. **Lancer** la campagne sur les tests existants et noter le score.
2. **Lire chaque survivant** : le code a changé, aucun test n'a échoué. Pourquoi ?
   - le comportement n'est pas testé → écrire un test **tueur** (dans `killers/`) ;
   - le mutant est **équivalent** (le comportement visible est identique) → le justifier dans `equivalents.json`.
3. **Écrire le test tueur sur le code d'origine** : s'il échoue alors qu'aucun mutant n'est appliqué, c'est
   un **vrai défaut du code**, à corriger.
4. **Relancer** : le score doit monter, jamais descendre.

## Sécurité du moteur

Le fichier source est modifié sur place pendant un test, puis **toujours restauré** (bloc `finally`,
signaux d'arrêt, et fichier de sauvegarde `*.mutation.bak` rétabli au démarrage suivant). Ne lancez pas
deux campagnes en parallèle et ne modifiez pas les sources pendant l'exécution.
