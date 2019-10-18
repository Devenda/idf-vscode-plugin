// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as ws from 'windows-shortcuts';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('idf-vscode-plugin active');

	let terminal = vscode.window.createTerminal("idf-vscode-plugin");

	// Try to get config from ESP-IDF Command Prompt shortcut (installed during official idf tools install)
	ws.query("C:/Users/tinus/AppData/Roaming/Microsoft/Windows/Start Menu/Programs/ESP-IDF/ESP-IDF Command Prompt (cmd.exe).lnk", (error, options) => {
		if (options) {
			console.log(options);
			console.log("target: " + options.args);
			console.log("start in: " + options.workingDir);
		}
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.idfMenuconfig', () => {
		console.log('Starting ESP-IDF Command Prompt');

		terminal.show();
		terminal.sendText("cd C:/Users/tinus/esp/esp-idf");
		terminal.sendText("export.bat");
		terminal.sendText("%IDF_PATH%/tools/idf.py menuconfig");
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
