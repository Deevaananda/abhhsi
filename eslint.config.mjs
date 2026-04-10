import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

const config = [
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/purity': 'off',
    },
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'public/uploads/**',
    ],
  },
]

export default config
