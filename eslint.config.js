// eslint.config.js
const { configs: jsConfigs } = require("@eslint/js");
const prettier = require("eslint-config-prettier");

module.exports = [
  jsConfigs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
    rules: {
      // Possible Errors
      "no-console": "off", // Allow console.log
      "no-undef": "off",
      "no-debugger": "error",

      // Best Practices
      "eqeqeq": ["error", "smart"], // Use === instead of ==
      "no-alert": "warn",
      "consistent-return": "off",
      "curly": ["error", "multi-line"],

      // Variables
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],

      // Node.js and CommonJS
      "global-require": "warn",
      "no-new-require": "error",
      "no-path-concat": "error",

      // Stylistic Issues
      "indent": ["error", 2], // 2 spaces for indentation
      "quotes": ["error", "single"], // Use single quotes
      "semi": ["error", "always"], // Always use semicolons
      "comma-dangle": ["error", "always-multiline"], // Comma at end of multiline
      "eol-last": "error", // Ensure newline at end of file
      "object-curly-spacing": ["error", "always"], // Space inside curly braces
      "arrow-spacing": ["error", { before: true, after: true }], // Space around arrows
      
    },
  },
  prettier, // Integrate Prettier
];