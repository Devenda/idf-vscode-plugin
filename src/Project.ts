import * as vscode from 'vscode';

import { Config } from './Config';
import { FileSystem } from './FileSystem';

export class Project {
    config: Config;
    fs: FileSystem;

    constructor(config: Config) {
        this.config = config;
        this.fs = new FileSystem();
    }

    public GetFlatListOfExamples(): string[] {
        let examples: string[] = [];

        examples = this.fs.ListAllMainFolders(this.config.idf_path);
        let idfExamplesPath = this.config.idf_path.split('\\').join('/') + "/examples/"; //Because replace only replaces first occurance...

        return examples.map(e => e.replace(idfExamplesPath, "").replace("/main", "")).sort();
    }

    public InitExampleProject(path: string, destination: string): boolean {
        let source = this.config.idf_path + '/examples/' + path;
        let success = this.fs.CopyFolderToFolder(source, destination);

        return success ? true : false;
    }
}