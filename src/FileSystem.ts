import * as vscode from 'vscode';
import { workspace } from 'vscode';


import * as fs from 'fs-extra';
import * as glob from 'glob';

export class FileSystem {

    constructor() { }

    public CountFilesInDirContainingString(path: string, st: string): number {

        return glob.sync(path + '/**/*' + st).length;
    }

    public async ListAllMainFolders(path: string): Promise<string[]> {
        return new Promise(function (resolve, reject) {
            return glob(path + '/examples/**/main', (err, data) => {
                if (err !== null) { reject(err); }
                else { resolve(data); }
            });
        });
    }

    public async WorkspaceContainsIdfProject(): Promise<boolean> {
        let prjFile = await workspace.findFiles("CMakeLists.txt");

        if (prjFile.length >= 1) {
            return true;
        } else {
            return false;
        }
    }

    public CopyFolderToFolder(src: string, dst: string): string | undefined {
        try {
            fs.copySync(src, dst);

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