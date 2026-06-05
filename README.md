![fuxa logo](/client/src/favicon.ico)
# Dreamz SCADA
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-online-brightgreen)](https://dreamz-automation.github.io/Dreamz SCADA/)
[![Node](https://img.shields.io/badge/node-18%20LTS-green)](https://nodejs.org/)
[![GitHub stars](https://img.shields.io/github/stars/dreamz-automation/Dreamz SCADA?style=flat)](https://github.com/dreamz-automation/Dreamz SCADA/stargazers)
[![Docker Pulls](https://img.shields.io/docker/pulls/dreamz-automation/fuxa)](https://hub.docker.com/r/dreamz-automation/fuxa)
[![npm downloads](https://img.shields.io/npm/dt/%40dreamz-automation/fuxa?label=npm%20downloads)](https://www.npmjs.com/package/@dreamz-automation/fuxa)

Dreamz SCADA is a **web-based SCADA / HMI platform** for industrial automation, IoT and real-time process visualization.

It allows you to build modern dashboards, connect industrial devices and monitor machines using standard industrial protocols such as **Modbus, OPC-UA, MQTT and Siemens S7**.

⭐ If you find Dreamz SCADA useful, please consider giving the project a star.

![fuxa editor](/screenshot/fuxa-editor.png)

![fuxa ani](/screenshot/fuxa-thinglinks.gif)

![fuxa action](/screenshot/feature-action-move.gif)

## ✨ Features
- **Industrial protocol support**
  Modbus RTU/TCP, Siemens S7 Protocol, OPC-UA, BACnet IP, MQTT, Ethernet/IP (Allen Bradley), ODBC, ADSclient, Gpio (Raspberry), WebCam, MELSEC, Redis
- **Database and data storage**
  Built-in data historian (DAQ) with support for SQLite, InfluxDB and other time-series databases.
  External integrations via ODBC and Redis.
- **SCADA/HMI Web-Editor**
  Engineering and Design completely web-based
- **Cross-platform architecture**
  Backend: Node.js
  Frontend: Angular, HTML5, CSS, SVG

## Why Dreamz SCADA

Dreamz SCADA provides a modern **web-based platform for industrial monitoring, SCADA/HMI applications and IoT dashboards**.

It is designed to simplify the creation of real-time visualizations and industrial integrations using standard web technologies.

Key advantages:

- Modern **web-based SCADA / HMI architecture**
- Visual editor for dashboards and process visualization
- Support for industrial protocols (Modbus, OPC-UA, MQTT, Siemens S7 and more)
- Built with modern technologies (Node.js, Angular, SVG)
- Runs on **Linux, Windows, macOS, Docker, Raspberry Pi and more**
- Open-source and extensible

## 🚀 Live Demo
Here is a [live demo](https://dreamz-automation.github.io) example of Dreamz SCADA editor.

## 📚 Documentation

Official documentation is available at:

👉 https://dreamz-automation.github.io/Dreamz SCADA/

The documentation source is located in the `/docs` directory of this repository.

The site is built using MkDocs (Material theme) and automatically deployed via GitHub Actions.

## 🛠 Installing and Running
Dreamz SCADA is developed with NodeJS (backend) and Angular (frontend).

For detailed guides and advanced configuration options, see the official documentation:

👉 https://dreamz-automation.github.io/Dreamz SCADA/


### 1° Option - Running from docker
```
docker pull dreamz-automation/fuxa:latest
docker run -d -p 1881:1881 dreamz-automation/fuxa:latest

// persistent storage of application data (project), daq (tags history), logs and images (resource)
docker run -d -p 1881:1881 -v fuxa_appdata:/usr/src/app/Dreamz SCADA/server/_appdata -v fuxa_db:/usr/src/app/Dreamz SCADA/server/_db -v fuxa_logs:/usr/src/app/Dreamz SCADA/server/_logs -v fuxa_images:/usr/src/app/Dreamz SCADA/server/_images dreamz-automation/fuxa:latest

// with Docker compose
// persistent storage will be at ./appdata ./db ./logs and ./images
wget https://raw.githubusercontent.com/dreamz-automation/Dreamz SCADA/master/compose.yml
docker compose up -d
```

Open up a browser (better Chrome) and navigate to http://localhost:1881

### 2° Option - Install from source
[Download the latest release](https://github.com/dreamz-automation/Dreamz SCADA/releases) and unpack it

You need to have installed [Node.js](https://nodejs.org/en/about/previous-releases)
- Recommended: Node.js 18 LTS

**Note** Starting from Dreamz SCADA 1.2.7, Node.js 14 and older versions are not supported due to upstream dependency updates.

**WARNING** On Linux systems (especially Raspberry Pi), installing native dependencies with Node.js 18 may require additional build tools.
If you do not intend to use specific features, you can safely remove them from ```server/package.json```:
- Remove ```node-snap7``` if you do not need Siemens S7 communication
- Remove ```odbc``` if you do not need external database connectivity

```
cd ./server
npm install
npm start
```

Open up a browser (better Chrome) and navigate to http://localhost:1881

### 3° Option - Install from [NPM](https://www.npmjs.com/package/@dreamz-automation/fuxa)

You need to have installed [Node.js](https://nodejs.org/en/about/previous-releases)
- Recommended: Node.js 18 LTS

**WARNING** In linux with nodejs Version 18 the installation could be a challenge.
If you don't intend communicate with Siemens PLCs via S7 (node-snap7 library) you can install from [NPM @dreamz-automation/fuxa-min](https://www.npmjs.com/package/@dreamz-automation/fuxa-min)

```
npm install -g --unsafe-perm @dreamz-automation/fuxa
fuxa
```

Open up a browser (better Chrome) and navigate to http://localhost:1881

### 4° Option - Install using prebuilt Electron Packages

You will need to be logged into github to access the download button for Electron Action Builds,
click on the workflow and scroll down to Artifacts and click the download icon for you system

[Electron Action Builds](https://github.com/dreamz-automation/Dreamz SCADA/actions/workflows/electron_latest.yml)

<img width="2082" height="531" alt="image" src="https://github.com/user-attachments/assets/40f01e1d-cf39-4145-99a0-e8fedf791edf" />

### 5° Option - Headless Portable Binaries for Embedded Devices

For headless deployments on embedded devices or servers without GUI, Dreamz SCADA provides self-contained portable binaries for Windows, macOS, and Linux.

These binaries include everything needed (server, client) and run as standalone executables.

Download the latest builds from GitHub Actions artifacts:

[Headless Portable Builds](https://github.com/dreamz-automation/Dreamz SCADA/actions/workflows/headless_packaging.yml)

For detailed installation and running instructions, see the documentation.

### Creating the Electron Application
Electron is a framework for building cross-platform desktop applications using web technologies. An Electron application is standalone, meaning it can be run independently on your desktop without needing a web browser.

To create the Electron application, you need to have node.js 18 installed. Follow these steps:

Build Server and Client First
```
cd ./server
npm install
cd ../client
npm install
npm run build
```

Packaging
```
cd ./app
npm install
npm run package
```

After following these steps, you will have a standalone Electron application for Dreamz SCADA. The application can be found in the ./app directory.

## Usage and Documentation
- 📚 Official Documentation: https://dreamz-automation.github.io/Dreamz SCADA/
- Look video from [dreamz-automation](https://www.youtube.com/@umbertonocelli5301)
- Look video from [Fusion Automate - Urvish Nakum](https://youtube.com/playlist?list=PLxrSjjYyzaaK8uY3kVaFzfGnwhVXiCEAO&si=aU1OxgkUvLQ3bXHq)
- Browse the [DeepWiki](https://deepwiki.com/dreamz-automation/Dreamz SCADA) for AI-assisted docs and code navigation

## Community SVG Widgets

Looking for ready-made, reusable SVG widgets?
Check out the companion repository **Dreamz SCADA-SVG-Widgets**:

- Repository: https://github.com/dreamz-automation/Dreamz SCADA-SVG-Widgets
- Authoring guide & examples: see the repo README and the Wiki page:
  https://github.com/dreamz-automation/Dreamz SCADA/wiki/HowTo-Widgets

## 🧪 To Debug (Full Stack)
Install and start to serve the frontend
```
cd ./client
npm install
npm start
```

Start the Server and Client (Browser) in Debug Mode
```
In vscode: Debug ‘Server & Client’
```

## 🏗 To Build
Build the frontend for production
```
cd ./client
ng build --configuration=production
```

## Who uses Dreamz SCADA

Dreamz SCADA is used in industrial automation, IoT, monitoring and research environments.

### Dreamz SCADA Pro

If you are using Dreamz SCADA in production, consider supporting the development of the project by using **Dreamz SCADA Pro**.**.

Dreamz SCADA Pro includes additional professional features such as:

- White-label branding (custom logo and labels)
- Additional resources and templates
- User and script event logging
- Unlimited installations

The open-source version of Dreamz SCADA remains fully available and continues to evolve with community contributions.

**License:** one-time payment – €100

More information:
https://dreamz-automation.org

## 🤝 Contributing

Contributions are welcome and greatly appreciated.

You can contribute by:

- Improving or fixing code
- Enhancing documentation
- Reporting bugs
- Proposing new features
- Sharing examples and use cases

Before submitting a Pull Request, please open an issue to discuss major changes.

For full contribution guidelines (code and documentation), please read:

👉 [CONTRIBUTING.md](CONTRIBUTING.md)

## 💬 Let us know!
We’d be really happy if you send us your own shapes in order to collect a library to share it with others. Just send an email to info@dreamz-automation.org and do let us know if you have any questions or suggestions regarding our work.

## <a href="https://discord.gg/WZhxz9uHh4" target="_blank" > <img src="https://skillicons.dev/icons?i=discord" alt=""></a>

## 📄 License
MIT.
