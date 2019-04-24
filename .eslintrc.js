module.exports = {
    "extends": "airbnb-base",
    "rules": {
        "no-underscore-dangle": "off",
        "no-console": "off",
        "comma-dangle": ["error", {
          "arrays": "always-multiline",
          "objects": "always-multiline",
          "imports": "always-multiline",
          "exports": "always-multiline",
          "functions": "ignore"
        }],
        "arrow-body-style":"off",
        "arrow-parens":"off",
        "import/prefer-default-export": "off",
        "no-await-in-loop": "off",
        "no-restricted-syntax":"off",
        "linebreak-style":"off",
        "max-len": [2, 150, 2],
        "guard-for-in": "off"
    }
};