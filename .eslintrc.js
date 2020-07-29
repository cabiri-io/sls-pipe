module.exports = {
  extends: ['plugin:import/errors', 'plugin:import/typescript', 'prettier', 'plugin:eslint-comments/recommended'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint/eslint-plugin'],
      rules: {
        '@typescript-eslint/array-type': ['error', { default: 'generic' }],
        '@typescript-eslint/ban-types': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/prefer-ts-expect-error': 'error',
        'import/default': 'off',
        'import/order': 'error',
        'no-dupe-class-members': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 2,
        'no-unused-vars': 'off'
      }
    },
    {
      files: ['*.md'],
      rules: {
        'arrow-body-style': 0,
        'consistent-return': 0,
        'import/no-extraneous-dependencies': 0,
        'import/no-unresolved': 0,
        'jest/no-focused-tests': 0,
        'jest/no-identical-title': 0,
        'jest/valid-expect': 0,
        'no-undef': 0,
        'no-unused-vars': 0,
        'prettier/prettier': 0,
        'sort-keys': 0
      }
    },
    {
      files: ['**/__tests__/**', '**/__mocks__/**'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 0
      }
    }
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['markdown', 'import', 'prettier', 'eslint-comments'],
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    'arrow-body-style': 2,
    'eslint-comments/no-unused-disable': 2,
    'import/no-duplicates': 2,
    'import/no-extraneous-dependencies': [
      2,
      {
        devDependencies: ['**/__tests__/**']
      }
    ],
    'import/no-unresolved': [2, { ignore: ['fsevents'] }],
    'import/order': 2,
    'no-console': 2,
    'no-restricted-imports': [
      2,
      {
        message: 'Please use graceful-fs instead.',
        name: 'fs'
      }
    ],
    'no-unused-vars': 2,
    'prettier/prettier': 2,
    'sort-imports': [2, { ignoreDeclarationSort: true }]
  }
}
