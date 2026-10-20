// Configuration de la campagne de mutation.
//
// - `tests`   : tests unitaires initiaux du projet (tour 1).
// - `killers` : tests ajoutés pour tuer les mutants survivants (tour 2).
// Seuls des tests unitaires rapides sont utilisés : les tests d'intégration
// (Next.js) et Selenium ne font pas partie de cette campagne.

export default {
  root: '../..', // racine du projet, relative à ce fichier
  testCommand: 'npx vitest run --bail=1 --reporter=dot {tests}',
  timeoutMs: 120000,
  targets: [
    {
      file: 'lib/services/validators.ts',
      tests: ['tests/frontend/unit/validators.test.ts'],
      killers: ['tests/mutation/killers/validators.killers.test.ts'],
    },
    {
      file: 'lib/services/payment.service.ts',
      tests: ['tests/frontend/unit/services.test.ts'],
      killers: ['tests/mutation/killers/payment.killers.test.ts'],
    },
    {
      file: 'lib/services/enrollment.service.ts',
      tests: ['tests/frontend/unit/services.test.ts'],
      killers: ['tests/mutation/killers/enrollment.killers.test.ts'],
    },
    {
      file: 'lib/services/student.service.ts',
      tests: ['tests/frontend/unit/services.test.ts'],
      killers: ['tests/mutation/killers/student.killers.test.ts'],
    },
    {
      file: 'lib/services/course.service.ts',
      tests: ['tests/frontend/unit/services.test.ts'],
      killers: ['tests/mutation/killers/course.killers.test.ts'],
    },
    {
      file: 'lib/repositories/implementation.ts',
      tests: ['tests/frontend/unit/services.test.ts'],
      killers: ['tests/mutation/killers/repositories.killers.test.ts'],
    },
  ],
}
