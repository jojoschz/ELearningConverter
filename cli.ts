/**
 * @author: Moritz Jäger
 * @description: Die Typescript-Datei cli.ts bildet die Funktionen des Command-Line-Interfaces ab
 */

import { isMoodleXML, convert, getTableContent } from "./backend/app";
import { Command } from 'commander';
import * as fs from 'fs';


const program = new Command();
program.argument('<input_file_path>', "Moodle-XML oder Ilias-QTI-Datei zum konvertieren").action((input_file_path) => {
    let fileContents;
    try {
        fileContents = fs.readFileSync(input_file_path).toString();
        let output_path = input_file_path.replace(".xml", "IliasQTI.xml");
        if (!isMoodleXML(fileContents)){
            output_path = input_file_path.replace(".xml", "MoodleXML.xml");
        }
        let convertedXML = convert(fileContents);
        if(convertedXML) {
            let tableContent = getTableContent(fileContents);
            console.log("Title: ", tableContent.get('Title'));
            console.log("Type: ", tableContent.get('Type'));
            console.log("Format: ", tableContent.get('Format'));
            fs.writeFileSync(output_path, convertedXML);
            console.log("Written to: ", output_path);
        }
        else {
            console.log("Mit der Konvertierung ist etwas schiefgegangen.");
        }

    } catch (err) {
        console.log(err)
        console.log("Datei "+input_file_path+ " nicht vorhanden.")
    }


});

program.parse();
