// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { FileSystem } from './FileSystem';
import { Commands } from './Commands';

let fs: FileSystem;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('idf-vscode-plugin active');
	fs = new FileSystem();

	//Register commands and status bar icons
	try {
		fs.WorkspaceContainsIdfProject().then((isIdfProject) => {
			let cmds = new Commands(context);
			if (isIdfProject) {
				cmds.RegisterProjectCommandsAndIcons(context);
			} else {
				cmds.RegisterStartCommandsAndIcons(context);
			}
		});
	} catch (error) {
		vscode.window.showErrorMessage("Error initializing ESP-IDF Plugin: " + error);
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }

