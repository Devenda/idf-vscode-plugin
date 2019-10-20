export class Config {
    idf_path: string;
    idf_tools_path: string;
    python_path: string;
    git_path: string;

    constructor(idf_path: string, idf_tools_path: string, python_path: string, git_path: string) {
        this.idf_path = idf_path;
        this.idf_tools_path = idf_tools_path;
        this.python_path = python_path;
        this.git_path = git_path;
    }
}