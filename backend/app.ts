/**
 * @project: E-Learning Konverter
 * @author Karen Czerwonatis, Johannes Schmitz, Moritz Jäger
 * @description: Enthält den eigentlichen Konverter
 */


import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';

/**
 * Überprüft ob Aufgabe im Moodle-Format ist
 * @param XML der Aufgabe als String
 * @returns True, wenn Moodle XML, sonst false
 */
export function isMoodleXML(possibleMoodleXmlString: string){
    // naive check if xml is Moodle XML
    const options = {
        attributeNamePrefix: "_",
        ignoreAttributes: false,
        ignoreNameSpace: false,
    };

    const parser: XMLParser = new XMLParser(options);
    let parsedData = parser.parse(possibleMoodleXmlString);
    return parsedData.hasOwnProperty('quiz') // check if quiz property in parsed xml
}

/**
 * Konvertiert Moodle Multiple Choice Aufgaben zu Ilias Multiple Choice Aufgaben
 * @param builder 
 * @param qtimetadatafieldType Aufgabentyp in Ilias 
 * @param answers eingelesene Aufgabe
 * @param title Titel der Aufgabe
 * @param text Aufgabentext
 * @param isSingleChoice Ob die Frage Single-Choice ist
 * @returns null, wenn konvertierung nicht erfolgreich, string mit dem Ilias XML wenn erfolgreich
 */
function convertMoodleMultipleChoice(builder, qtimetadatafieldType, answers, title, text, isSingleChoice){

    let qtiAnswers = []
    let qtiRespcondition = []

    for (let i = 0; i < answers.length; i++) {
        let fraction = parseInt(answers[i]._fraction) / 100
        qtiAnswers.push({
            "_ident": i,
            "material": {
                "mattext": answers[i].text
            }
        });

        if (fraction > 0) {
            qtiRespcondition.push({
                "conditionvar": {
                    "varequal": { "#text": i, "_respident": "MCMR" }
                },
                "setvar": { "#text": fraction, "_action": "Add" },
                "displayfeedback": "",
                "_continue": "Yes"
            });
            qtiRespcondition.push({
                "conditionvar": {
                    "not": {
                        "varequal": { "#text": i, "_respident": "MCMR" }
                    }
                },
                "setvar": { "#text": 0, "_action": "Add" },
                "_continue": "Yes",
                "displayfeedback": ""
            });
        } else {
            qtiRespcondition.push({
                "conditionvar": {
                    "varequal": { "#text": i, "_respident": "MCMR" }
                },
                "setvar": { "#text": fraction, "_action": "Add" },
                "_continue": "Yes",
                "displayfeedback": ""
            });
            qtiRespcondition.push({
                "conditionvar": {
                    "not": {
                        "varequal": { "#text": i, "_respident": "MCMR" }
                    }
                },
                "setvar": { "#text": 0, "_action": "Add" },
                "_continue": "Yes",
                "displayfeedback": ""
            });

        }

    }

    let qtiFeedback = []
    for (let i = 0; i < answers.length; i++) {
        qtiFeedback.push({
            "_ident":"response_"+i,
            "flow_mat": {
                "material": {
                    "mattext": answers[i].feedback
                }
            }
        });
    }


    let newIdent = "moodleConversion" + Math.floor(Math.random() * 100000000);
    const qtiData = {
        "questestinterop": {
            "item": {
                "_ident": newIdent,
                "_title": title,
                "_maxattempts": 0,
                "itemmetadata": {
                    "qtimetadata": {
                        "qtimetadatafield": [
                            qtimetadatafieldType
                        ]
                    }
                },
                "presentation": {
                    "_label": title,
                    "flow": {
                        "material": {
                            "mattext": text
                        },
                        "response_lid": {
                            "_ident": "MCMR",
                            "_rcardinality": isSingleChoice ? "Single" : "Multiple",
                            "render_choice": {
                                "_shuffle": "Yes",
                                "response_label": qtiAnswers
                            }
                        }
                    }
                },
                "resprocessing": {
                    "outcomes": {
                        "decvar": ""
                    },
                    "respcondition": qtiRespcondition
                },
                "itemfeedback": qtiFeedback
            }
        }
    }
    let iliasQTIXML: string = '<?xml version="1.0" encoding="utf-8"?> <!DOCTYPE questestinterop SYSTEM "ims_qtiasiv1p2p1.dtd">' + builder.build(qtiData);
    return iliasQTIXML

}

/**
 * Konvertiert Moodle essay (Text Eingeben) Aufgaben zu Ilias Freitext bzw Ilias Datei hochladen Aufgaben
 * @param builder 
 * @param qtimetadatafieldType Aufgabentyp in Ilias 
 * @param parsedData eingelesene Aufgabe
 * @param title Titel der Aufgabe
 * @param text Aufgabentext
 * @param punkte maximale Punktzahl
 * @returns konvertierten Aufgabentext
 */
function convertMoodleEssay(builder, qtimetadatafieldType, parsedData, title, text, punkte){
    let newIdent = "moodleConversion" + Math.floor(Math.random() * 100000000);
    let antwortformat = parsedData.quiz.question.responseformat;
    // Antwort per Texteingabe
    let termrelationNon = {
        "fieldlabel": "termrelation",
        "fieldentry": "non"
    };
    if (antwortformat == "editor") {

        const qtiData = {
            "questestinterop": {
                "item": {
                    "_ident": newIdent,
                    "_title": title,
                    "_maxattempts": 0,
                    "itemmetadata": {
                        "qtimetadata": {
                            "qtimetadatafield": [
                                qtimetadatafieldType,
                                termrelationNon
                            ]
                        } 

                    },
                    "presentation": {
                        "_label": title,
                        "flow": {
                            "material": {
                                "mattext": text
                            },
                            "response_str": {
                                "_ident": "TEXT",
                                "_rcardinality": "Ordered",
                                "render_fib": {
                                    "_fibtype": "String",
                                    "_prompt": "Box",
                                    "response_label": {
                                        "_ident": "A"
                                    }
                                }
                            }
                        }
                    },
                    "resprocessing": {
                        "_scoremodel": "HumanRater",
                        "outcomes": {
                            "decvar": {
                                "_varname": "WritingScore",
                                "_vartype": "Integer",
                                "_minvalue": "0",
                                "_maxvalue": punkte
                            }
                        },
                        "respcondition": {
                            "conditionvar": {
                                "other": "tutor_rated"
                            }
                        }
                    }

                }
            }
        }

        let iliasQTIXML: string = '<?xml version="1.0" encoding="utf-8"?> <!DOCTYPE questestinterop SYSTEM "ims_qtiasiv1p2p1.dtd">' + builder.build(qtiData);
        return iliasQTIXML
        // Antwort per Datei hochladen
    } else if (antwortformat == "noinline") {
        let qtiMetadata = []
        let newIdent = "moodleConversion" + Math.floor(Math.random() * 100000000);
        let maxgroesse = parsedData.quiz.question.maxbytes;
        let erweiterungen = parsedData.quiz.question.filetypeslist;
        qtiMetadata.push({
            "qtimetadatafield": [
                qtimetadatafieldType
            ]
        });
        qtiMetadata.push({
            "qtimetadatafield": {
                "fieldlabel": "points",
                "fieldentry": punkte
            }
        });
        qtiMetadata.push({
            "qtimetadatafield": {
                "fieldlabel": "maxsize",
                "fieldentry": maxgroesse
            } 
        })
        qtiMetadata.push({
            "qtimetadatafield": {
                "fieldlabel": "allowedextensions",
                "fieldentry": erweiterungen
            }
        })
        const qtiData = {
            "questestinterop": {
                "item": {
                    "_ident": newIdent,
                    "_title": title,
                    "_maxattempts": 0,
                    "itemmetadata": {
                        "qtimetadata": qtiMetadata
                    },
                    "presentation": {
                        "_label": title,
                        "flow": {
                            "material": {
                                "mattext": text
                            },

                        }
                    }
                }

            }
        }
        let iliasQTIXML: string = '<?xml version="1.0" encoding="utf-8"?> <!DOCTYPE questestinterop SYSTEM "ims_qtiasiv1p2p1.dtd">' + builder.build(qtiData);
        return iliasQTIXML
    }
}

/**
 * liest allgemeine Eigenschaften der Aufgabe ein, bestimmt den Typ und ruft die entsprechende Funktion zur Konvertierung auf
 * @param moodleXMLString Moodle XML Aufgabe
 * @returns konvertierte Ilias QTI Aufgabe
 */
export function convertMoodleXMLToIliasQTI(moodleXMLString: string) {
    // entry point for moodle to ilias conversion

    if (XMLValidator.validate(moodleXMLString)) {
        const options = {
            attributeNamePrefix: "_",
            ignoreAttributes: false,
            ignoreNameSpace: false,
        };

        const parser: XMLParser = new XMLParser(options);
        const builder: XMLBuilder = new XMLBuilder(options);
        let parsedData = parser.parse(moodleXMLString);
        //console.log(parsedData);
        let title = parsedData.quiz.question.name.text;
        let text = parsedData.quiz.question.questiontext.text;
        let penalty = parsedData.quiz.question.penalty;
        let punkte = parsedData.quiz.question.defaultgrade;
        let questionType = parsedData.quiz.question._type;
        let incorrectFeeback = parsedData.quiz.question.incorrectfeedback;
        let answers = parsedData.quiz.question.answer;
        let isSingleChoice = parsedData.quiz.question.single;

        let qtiType = "";

        if (questionType == "multichoice") {
            qtiType = isSingleChoice ? "SINGLE CHOICE QUESTION": "MULTIPLE CHOICE QUESTION";

            // Freitext eingeben:
        } else if ((questionType == "essay") && (parsedData.quiz.question.responseformat == "editor")) {
            qtiType = "TEXT QUESTION";
            // Datei hochladen:
        } else if ((questionType == "essay") && (parsedData.quiz.question.responseformat == "noinline")) {
            qtiType = "assFileUpload";
        }


        const qtimedatafieldType = {
            "fieldlabel": "QUESTIONTYPE",
            "fieldentry": qtiType
        }

        if (questionType == "multichoice") {
            return convertMoodleMultipleChoice(builder, qtimedatafieldType, answers, title, text, isSingleChoice);
        } else if (questionType == "essay") {
            return convertMoodleEssay(builder, qtimedatafieldType, parsedData, title, text, punkte)
        }
        return null;

    }
}

/**
 * Gibt den Questiontype einer Ilias Frage in der Moodle-Benennung zurück
 * @param parsedData eingelesene Aufgabe
 * @returns Moodle Aufgabentyp
 */
function getIliasQTIQuestionType(parsedData){
    let qtimetadatafield = parsedData.questestinterop.item.itemmetadata.qtimetadata.qtimetadatafield;
    let moodleType = "";
    if (typeof qtimetadatafield[Symbol.iterator] !== 'function') {
        qtimetadatafield = [qtimetadatafield];
    }

    qtimetadatafield.forEach(function (d) {
        if(d.fieldlabel == 'QUESTIONTYPE'){
            if (d.fieldentry == 'MULTIPLE CHOICE QUESTION'){
                moodleType = "multichoice"
            }
            if (d.fieldentry == 'SINGLE CHOICE QUESTION'){
                moodleType = "singlechoice"
            }
            if (d.fieldentry == 'TEXT QUESTION'){
                moodleType = "essay"
            }
            if (d.fieldentry == 'assFileUpload'){
                moodleType = "essay"
            }
        }
    });
    return moodleType;
}

/**
 * konvertiert Ilias QTI Aufgaben der Typen Multiple Choice, Freitext-eingeben und Datei-hochladen
 * @param iliasQTIString eingelesene Ilias QTI Aufgabe
 * @returns Moodle XML Aufgabe
 */
export function convertIliasQTIToMoodleXML(iliasQTIString: string) {

    if (XMLValidator.validate(iliasQTIString)) {

        const options = {
            attributeNamePrefix: "_",
            ignoreAttributes: false,
            ignoreNameSpace: false,
        };

        const parser: XMLParser = new XMLParser(options);
        const builder: XMLBuilder = new XMLBuilder(options);
        let parsedData = parser.parse(iliasQTIString);
        let title = parsedData.questestinterop.item._title;
        let text = parsedData.questestinterop.item.presentation.flow.material.mattext['#text'];
        let isSingleChoice = false;
        

        let moodleType = "";
        let essayScoringMode = "";
        // essaytype 0: Freitext eingeben; essaytype 1: Datei hochladen
        let essaytype = 0;
        let punkte = 0;
        let maxGroesse = 0;
        // erlaubte Dateiendungen
        let erweiterungen = "";

        let qtimetadatafield = parsedData.questestinterop.item.itemmetadata.qtimetadata.qtimetadatafield;
        if (typeof qtimetadatafield[Symbol.iterator] !== 'function') {
            qtimetadatafield = [qtimetadatafield];
        }

        qtimetadatafield.forEach(function (d) {
            if(d.fieldlabel == 'QUESTIONTYPE'){
                if (d.fieldentry == 'MULTIPLE CHOICE QUESTION'){
                    moodleType = "multichoice"
                }
                if (d.fieldentry == 'SINGLE CHOICE QUESTION'){
                    moodleType = "multichoice"
                    isSingleChoice = true;
                }
                if (d.fieldentry == 'TEXT QUESTION'){
                    moodleType = "essay"
                }
                if (d.fieldentry == 'assFileUpload'){
                    moodleType = "essay"
                    essaytype = 1;
                }
            }
            if (d.fieldlabel == 'termrelation') {
                if (d.fieldentry == 'non'){
                    essayScoringMode = "non";
                }
            }
            if (d.fieldlabel == 'points') {
                punkte = d.fieldentry;
            }
            if (d.fieldlabel == 'maxsize') {
                maxGroesse = d.fieldentry;
            }
            if (d.fieldlabel == 'allowedextensions') {
                erweiterungen = d.fieldentry['#text'];
            }
           
        });
        if (moodleType == ""){
            return null;
        }

        
        if (moodleType== "multichoice") {
            let correctfeedback = "";
            let incorrectfeedback = "";
            let answers = [];
            let responseLabels = [];
            parsedData.questestinterop.item.presentation.flow.response_lid.render_choice.response_label.forEach(function (d) {
                if (d.material.mattext['#text'] === undefined) {
                    responseLabels.push(d.material.mattext)
                } else {
                    responseLabels.push(d.material.mattext['#text'])
                }

            });
            let fractionPerAnswer = []
            let correctAnswers = 0;
            parsedData.questestinterop.item.resprocessing.respcondition.forEach(function (d) {
                if(d.hasOwnProperty("setvar") && !d.conditionvar.hasOwnProperty("not")){
                    let id = Number(d.conditionvar.varequal['#text'])

                    let varValue = Number(d.setvar['#text'])
                    let fraction = 0;
                    if (varValue <= 0){
                        fraction = -100;
                    } else {
                        fraction = 100;
                        correctAnswers += 1;
                    }
                    fractionPerAnswer[id] = fraction;
                }
            });

            parsedData.questestinterop.item.itemfeedback.forEach(function (d){
                let feedback = d.flow_mat.material.mattext['#text']
                if(d._ident == "response_allcorrect"){
                    correctfeedback = feedback
                } else if (d._ident == "response_onenotcorrect"){
                    incorrectfeedback = feedback;
                } else {
                    let id = d._ident.includes("response_") ? Number(d._ident.replace("response_","")) : Number(d._ident);
                    let fraction = fractionPerAnswer[id];
                    if (fraction > 0){
                        fraction = fraction/correctAnswers;
                    }

                    answers.push({
                        "text": responseLabels[id],
                        "_fraction":fraction,
                        "_format":"html",
                        "feedback": {
                            "_format":"html",
                            "text": feedback
                        }
                    });
                }
            });
            let moodleData = {
                "quiz": {
                    "question": {
                        "single": isSingleChoice,
                        "_type": moodleType,
                        "name": {
                            "text": title
                        },
                        "questiontext": {
                            "text": text
                        },
                        "generalfeedback": {
                            "text": ""
                        },
                        "hidden": 0,
                        "idnumber": "",
                        "correctfeedback": {
                            "_format":"html",
                            "text": correctfeedback
                        },
                        "partiallycorrectfeedback": {
                            "_format":"html",
                            "text": incorrectfeedback
                        },
                        "incorrectfeedback": {
                            "_format":"html",
                            "text": incorrectfeedback
                        },
                        "shownumcorrect": "",
                        "answer": answers,
                    }
                }
            }
            let moodleXML: string = '<?xml version="1.0" encoding="utf-8"?>' + builder.build(moodleData);

            return moodleXML

        }
        // Freitext eingeben
        if ((moodleType == "essay")&&(essaytype == 0)) {

            // Nur Aufgaben, die in keiner Weise automatisch bewertet werden, können bisher übersetzt werden
            if (essayScoringMode != "non"){
                console.log(essayScoringMode);
                console.log("Falscher Freitext Typ, automatische Bewertung erwünscht");
                return null;
            }

            let score = Number(parsedData.questestinterop.item.resprocessing.outcomes.decvar._maxvalue);



            // Mindestens zwei Zeilen sind vorgegeben
            let lines = 2;

            let char = Number(parsedData.questestinterop.item.presentation.flow.response_str.render_fib._maxchars);
            // Hier gehe ich von 50 Zeichen pro Zeile aus. Ich hoffe, das ist halbwegs realistisch.
            let temp = ~~(char/50);
            if (temp >= 2){

                lines = temp;
            }


            let moodleData = {
                "quiz": {
                    "question": {

                        "_type": moodleType,
                        "name": {
                            "text": title
                        },
                        "questiontext": {
                            "text": text
                        },
                        "generalfeedback": {
                            "text": ""
                        },
                        "defaultgrade": score,
                        "penalty": 0,
                        "hidden": 0,
                        "idnumber": "",
                        "responseformat": "editor",
                        "responserequired": 1,
                        "responsefieldlines": lines,
                        "minwordlimit": "",
                        "maxwordlimit": "",
                        "attachments": 0,
                        "attachmentsrequired": 0,
                        "maxbytes": 0,
                        "filetypeslist": "",
                        "graderinfo": {
                            "_format": "html",
                            "text": ""
                        },
                        "responsetemplate": {
                            "_format": "html",
                            "text": ""
                        }
                    }
                }
            }

            let moodleXML: string = '<?xml version="1.0" encoding="utf-8"?>' + builder.build(moodleData);

            return moodleXML
        }

        // Datei hochladen
        if ((moodleType == "essay")&&(essaytype == 1)) {
            let moodleData = {
                "quiz": {
                    "question": {

                        "_type": moodleType,
                        "name": {
                            "text": title
                        },
                        "questiontext": {
                            "text": text
                        },
                        "generalfeedback": {
                            "text": ""
                        },
                        "defaultgrade": punkte,
                        "penalty": 0,
                        "hidden": 0,
                        "idnumber": "",
                        "responseformat": "noinline",
                        "responserequired": 1,
                        "responsefieldlines": 10,
                        "minwordlimit": "",
                        "maxwordlimit": "",
                        "attachments": 1,
                        "attachmentsrequired": 1,
                        "maxbytes": maxGroesse,
                        "filetypeslist": erweiterungen,
                        "graderinfo": {
                            "_format": "html",
                            "text": ""
                        },
                        "responsetemplate": {
                            "_format": "html",
                            "text": ""
                        }
                    }
                }
            }

            let moodleXML: string = '<?xml version="1.0" encoding="utf-8"?>' + builder.build(moodleData);

            return moodleXML
        }

    }
    return null;
}

/**
 * Allgemeine Konvertierungsfunktion für Ilias und Moodle Aufgaben
 * @param moodleOrIliasXMLString Das XML der Aufgabe als String
 * @returns Konvertierte Aufgabe als String
 */
export function convert(moodleOrIliasXMLString: string){
    if(isMoodleXML(moodleOrIliasXMLString)){
        return convertMoodleXMLToIliasQTI(moodleOrIliasXMLString);
    } else {
        return convertIliasQTIToMoodleXML(moodleOrIliasXMLString);
    }
}

/**
 * Gibt allgemeine Daten über eine Aufgabe (Title, Type, Format) zurück
 * @param xmlString Das XML der Aufgabe als String
 * @returns Map mit den Informationen zur Aufgabe
 */
export function getTableContent(xmlString: string) {
    var mapReturn = new Map<String, any>();
    if (XMLValidator.validate(xmlString)) {
        const options = {
            attributeNamePrefix: "_",
            ignoreAttributes: false,
            ignoreNameSpace: false,
        };
        const parser: XMLParser = new XMLParser(options);
        const builder: XMLBuilder = new XMLBuilder(options);
        let parsedData = parser.parse(xmlString);
        if(isMoodleXML(xmlString)) {
            mapReturn.set("Title", parsedData.quiz.question.name.text);
            mapReturn.set("Type", parsedData.quiz.question._type);
            mapReturn.set("Format", "Moodle-XML");  
        } else {
            mapReturn.set("Title", parsedData.questestinterop.item._title);
            mapReturn.set("Type", getIliasQTIQuestionType(parsedData));
            mapReturn.set("Format", "IliasQTI");
        }
        mapReturn.set("Status", false);
        mapReturn.set("Context", xmlString);
        return mapReturn;
    }
    return null;
}

