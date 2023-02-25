/**
 * @project: E-Learning Konverter
 * @author: Johannes Schmitz
 * @description: Die Typescript-Datei main.ts bildet den entrypoint für webpack
 * Enthält den Code für das clientseitige Verhalten des Web-Interface. 
 */

import { Grid, GridOptions } from 'ag-grid-community';
import { getTableContent } from '../../backend/app';
import { convert } from '../../backend/app';

import "./Stylesheet.css"; //for external individual css styles
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";

/** 
 * Definition der Tabellenoptionen (ag-grid-community) 
 */
const gridOptions: GridOptions = <GridOptions>{
    columnDefs: [
        { field: 'Title', sortable: true},
        { field: 'Type' },
        { field: 'Format' },
        { field: 'Status' },
    ],
    rowData: [],
    rowSelection: 'multiple',
    rowMultiSelectWithClick: true,
}

/**
 * ag-grid Tabelle dem DOM hinzufügen.
 */
document.addEventListener('DOMContentLoaded', function() {
    let grid:HTMLElement = <HTMLElement>document.getElementById("myTable");
    new Grid(grid, gridOptions);
});

var fileInput: HTMLElement = null;
var rawData: Array<any> = new Array();
var data: Array<any> = new Array();

document.getElementById("uploadButton").addEventListener('click', getFile);
document.getElementById("downloadButton").addEventListener('click', startConvert)

document.addEventListener('DOMContentLoaded', function() {
    fileInput = document.getElementById("upFile");
});

function getFile() {
    document.getElementById("upFile").click();
    fileInput.addEventListener('change', readFiles);
}

/**
 * Funktion zum lesen von einzelnen XML-Dateien
 */
async function readFiles() {
    var inputXML: File = (<HTMLInputElement>fileInput).files[0];
    
    var reader: FileReader = new FileReader();
    reader.readAsText(inputXML);
    reader.onloadend = function() {
        var readXml: string = reader.result.toString();
        rawData.push(readXml);
        setTimeout(handleFiles, 1000);
    }
}

/**
 * Funktion zum verarbeiten der hochgeladenen Datei 
 */
function handleFiles() {
    for(let i = 0; i < rawData.length; i++) {
        var temp = getTableContent(rawData[i]);
        if(temp != null) {
            data[i] = new Object();
            data[i]["Title"] = temp.get("Title"); 
            data[i]["Type"] = temp.get("Type"); 
            data[i]["Format"] = temp.get("Format"); 
            if(temp.get("Status") == false) {
                data[i]["Status"] = "nicht konvertiert"; 
            } 
            data[i]["Context"] = temp.get("Context"); 
        }
    }
    gridOptions.api.setRowData(data);
} 

/**
 * Funktion zum starten des Konverters und aktualisieren des Tabelleninhalt
 */
function startConvert() {
    var fileArray: Array<File> = new Array();
    const selectedData = gridOptions.api.getSelectedNodes();
    for(let i = 0; i < selectedData.length; i++) {
        var temp = getTableContent(convert(data[selectedData[i].rowIndex]["Context"]));
        data[selectedData[i].rowIndex]["Title"] = temp.get("Title"); 
        data[selectedData[i].rowIndex]["Type"] = temp.get("Type"); 
        data[selectedData[i].rowIndex]["Format"] = temp.get("Format"); 
        data[selectedData[i].rowIndex]["Status"] = "konvertiert"; 
        data[selectedData[i].rowIndex]["Context"] = temp.get("Context"); 
        downloadXML(data[selectedData[i].rowIndex]["Context"], data[selectedData[i].rowIndex]["Title"] + data[selectedData[i].rowIndex]["Format"] + selectedData[i].rowIndex + ".xml");
    }
    gridOptions.api.setRowData(data);
}

/**
 * Funktion zum erstellen einer donwload fähigen XML-Datei
 * @param content -> Inhalt der gedownloadeten Datei
 * @param fileName -> Name der gedownloadeten Datei
 */
function downloadXML(content: string, fileName: string) {
    let uriContent = URL.createObjectURL(new Blob([content], {type: 'text/xml'}));
    let link = document.createElement('a');
    link.setAttribute('href', uriContent);
    link.setAttribute('download', fileName);
    let event = new MouseEvent('click');
    link.dispatchEvent(event);
}


