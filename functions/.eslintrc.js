module.exports = {
  env: { es2022: true, node: true },
  parserOptions: { ecmaVersion: 2022, sourceType: "script" },
  extends: ["eslint:recommended"], // quita "google"
  rules: {
    "require-jsdoc": "off",
    "max-len": "off",
    "eol-last": ["error", "always"],
    "object-curly-spacing": "off",
    "comma-dangle": "off",
    "arrow-parens": "off",
    "no-unused-vars": ["warn"]
  }
};

