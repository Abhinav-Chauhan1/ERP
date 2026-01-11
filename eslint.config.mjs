import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      // Custom rules from previous .eslintrc.json
      'react/no-unescaped-entities': 'off',
      'react/no-children-prop': 'off',
    },
  },
];
