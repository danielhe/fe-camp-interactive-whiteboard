// http://eslint.org/docs/user-guide/configuring
module.exports = {
    root: true,
    parserOptions: {
      parser: 'babel-eslint'
    },
    globals: {
      Vue: true,
      VIDEO_VIEW: true,
    },
    env: {
      browser: true
    },
    extends: ['plugin:vue/essential', 'standard'],
    plugins: ['vue'],
    rules: {
      eqeqeq: 0,
      'comma-dangle': 0,
      'generator-star-spacing': 0,
      semi: [2, 'always'],
      'prefer-promise-reject-errors': 0
    }
  }
