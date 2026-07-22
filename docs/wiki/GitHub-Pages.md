# GitHub Pages

The browser model laboratory is published at [rohingosling.github.io/eca-rule-engine](https://rohingosling.github.io/eca-rule-engine/).

The deployment contains static HTML, CSS, JavaScript, fonts, and Web Worker assets. It does not contain a hosted Java service, database, secret, or server-side function.

All model validation and evaluation occur on the visitor's device. Opening a model reads a user-selected local file; saving or exporting produces a local download or writes through a browser file handle after explicit permission.

GitHub Actions builds the client with the repository base path, uploads the static artifact, and publishes it to the `github-pages` environment.
