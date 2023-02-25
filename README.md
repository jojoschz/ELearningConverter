## Installation

Navigieren sie in das Wurzelverzeichnis des Projekts und benutzen sie folgendesn Befehl, um den benötigten Abhängigkeitsbaum zum bilden.

```bash
npm install --force
```


## CLI Aufrufen

```bash
 npx tsc cli.ts ; node cli.js <PFAD_ZUR_MOODLE_XML_DATEI>
```


## WEB-Interface aufrufen im Entwicklungsmodus

```bash
npm start
```
Der Entwicklungsmodus läuft im Webbrowser unter: http://localhost:8080/

## Erstellen eines Produktionsbuild (Prod)
```bash
npm run build
```
Nach des Ausührung des Script wird ein Ordner /dist, mit dem Produktionsbuild im Repository erstellt. Die dort vorhandene 
*index.html* - Datei kann sofort im Browser ausgeführt werden.