# In3 Test Task &middot; [![CI](https://github.com/muhammetaliakbay/incubed-example/workflows/CI/badge.svg)](https://github.com/muhammetaliakbay/incubed-example) [![TypeDoc](https://img.shields.io/badge/Docs-TypeDoc-blue)](http://incubed-example.muhammetaliakbay.com/docs/index.html) [![Demo](https://img.shields.io/badge/Demo-Web%20App-green)](http://incubed-example.muhammetaliakbay.com/)

This project is created and maintained by Muhammet Ali AKBAY in order to 
be a solution for the test task about job application to Blockchains LLC.

- **Documentations can be found here**: [incubed-example.muhammetaliakbay.com/docs/index.html](http://incubed-example.muhammetaliakbay.com/docs/index.html)
- **Demo Web Application can be found here**: [incubed-example.muhammetaliakbay.com](http://incubed-example.muhammetaliakbay.com/)

---

### About the directory tree:

#### Source Directories:
-   **"src/"** folder contains all the source codes including the contracts
    -   **"src/contracts/"** folder contains source code of Solidity smart contracts
    -   **"src/engine/"** folder contains the heart of the project. API implementations are in this folder.
    -   **"src/test/"** folder contains ".spec.ts" codes which they contain test subjects and implementations. Tests are driven by Mocha encapsulated by Truffle framework to provide api between blockchain node and the tests.
    -   **"src/ui/"** folder contains source codes of application and its assets. It is a simple application to demonstrate the API.
    -   **"src/utils/"** folder contains blockchain and contract utility modules.
-   **".github/"** folder contains task definitions for GitHub actions.

#### Generated Directories:
-   **"bundle/"** directory gets generated by Webpack bundler. It contains bundled javascript and asset files of the application.
    -   **"bundle/docs/"** directory gets generated by the Typedoc compiler, contains compiled typescript documents.
-   **"lib/"** directory gets generated by the Typescript compiler. It contains compiled javascript (from .ts files in "src/") files. They are used for running tests. Also, the library will be published with the files in this directory.

        Note: Truffle will save compiled contract ABIs into the "lib/contracts/" directory.

### About tests
Always execute **"npm install"** before making tests to compile sources.

Always make sure there is a running Ganache instance: **"npm run ganache"**

To execute tests run: **"npm test"** or **"npm run test"**

### Starting electron application:
```bash
npm install
npm run start
```