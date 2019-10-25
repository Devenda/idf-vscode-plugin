// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Uri } from 'vscode';
import * as ws from 'windows-shortcuts';
import * as find from 'find';

import { Config } from './Config';
import { FileSystem } from './FileSystem';
import { Project } from './Project';

let terminal: vscode.Terminal;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('idf-vscode-plugin active');

	//Get standard terminal
	terminal = getNewTerminal();

	//Catch terminal close
	vscode.window.onDidCloseTerminal((closedTerminal) => {
		//Only act on close of plugin terminal
		if (terminal === closedTerminal) {
			terminal = getNewTerminal();
		}
	});

	//Register commands and status bar icons
	registerCommandsAndIcons(context);
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

function handleClosedTerminal() {
	return;
}

function getNewTerminal(): vscode.Terminal {
	//Get terminal
	let terminal = vscode.window.createTerminal("idf-vscode-plugin", "C:\\Windows\\System32\\cmd.exe");

	//Get config
	let config: Config | undefined;
	config = getConfig();
	if (config && terminal) {
		//Setup terminal, start ESP_IDF command prompt
		terminal.sendText("cd " + config.idf_path, true);
		terminal.sendText(config.idf_tools_path + "\\" + "idf_cmd_init.bat " + " \"" + config.python_path + "\" \"" + config.git_path + "\"", true);
	} else {
		setDefaultConfig();
		//TODO: what if it could not be initialized and the commands did not run?
	}

	return terminal;
}

function registerCommandsAndIcons(context: vscode.ExtensionContext) {
	//------------------------------------------//
	// 				idf menuconfig 			    //
	//------------------------------------------//
	//Command
	let idfMenuconfig = 'extension.idfMenuconfig';
	let idfMenu_command = vscode.commands.registerCommand(idfMenuconfig, () => {
		if (!terminal) { handleClosedTerminal(); }

		terminal.show();
		terminal.sendText("cd " + vscode.workspace.rootPath);
		terminal.sendText("idf.py menuconfig", true);
	});
	context.subscriptions.push(idfMenu_command);
	//Status Bar Icon
	let idfMenu_statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -1);
	idfMenu_statusBarItem.command = idfMenuconfig;
	idfMenu_statusBarItem.text = "$(tools)";
	idfMenu_statusBarItem.tooltip = "ESP-IDF Plugin: Menuconfig";
	idfMenu_statusBarItem.show();
	context.subscriptions.push(idfMenu_statusBarItem);

	//------------------------------------------//
	// 				  idf build 			    //
	//------------------------------------------//
	//Command
	let idfBuild = 'extension.idfBuild';
	let idfBuild_command = vscode.commands.registerCommand(idfBuild, () => {
		if (!terminal) { handleClosedTerminal(); }

		terminal.show();
		terminal.sendText("cd " + vscode.workspace.rootPath);
		terminal.sendText("idf.py build", true);
	});
	context.subscriptions.push(idfBuild_command);
	//Status Bar Icon
	let idfBuild_statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -2);
	idfBuild_statusBarItem.command = idfBuild;
	idfBuild_statusBarItem.text = "$(check)";
	idfBuild_statusBarItem.tooltip = "ESP-IDF Plugin: Build";
	idfBuild_statusBarItem.show();
	context.subscriptions.push(idfBuild_statusBarItem);

	//------------------------------------------//
	// 				  idf flash 			    //
	//------------------------------------------//
	//Command
	let idfFlash = 'extension.idfFlash';
	let idfFlash_command = vscode.commands.registerCommand(idfFlash, () => {
		if (!terminal) { handleClosedTerminal(); }

		terminal.show();
		terminal.sendText("cd " + vscode.workspace.rootPath);
		terminal.sendText("idf.py flash", true);
	});
	context.subscriptions.push(idfFlash_command);
	//Status Bar Icon
	let idfFlash_statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -3);
	idfFlash_statusBarItem.command = idfFlash;
	idfFlash_statusBarItem.text = "$(arrow-right)";
	idfFlash_statusBarItem.tooltip = "ESP-IDF Plugin: Flash";
	idfFlash_statusBarItem.show();
	context.subscriptions.push(idfFlash_statusBarItem);


	//------------------------------------------//
	// 				  idf clean 			    //
	//------------------------------------------//
	//Command
	let idfClean = 'extension.idfClean';
	let idfClean_command = vscode.commands.registerCommand(idfClean, () => {
		if (!terminal) { handleClosedTerminal(); }

		terminal.show();
		terminal.sendText("cd " + vscode.workspace.rootPath);
		cleanProgress();
		terminal.sendText("idf.py clean", true);
	});
	context.subscriptions.push(idfClean_command);
	//Status Bar Icon
	let idfClean_statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -4);
	idfClean_statusBarItem.command = idfClean;
	idfClean_statusBarItem.text = "$(trashcan)";
	idfClean_statusBarItem.tooltip = "ESP-IDF Plugin: Clean";
	idfClean_statusBarItem.show();
	context.subscriptions.push(idfClean_statusBarItem);

	//------------------------------------------//
	// 				  idf monitor 			    //
	//------------------------------------------//
	//Command
	let idfMonitor = 'extension.idfMonitor';
	let idfMonitor_command = vscode.commands.registerCommand(idfMonitor, () => {
		if (!terminal) { handleClosedTerminal(); }

		terminal.show();
		terminal.sendText("cd " + vscode.workspace.rootPath);
		terminal.sendText("idf.py monitor", true);
	});
	context.subscriptions.push(idfMonitor_command);
	//Status Bar Icon
	let idfMonitor_statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -5);
	idfMonitor_statusBarItem.command = idfMonitor;
	idfMonitor_statusBarItem.text = "$(terminal)";
	idfMonitor_statusBarItem.tooltip = "ESP-IDF Plugin: Monitor";
	idfMonitor_statusBarItem.show();
	context.subscriptions.push(idfMonitor_statusBarItem);

	//------------------------------------------//
	// 			  idf list examples			    //
	//------------------------------------------//
	//Command
	let idfListExamples = 'extension.idfListExamples';
	let idfListExamples_command = vscode.commands.registerCommand(idfListExamples, () => {
		let project = new Project(getConfig()!);
		let exampleProjects = project.GetFlatListOfExamples();

		// Ask for example, deploy folder, copies example, changes workspace
		vscode.window.showQuickPick(exampleProjects, {
			placeHolder: "Please choose example project"
		}).then(selectedProject => {
			if (selectedProject) {
				vscode.window.showOpenDialog({
					canSelectFiles: false,
					canSelectFolders: true,
					canSelectMany: false,
					openLabel: "Select New Project Folder"
				}).then(selectedDest => {
					if (selectedDest) {
						let fs = new FileSystem();
						let dest = selectedDest[0].fsPath;
						if (fs.FolderIsEmpty(dest)) {
							if (project.InitExampleProject(selectedProject, dest)) {
								let uri = Uri.file(dest);
								vscode.commands.executeCommand('vscode.openFolder', uri);
							}
						}
						else {
							vscode.window.showErrorMessage("Folder is not empty, please choose another.");
						}
					}
				});
			}
		});
	});
	context.subscriptions.push(idfListExamples_command);
	//Status Bar Icon
	let idfListExamples_statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -6);
	idfListExamples_statusBarItem.command = idfListExamples;
	idfListExamples_statusBarItem.text = "Examples";
	idfListExamples_statusBarItem.tooltip = "ESP-IDF Plugin: ListExamples";
	idfListExamples_statusBarItem.show();
	context.subscriptions.push(idfListExamples_statusBarItem);
}

function cleanProgress() {
	//Note: counted files are not equal to files that are being deleted, but we hope that its more than what was counted

	//Get number of files to clean
	let pathToSearch = vscode.workspace.rootPath + '/build';
	let fs = new FileSystem();
	let nbrFilesToClean = fs.CountFilesInDirContainingString(pathToSearch, '.obj');

	//Get Progress 
	let cleanProgress: vscode.Progress<{
		message?: string | undefined;
		increment?: number | undefined;
	}>;

	let resolveProgress: any;
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Running Clean",
		cancellable: true
	}, (progress, token) => {
		token.onCancellationRequested(() => {
			console.log("User canceled the long running operation");
		});

		cleanProgress = progress;

		var p = new Promise(resolve => {
			resolveProgress = resolve;
		});

		return p;
	});

	//Create filewatcher to count files being deleted
	let nbrFilesDeleted = 0;
	let watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.workspace.rootPath!, "build/**"), true, true, false);
	watcher.onDidDelete(() => {
		nbrFilesDeleted++;

		cleanProgress.report({
			increment: (nbrFilesDeleted / nbrFilesToClean) * 100,
			message: (nbrFilesToClean - nbrFilesDeleted) + " files remaining"
		});

		if (nbrFilesDeleted >= nbrFilesToClean) {
			watcher.dispose();
			resolveProgress();
		}
	});
}
