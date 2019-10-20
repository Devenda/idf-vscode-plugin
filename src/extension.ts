// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as ws from 'windows-shortcuts';
import * as find from 'find';

import { Config } from './Config';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('idf-vscode-plugin active');

	let terminal = vscode.window.createTerminal("idf-vscode-plugin");

	//Get config
	let config: Config | undefined;
	config = getConfig();
	if (config) {
		//Setup terminal, start ESP_IDF command prompt
		terminal.show();
		terminal.sendText("cd " + config.idf_path, true);
		terminal.sendText(config.idf_tools_path + "\\" + "idf_cmd_init.bat " + " \"" + config.python_path + "\" \"" + config.git_path + "\"", true);
	} else {
		setDefaultConfig();
		//TODO: what if it could not be initialized and the commands did not run?
	}

	// Launch the terminal als start menuconfig
	let idfMenu_command = vscode.commands.registerCommand('extension.idfMenuconfig', () => {
		if (!config) { return; }

		terminal.show();
		terminal.sendText("cd " + vscode.workspace.rootPath);
		terminal.sendText("idf.py menuconfig", true);
	});
	context.subscriptions.push(idfMenu_command);
}

// this method is called when your extension is deactivated
export function deactivate() { }

function setDefaultConfig() {
	try {
		// Try to get config from ESP-IDF Command Prompt shortcut (installed during official idf tools install)
		let idfCmdPath = find.fileSync(/ESP-IDFF.*\.lnk/, process.env.APPDATA + "/Microsoft/Windows/Start Menu/Programs")[0];

		if (!idfCmdPath) {
			throw new Error("Could not find ESP-IDF Command Prompt in start menu.");
		}

		ws.query(idfCmdPath, (error, options) => {
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
				} else {
					throw new Error("Could not parse ESP-IDF Command Prompt parameters.");
				}
			}
		});
	}
	catch (e) {
		vscode.window.showErrorMessage("Failed to configure default paths, please set them manually in Settings.\n" + e);
	}
}

//Retrieve config from vscode and system, if one value is not found return undefined and try te set defaults
function getConfig(): Config | undefined {
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

	if (idf_path && idf_tools_path && python_path && git_path) {
		return new Config(idf_path, idf_tools_path, python_path, git_path);
	} else {
		setDefaultConfig();
		return undefined;
	}
}
