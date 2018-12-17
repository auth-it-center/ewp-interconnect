# Erasmus Without Paper Interconnect

This is the implementation for the discovery, echo and institutions APIs, of the Erasmus Without Paper network, using the provided specifications (https://developers.erasmuswithoutpaper.eu/), of the Aristotle University of Thessaloniki. The project is under development.

### Requirements

- nodejs v10.13.0
- npm v6.4.1
- mongodb v4.0.4

### Dependencies

    axios: v0.18.0
    connect-http-signature: v0.1.3
    dotenv: v6.2.0
    express: v4.x
    http-signature: v1.2.0
    moment: v2.22.2
    mongodb: v3.1.10
    nodemon: 1.18.8
    simple-node-logger: v0.93.40
    uuidv4: v2.0.0
    xml-js: v1.6.8

The above are  the node modules used in the project.

### Specifications

This implementation has been developed using the specifications defined by the EWP community.
The specifications of the discovery API are descibed [here](https://github.com/erasmus-without-paper/ewp-specs-api-discovery).
The specifications of the echo API are descibed [here](https://github.com/erasmus-without-paper/ewp-specs-api-echo).
The specifications of the insitutions API are descibed [here](https://github.com/erasmus-without-paper/ewp-specs-api-institutions).

### Installing

1. Clone the repo to your local machine :
```
git clone https://github.com/auth-it-center/ewp-interconnect.git
```
2. Navigate to the created folder.
3. To install the dependencies, run :
```
npm install
```
4. Create a .env file and add the following information (for example, see .env_example file):
    - ip/host on which you want the server to run (HOST)
    - the filepath to your own certificate (SERVER_CERTIFICATE_PATH) (the certificate must include the whole certificate chain in the same file)
    - the filepaths to your own private and public rsa keys (SERVER_RSA_PRIVATE_KEY_PATH, SERVER_RSA_PUBLIC_KEY_PATH)
    - the sha256 of your rsa public key (SERVER_RSA_PUBLIC_KEY_HASH)
    - the urls of the apis (DISCOVERY_URL, ECHO_URL, INSTITUTIONS_URL)
    - the paths to the xml files for your discovery and institutions apis (DISCOVERY_MANIFEST, INSTITUTIONS_XML)
    - the absolute path to a folder to keep a backup of the registry catalogue (CATALOGUE_FOLDER)
    - the path to a folder to keep log files (LOGS_FOLDER)

## Running the project:
Start the MongoDB daemon and then run the app with:
```
npm start
```
## Running the Test

To test the echo API after you publish your discovery manifest, go to the bottom of https://developers.erasmuswithoutpaper.eu/ and choose your host from the echo dropdown list.

## Documentation
The project documentaion can be found [here]( https://auth-it-center.github.io/ewp-interconnect/).

## Built With

* [NodeJS](https://nodejs.org/en/) - Runtime Engine
* [ExpressJS](https://expressjs.com/) - Framework
* [NPM](https://www.npmjs.com/) - Package Manager
* [MongoDB](https://www.mongodb.com/) - Database

## Authors

* **Besinas Argyrios** -  [GitHub](https://github.com/silver11111), [E-mail](besinas@hotmail.com)
* **Stratigakis Iakovos** -  [GitHub](https://github.com/iakovosds), [E-mail](iakovosds@csd.auth.gr)

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Daskopoulos Dimitrios - [LinkedIn](https://gr.linkedin.com/in/dimitris-daskopoulos-98028815a)
* Selalmazidis Anastasios - [GitHUb](https://github.com/anselal)
