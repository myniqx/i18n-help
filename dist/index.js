#!/usr/bin/env node
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as deepL from 'deepl-node';
import { dirname } from "path";
import { fileURLToPath } from "url";
const program = new Command();
const execute = "#G$ i18nHelp# ";
const example = "\n#RExample#: ";
const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = path.join(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
program
    .version(packageJson.version)
    .description(packageJson.description);
let spinnerIndex = 0;
const spinnerFrames = ['/', '-', '\\', '|'];
function colored(str) {
    const regex = /#(B|R|G|Y|M|C|W)([^#]*)#|#([^#]*)/g;
    return str.replace(regex, (match, group1, group2) => {
        if (group1 === 'B')
            return `\x1b[34m${group2}\x1b[0m`;
        if (group1 === 'R')
            return `\x1b[31m${group2}\x1b[0m`;
        if (group1 === 'G')
            return `\x1b[32m${group2}\x1b[0m`;
        if (group1 === 'Y')
            return `\x1b[33m${group2}\x1b[0m`;
        if (group1 === 'M')
            return `\x1b[35m${group2}\x1b[0m`;
        if (group1 === 'C')
            return `\x1b[36m${group2}\x1b[0m`;
        if (group1 === 'W')
            return `\x1b[37m${group2}\x1b[0m`;
        return `\x1b[37m${match}\x1b[0m`;
    });
}
function logExt(str, icon = 'log') {
    const coloredStr = colored(str);
    if (icon === 'log') {
        console.log(coloredStr);
        spinnerIndex = -1;
    }
    else if (icon !== null) {
        process.stdout.write(`\r[${icon === 'success' ? 'OK' : 'ERR'}] ${coloredStr}\n[${spinnerFrames[spinnerIndex++ % spinnerFrames.length]}]`);
    }
    else {
        process.stdout.write(`\r[${spinnerFrames[spinnerIndex++ % spinnerFrames.length]}] ${coloredStr}`);
    }
}
class ExtConfig {
    constructor(config) {
        this.targetFolder = config.targetFolder;
        this.additionalFolders = config.additionalFolders;
        this.sortItemByName = config.sortItemByName;
        this.deepL_ApiKey = config.deepL_ApiKey;
        this.folders = fs.readdirSync(config.targetFolder);
    }
    forEachFolder(callback) {
        this.foldersCheck();
        this.folders.forEach(callback);
    }
    foldersCheck() {
        if (this.folders.length === 0) {
            throw new Error(colored(`No#R common.json# file found in #R${this.targetFolder}#.`));
        }
    }
    getCommonFileAsObject(folder) {
        this.foldersCheck();
        const firstFolder = folder ?? this.folders[0];
        const commonJsonPath = path.join(this.targetFolder, firstFolder, "common.json");
        if (!fs.existsSync(commonJsonPath)) {
            throw new Error(colored(`No#R common.json# file found in #R${firstFolder}# folder.`));
        }
        const commonJson = fs.readFileSync(commonJsonPath, "utf8");
        return JSON.parse(commonJson);
    }
    async forEachFile(callback) {
        this.foldersCheck();
        for (const folder of this.folders) {
            const commonJsonPath = path.join(this.targetFolder, folder, "common.json");
            if (!fs.existsSync(commonJsonPath))
                return;
            try {
                const commonJson = fs.readFileSync(commonJsonPath, "utf8");
                const commonJsonObj = JSON.parse(commonJson);
                callback(folder, commonJsonPath, commonJsonObj);
            }
            catch {
            }
        }
    }
    writeToAdditionalFolders(folder, data) {
        this.additionalFolders.forEach((additionalFolder) => {
            const additionalFolderPath = path.join(additionalFolder, folder);
            if (!fs.existsSync(additionalFolderPath)) {
                fs.mkdirSync(additionalFolderPath);
            }
            const filePath = path.join(additionalFolderPath, "common.json");
            fs.writeFileSync(filePath, data);
        });
        return this.additionalFolders.length === 0 ?
            "." :
            ` and #Y${this.additionalFolders.length}# additional folders.`;
    }
}
const readConfig = () => {
    const configFile = path.join(process.cwd(), "i18nHelper.config.json");
    if (!fs.existsSync(configFile)) {
        throw new Error("i18nHelper.config.json not found. Please run setup command first.");
    }
    const config = JSON.parse(fs.readFileSync(configFile, "utf8"));
    if (!config.targetFolder) {
        throw new Error("Please specify target folder, run setup command first.");
    }
    if (!fs.existsSync(config.targetFolder)) {
        console.warn("Target folder not found : " + config.targetFolder);
    }
    if (!config.deepL_ApiKey || !config.deepL_ApiKey.length) {
        config.deepL_ApiKey = process.env.DEEPL_API_KEY || "";
    }
    const configExt = new ExtConfig(config);
    return configExt;
};
program
    .command("setup")
    .argument("<targetFolder>", "target folder to setup")
    .argument("[additionalFolders...]", "additional folders to copy locale files to")
    .description("Setup required config file.")
    .action((targetFolder, additionalFolders) => {
    const configFile = path.join(process.cwd(), "i18nHelper.config.json");
    const config = {
        targetFolder,
        additionalFolders: additionalFolders ?? [],
        sortItemByName: true,
        deepL_ApiKey: ""
    };
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    console.log("i18nHelper.config.json has been created.");
});
/******************************
  FIND

*******************************/
/**
 * Find any word in common.json files.
 *
 * @param anyWord the word to search
 * @param searchIn where to search, "key", "value" or "both"
 * @param locale the locale to search in, if null, the first folder in targetFolder is used
 */
const find = (anyWord, searchIn, locale) => {
    const config = readConfig();
    const keySearch = searchIn === "key" || searchIn === "both";
    const valueSearch = searchIn === "value" || searchIn === "both";
    const commonJsonObj = config.getCommonFileAsObject(locale);
    const lowerWord = anyWord.toLowerCase();
    const foundEntries = Object.entries(commonJsonObj).filter(([key, value]) => {
        if (keySearch && key.toLowerCase().includes(lowerWord))
            return true;
        if (valueSearch && value.toLowerCase().includes(lowerWord))
            return true;
        return false;
    });
    if (foundEntries.length === 0) {
        console.log("No entries found.");
        return;
    }
    logExt(`Found #G${foundEntries.length}# entries:`);
    return foundEntries.reduce((acc, [key, value], index) => {
        if (keySearch || valueSearch) {
            logExt(`\nResult ##Y${index + 1}#`);
            acc[index + 1] = key;
        }
        if (keySearch) {
            var keyColored = key.replace(new RegExp(`(${lowerWord})`, "gi"), "#R$1#");
            logExt(`Key   : ${keyColored}`);
        }
        if (!valueSearch)
            return acc;
        var valueColored = value.replace(new RegExp(`(${lowerWord})`, "gi"), "#R$1#");
        logExt(`Value : ${valueColored}`);
        return acc;
    }, {});
};
program
    .command("find")
    .argument("<any-word>", "the word to search (case-insensitive)")
    .argument("[search-in]", colored(`where to search, can be '#Gkey#', '#Gvalue#', or '#Gboth#' (default: '#Gboth#')`), "both")
    .argument("[locale]", colored(`the locale to search in, if null, the first folder in targetFolder is used
${example}:
  ${execute} find #Chello# #Gkey# #Ctr#
  This command will search for the word '#Chello#' in the '#Gkey#' field of the '#Ctr#' locale in the common.json files.`))
    .description("Searches for a word in the common.json files.")
    .action((anyWord, searchIn, locale) => {
    find(anyWord, searchIn ?? "both", locale);
});
/******************************
  ADD

*******************************/
const translateText = async (authKey, text, targetLocale) => {
    if (!authKey || authKey.length === 0)
        return text;
    try {
        const translator = new deepL.Translator(authKey);
        const targetFinalLocale = targetLocale === "en" ? "en-US" :
            targetLocale === "pt" ? "pt-BR" : targetLocale;
        const result = await translator.translateText(text, null, targetFinalLocale);
        return result.text;
    }
    catch {
        return text;
    }
};
function sortObjectKeys(obj) {
    return Object.fromEntries(Object.entries(obj).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)));
}
/**
 * Add a new word to all common.json files in the target folder and its additional folders.
 *
 * @param key The key of the word to add.
 * @param value The value of the word to add.
 * @param localeValues An object with locale as key and value as value.
 * @param overwrite If true, overwrite existing key.
 */
const add = async (key, value, localeValues = {}, overwrite = false) => {
    const config = readConfig();
    await config.forEachFile(async (folder, commonJsonPath, commonJsonObj) => {
        if (commonJsonObj[key] && !overwrite) {
            logExt(`Key #G${key}# already #Rexists# in #G${folder}# folder. try "#Y--overwrite#" if you want to overwrite.`);
            return;
        }
        const localeValue = localeValues[folder] ?? (await translateText(config.deepL_ApiKey, value, folder));
        commonJsonObj[key] = localeValue;
        const sortedCommonJsonObj = config.sortItemByName === true
            ? sortObjectKeys(commonJsonObj)
            : commonJsonObj;
        const jsonString = JSON.stringify(sortedCommonJsonObj, null, 2);
        fs.writeFileSync(commonJsonPath, jsonString);
        const additionalMessage = config.writeToAdditionalFolders(folder, jsonString);
        logExt(`Added #C${key}#: #G${localeValue}# to #G${folder}# folder${additionalMessage}.`);
    });
};
program
    .command("add")
    .description("Add a new key=value entry to all common.json files in the target folder.")
    .argument("<key>", "Key of the word to add")
    .argument("<value>", colored(`value of the key to add (this ll be used every locale file, if "#Y--locale#" options says otherwise)
${example}:
  ${execute} add #Chello# #Cworld# #Y--locale# #Ctr=merhaba# #Y--overwrite#
  This command will add the word 'hello' with the English value 'world' and the Turkish value 'merhaba' to the common.json files, overwriting any existing key.`))
    .option("-l, --locale <locale-value>", `Add locale value (e.g. #Ctr=merhaba#)`, (value, previous) => {
    if (!value)
        return previous;
    const parts = value.split("=");
    const key = parts[0];
    const val = parts[1];
    return { ...previous, [key]: val };
}, {})
    .option("-o, --overwrite", "Overwrite existing key", () => true, false)
    .action((key, value, options) => {
    add(key, value, options.locale, options.overwrite);
});
/******************************
  DELETE

*******************************/
/**
 * Delete keys from all common.json files in the target folder and its additional folders.
 *
 * @param {string[]} keys The keys to delete.
 */
const deleteKeys = (keys) => {
    const config = readConfig();
    config.forEachFile(async (folder, commonJsonPath, commonJsonObj) => {
        const deletedKeys = [];
        keys.forEach((key) => {
            if (commonJsonObj[key]) {
                deletedKeys.push(key);
                delete commonJsonObj[key];
            }
        });
        if (deletedKeys.length === 0) {
            logExt(`No#R key# found in #G${folder}# folder.`);
            return;
        }
        const jsonString = JSON.stringify(commonJsonObj, null, 2);
        fs.writeFileSync(commonJsonPath, jsonString);
        const additionalMessage = config.writeToAdditionalFolders(folder, jsonString);
        const strDeleted = deletedKeys.map(k => `#C${k}#`).join(", ");
        logExt(`Deleted ${strDeleted} from #G${folder}# folder${additionalMessage}`);
    });
};
/**
 * Delete key from all common.json files in the target folder and its additional folders.
 * If selective is true, then it will ask user to input the key's numbers to delete separated by comma (,)
 *
 * @param key The key to delete
 * @param selective If true, ask user to input the key's numbers to delete
 */
const deleteKey = (key, selective = false) => {
    if (!selective) {
        deleteKeys([key]);
        return;
    }
    const result = find(key, "both", null);
    if (!result)
        return;
    console.log("Enter the key's numbers to delete separated by comma (,) :");
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (input) => {
        const numbers = input.toString().split(",");
        const list = numbers.map((n) => result[+n]);
        deleteKeys(list);
        process.stdin.destroy();
    });
};
program
    .command("delete")
    .argument("<key>", `Key of the entry to delete or word to search if option --selective is used
${example}:
  ${execute} delete #Chello# #Y--selective#
  This command will find all occurrences of the word 'hello' in the common.json files, including partial matches, and ask you to select which ones to delete, separated by commas (e.g. 1,3,5).
\nNote:
  If #Y--selective# is not used, the command will delete the key only if it matches exactly.`)
    .description("Delete a key from all common.json files.")
    .option("-s, --selective", "Choose from all occurrences", () => true, false)
    .action((key, options) => {
    deleteKey(key, options.selective);
});
/******************************
UNUSED

*******************************/
const unused = async (workingDir) => {
    const config = readConfig();
    logExt("Checking common.json...", null);
    const commonJsonObj = config.getCommonFileAsObject(null);
    let keys = Object.keys(commonJsonObj);
    const currentDir = workingDir ?? process.cwd();
    const ignoredFolders = ["node_modules", "dist", "build", "coverage"];
    const walkDir = (dir) => {
        if (!keys.length)
            return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (!keys.length)
                return;
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                if (!ignoredFolders.includes(file)) {
                    walkDir(filePath);
                }
            }
            else if (file.endsWith(".tsx") || file.endsWith(".jsx")) {
                logExt(`Checking #C${filePath}#...`, null);
                const fileContent = fs.readFileSync(filePath, "utf8");
                const keysToRemove = [];
                for (const key of keys) {
                    if (fileContent.includes(`'${key}'`) ||
                        fileContent.includes(`"${key}"`)) {
                        keysToRemove.push(key);
                    }
                }
                if (keysToRemove.length) {
                    const keysStr = keysToRemove.map(k => `#Y${k}#`).join(", ");
                    logExt(`Found in #G${filePath}#: ${keysStr}`, 'success');
                }
                keys = keys.filter((key) => !keysToRemove.includes(key));
                if (!keys.length)
                    return;
            }
        }
    };
    walkDir(currentDir);
    logExt("Done!", 'success');
    logExt("#BWarning#: These listed keys might be used as a parameter. Only keys found directly in the file are listed.");
    logExt(`Found #Y${keys.length}# possible unused keys:`);
    keys.map((key, index) => {
        logExt(`${(index + 1).toFixed(0).padStart(3, " ")} - "#R${key}#"`, 'fail');
    });
};
program
    .command("unused")
    .argument("[dir]", "the directory to search in", process.cwd())
    .description("Find unused keys in common.json files.")
    .action((dir) => {
    unused(dir);
});
if (process.argv.length < 3) {
    program.help();
}
program.parse(process.argv);
