import * as vscode from 'vscode';
import * as find from 'find';
import * as ws from 'windows-shortcuts';
import * as os from 'os';

export class Config {
    public Ready: Thenable<any>;

    idf_path!: string;
    idf_tools_path!: string;

    constructor() {
        this.Ready = new Promise((resolve, reject) => {
            this.getConfig().then(() => {
                resolve(undefined);
            }).catch(reject);
        });
    }

    private async setDefaultConfig() {
        let idf_path: string | undefined;

        // Test env var
        if (process.env.IDF_PATH) {
            idf_path = process.env.IDF_PATH;
        } else {
            let noIdfFound = true;

            // Ask user to define esp-idf path
            while (noIdfFound) {
                let selectedDest = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    openLabel: "Select esp-idf Folder..."
                });

                if (selectedDest) {
                    let dir = find.fileSync("export.bat", selectedDest[0].fsPath);
                    if (dir && dir.length === 1) {
                        noIdfFound = false;
                        idf_path = selectedDest[0].fsPath;
                    } else {
                        vscode.window.showWarningMessage("Folder does not contain export.bat, please choose another.");
                        noIdfFound = true;
                    }
                } else {
                    break;
                }
            }
        }

        // Save config      
        const target = vscode.ConfigurationTarget.Global;
        let config = vscode.workspace.getConfiguration();

        await config.update('IDF_PATH', idf_path, target);
    }

    //Retrieve config from vscode and system, if one value is not found return undefined and try te set defaults
    private async getConfig() {
        let idf_path: string | undefined;
        let idf_tools_path: string | undefined;

        //Read config
        let config = vscode.workspace.getConfiguration();
        idf_path = config.get('IDF_PATH');

        //Get from env var
        idf_tools_path = process.env.IDF_TOOLS_PATH;
        if (!idf_tools_path) {
            throw new Error("Unable to find IDF_TOOLS_PATH environment variable, is ESP-IDF properly installed?");
        }

        if (idf_path) {
            this.idf_path = idf_path;
            this.idf_tools_path = idf_tools_path;
        } else {
            let option = await vscode.window.showWarningMessage("Could not find esp-idf folder", "Select Folder");
            if (option === "Select Folder") {
                await this.setDefaultConfig();
                await this.getConfig();
            } else {
                vscode.window.showWarningMessage("The esp-idf folder is not configured, this folder is needed for the proper functioning of this plugin. The path can also be set in this plugin's settings.");
            }
        }
    }
}