module.exports = {
  extends: ['airbnb-base', 'prettier'],
  env: {
    node: true
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'warn',

    'no-await-in-loop': 'off',

    // Rules below are all added to remove conflicts with prettier. DO NOT REMOVE
    'arrow-parens': 'off',
  },
};
