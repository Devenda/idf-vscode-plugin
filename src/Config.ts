import * as vscode from 'vscode';
import * as find from 'find';
import * as ws from 'windows-shortcuts';
import * as util from 'util';

export class Config {
    public Ready: Thenable<any>;

    idf_path!: string;
    idf_tools_path!: string;
    python_path!: string;
    git_path!: string;

    constructor() {
        this.Ready = new Promise((resolve, reject) => {
            this.getConfig().then(() => {
                resolve(undefined);
            }).catch(reject);
        });
    }

    private async setDefaultConfig() {
        return new Promise(function (resolve, reject) {// Try to get config from ESP-IDF Command Prompt shortcut (installed during official idf tools install)
            find.file(/ESP-IDF.*\.lnk/, process.env.APPDATA + "/Microsoft/Windows/Start Menu/Programs", (idfCmdPath) => {
                if (!idfCmdPath) {
                    reject("Could not find ESP-IDF Command Prompt in start menu.");
                }
                ws.query(idfCmdPath[0], (error, options) => {
                    if (error) {
                        throw new Error(error);
                    }
                    if (options) {
                        let idf_path: string | undefined;
                        let python_path: string | undefined;
                        let git_path: string | undefined;

                        //Set idf path
                        idf_path = options.workingDir;

                        //Parse args for python and git paths
                        if (options.args) {
                            let args = options.args;
                            let strippedArgs = args.substring(args.indexOf("\"") + 1, args.lastIndexOf("\""));
                            let parsedArgs = strippedArgs.match(/(["'])((?=(\\?))\2.)*?\1/g); //https://stackoverflow.com/questions/171480/regex-grabbing-values-between-quotation-marks + change to include backslash

                            if (parsedArgs) {
                                python_path = parsedArgs[1].replace(/"/g, "");
                                git_path = parsedArgs[2].replace(/"/g, "");
                            }
                        }

                        //Check and store
                        if (idf_path && python_path && git_path) {
                            const target = vscode.ConfigurationTarget.Global;

                            let config = vscode.workspace.getConfiguration();

                            config.update('IDF_PATH', idf_path, target);
                            config.update('PythonPath', python_path, target);
                            config.update('GitPath', git_path, target);

                            resolve();
                        } else {
                            reject("Could not parse ESP-IDF Command Prompt parameters.");
                        }
                    }
                });
            });
        });
    }

    //Retrieve config from vscode and system, if one value is not found return undefined and try te set defaults
    private async getConfig() {
        let idf_path: string | undefined;
        let idf_tools_path: string | undefined;
        let python_path: string | undefined;
        let git_path: string | undefined;

        //Read config
        let config = vscode.workspace.getConfiguration();
        idf_path = config.get('IDF_PATH');
        python_path = config.get('PythonPath');
        git_path = config.get('GitPath');

        //Get from env var
        idf_tools_path = process.env.IDF_TOOLS_PATH;
        if (!idf_tools_path) {
            throw new Error("Unable to find IDF_TOOLS PATH environment variable, is ESP-IDF properly installed?");
        }

        if (idf_path && python_path && git_path) {
            this.idf_path = idf_path;
            this.idf_tools_path = idf_tools_path;
            this.python_path = python_path;
            this.git_path = git_path;
        } else {
            await this.setDefaultConfig();
            await this.getConfig();
        }
    }
}