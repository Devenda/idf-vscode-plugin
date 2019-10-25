import * as vscode from 'vscode';

import * as fs from 'fs-extra';
import * as glob from 'glob';

export class FileSystem {

    constructor() { }

    public CountFilesInDirContainingString(path: string, st: string): number {

        return glob.sync(path + '/**/*' + st).length;
    }

    public ListAllMainFolders(path: string) {

        return glob.sync(path + '/examples/**/main');
    }

    public CopyFolderToFolder(src: string, dst: string): string | undefined {
        try {
            fs.copySync(src, dst);
            vscode.window.showInformationMessage('Copy Successful');

            return dst;
        } catch (err) {
            console.log(err);
            vscode.window.showErrorMessage(err);

            return undefined;
        }
    }

    public FolderIsEmpty(path: string): boolean {
        let project = glob.sync(path + '**/*');

        if (project.length >= 1) {
            return false;
        }
        else {
            return true;
        }
    }
}