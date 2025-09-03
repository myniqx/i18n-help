#!/usr/bin/env node

import { Command } from "commander"
import * as fs from "fs"
import * as path from "path"
import * as deepL from 'deepl-node';
import { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv-flow';
import process from "process";

const program = new Command()
const execute = "#G$ i18nHelp# "
const example = "\n#RExample#: "

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = path.join(__dirname, "../package.json")
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

program
  .version(packageJson.version)
  .description(packageJson.description)

let spinnerIndex = 0;
const spinnerFrames = ['/', '-', '\\', '|'];

function colored(str: string) {
  const regex = /#(B|R|G|Y|M|C|W)([^#]*)#|#([^#]*)/g;
  return str.replace(regex, (match, group1, group2) => {
    if (group1 === 'B') return `\x1b[34m${group2}\x1b[0m`;
    if (group1 === 'R') return `\x1b[31m${group2}\x1b[0m`;
    if (group1 === 'G') return `\x1b[32m${group2}\x1b[0m`;
    if (group1 === 'Y') return `\x1b[33m${group2}\x1b[0m`;
    if (group1 === 'M') return `\x1b[35m${group2}\x1b[0m`;
    if (group1 === 'C') return `\x1b[36m${group2}\x1b[0m`;
    if (group1 === 'W') return `\x1b[37m${group2}\x1b[0m`;
    return `\x1b[37m${match}\x1b[0m`;
  });
}

function logExt(str: string, icon: 'success' | 'fail' | 'log' | null = 'log') {
  const coloredStr = colored(str);

  if (icon === 'log') {
    console.log(coloredStr);
    spinnerIndex = -1
  } else if (icon !== null) {
    process.stdout.write(`\r[${icon === 'success' ? 'OK' : 'ERR'}] ${coloredStr}\n[${spinnerFrames[spinnerIndex++ % spinnerFrames.length]}]`);
  } else {
    process.stdout.write(`\r[${spinnerFrames[spinnerIndex++ % spinnerFrames.length]}] ${coloredStr}`);
  }
}

/******************************
  SETUP

*******************************/

interface Config {
  targetFolder: string
  isIntl: boolean
  keyCase: 'camelCase' | 'snake_case' | 'kebab-case'
  sortItemByName: boolean
}

class ExtConfig implements Config {
  targetFolder: string;
  isIntl: boolean;
  keyCase: 'camelCase' | 'snake_case' | 'kebab-case';
  sortItemByName: boolean;
  deepL_ApiKey: string;
  folders: string[]

  constructor(config: Config) {
    this.targetFolder = config.targetFolder
    this.isIntl = config.isIntl
    this.keyCase = config.keyCase
    this.sortItemByName = config.sortItemByName
    this.deepL_ApiKey = "";
    
    if (config.isIntl) {
      // For intl: get language codes from .json filenames
      this.folders = fs.readdirSync(config.targetFolder)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
    } else {
      // For i18n: get folder names  
      this.folders = fs.readdirSync(config.targetFolder)
        .filter(item => fs.statSync(path.join(config.targetFolder, item)).isDirectory())
    }
  }

  forEachFolder(callback: (folder: string) => void): void {
    this.foldersCheck()
    this.folders.forEach(callback)
  }

  foldersCheck() {
    if (this.folders.length === 0) {
      throw new Error(colored(
        `No#R common.json# file found in #R${this.targetFolder}#.`,
      ))
    }
  }

  getCommonFileAsObject(folder: string | null) {
    this.foldersCheck()
    const firstFolder = folder ?? this.folders[0]
    const commonJsonPath = this.isIntl 
      ? path.join(this.targetFolder, `${firstFolder}.json`)
      : path.join(this.targetFolder, firstFolder, "common.json")

    const fileName = this.isIntl ? `${firstFolder}.json` : "common.json"
    if (!fs.existsSync(commonJsonPath)) {
      throw new Error(colored(
        `No#R ${fileName}# file found${this.isIntl ? '' : ` in #R${firstFolder}# folder`}.`
      ))
    }

    const commonJson = fs.readFileSync(commonJsonPath, "utf8")
    return JSON.parse(commonJson) as Record<string, any>
  }

  async forEachFile(callback: (folder: string, filePath: string, data: Record<string, any>) => Promise<void>) {
    this.foldersCheck()
    for (const folder of this.folders) {
      const commonJsonPath = this.isIntl 
        ? path.join(this.targetFolder, `${folder}.json`)
        : path.join(this.targetFolder, folder, "common.json");
      if (!fs.existsSync(commonJsonPath)) continue;

      try {
        const commonJson = fs.readFileSync(commonJsonPath, "utf8");
        const commonJsonObj = JSON.parse(commonJson) as Record<string, any>;
        callback(folder, commonJsonPath, commonJsonObj)
      } catch {
      }
    }
  }


  readDeepLApiKey() {
    if (this.deepL_ApiKey)
      return

    dotenv.config()
    this.deepL_ApiKey = process.env.DEEPL_API_KEY ?? "";
    if (!this.deepL_ApiKey)
      logExt("DeepL api key hasn't found. Auto-translate will be#R disabled#.")
    else
      logExt(`DeepL api key(${this.deepL_ApiKey.slice(0, 3)}...${this.deepL_ApiKey.slice(-3)}) found. Auto-translate will be#G enabled#.`)
  }
}

const readConfig = (readEnv = false): ExtConfig => {
  const configFile = path.join(process.cwd(), "i18nHelper.config.json")
  if (!fs.existsSync(configFile)) {
    throw new Error("i18nHelper.config.json not found. Please run setup command first.")
  }
  const config = JSON.parse(fs.readFileSync(configFile, "utf8"))

  if (!config.targetFolder) {
    throw new Error("Please specify target folder, run setup command first.")
  }

  if (!fs.existsSync(config.targetFolder)) {
    console.warn("Target folder not found : " + config.targetFolder)
  }

  const configExt = new ExtConfig(config)
  if (readEnv)
    configExt.readDeepLApiKey()

  return configExt
}

program
  .command("setup")
  .argument("<targetFolder>", "target folder to setup")
  .description("Setup required config file.")
  .action((targetFolder: string) => {
    const configFile = path.join(process.cwd(), "i18nHelper.config.json")
    const config = {
      targetFolder,
      isIntl: false,
      keyCase: 'camelCase' as const,
      sortItemByName: true
    } satisfies Config
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
    console.log("i18nHelper.config.json has been created.")
  })


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
const find = (
  anyWord: string,
  searchIn: "key" | "value" | "both",
  locale: string | null,
) => {
  const config = readConfig()
  const keySearch = searchIn === "key" || searchIn === "both"
  const valueSearch = searchIn === "value" || searchIn === "both"
  const commonJsonObj = config.getCommonFileAsObject(locale)
  const lowerWord = anyWord.toLowerCase()

  let foundEntries: Array<{ path: string, value: string }> = []

  if (config.isIntl) {
    // Use nested search for intl format
    foundEntries = findInNested(commonJsonObj, anyWord).filter(entry => {
      if (keySearch && entry.path.toLowerCase().includes(lowerWord)) return true
      if (valueSearch && entry.value.toLowerCase().includes(lowerWord)) return true
      return false
    })
  } else {
    // Use flat search for i18n format
    foundEntries = Object.entries(commonJsonObj)
      .filter(([key, value]) => {
        if (keySearch && key.toLowerCase().includes(lowerWord)) return true
        if (valueSearch && (value as string).toLowerCase().includes(lowerWord)) return true
        return false
      })
      .map(([key, value]) => ({ path: key, value: value as string }))
  }

  if (foundEntries.length === 0) {
    console.log("No entries found.")
    return
  }

  logExt(`Found #G${foundEntries.length}# entries:`)
  return foundEntries.reduce((acc, entry, index) => {
    if (keySearch || valueSearch) {
      logExt(`\nResult ##Y${index + 1}#`)
      acc[index + 1] = entry.path
    }
    if (keySearch) {
      var keyColored = entry.path.replace(
        new RegExp(`(${lowerWord})`, "gi"),
        "#R$1#",
      )
      logExt(`${config.isIntl ? 'Path' : 'Key'}  : ${keyColored}`)
    }

    if (!valueSearch) return acc
    var valueColored = entry.value.replace(
      new RegExp(`(${lowerWord})`, "gi"),
      "#R$1#",
    )
    logExt(`Value : ${valueColored}`)
    return acc
  }, {} as Record<number, string>)
}


program
  .command("find")
  .argument("<any-word>", "the word to search (case-insensitive)")
  .argument(
    "[search-in]",
    colored(`where to search, can be '#Gkey#', '#Gvalue#', or '#Gboth#' (default: '#Gboth#')`),
    "both",
  )
  .argument(
    "[locale]",
    colored(`the locale to search in, if null, the first folder in targetFolder is used
${example}:
  ${execute} find #Chello# #Gkey# #Ctr#
  This command will search for the word '#Chello#' in the '#Gkey#' field of the '#Ctr#' locale in the common.json files.`,
    ))
  .description("Searches for a word in the common.json files.")
  .action((anyWord: string, searchIn: string, locale: string) => {
    find(anyWord, (searchIn ?? "both") as "key" | "value" | "both", locale)
  })


/******************************
  ADD

*******************************/

const translateText = async (authKey: string | null | undefined, text: string, targetLocale: string) => {
  if (!authKey || authKey.length === 0) return text
  try {
    const translator = new deepL.Translator(authKey)
    const targetFinalLocale =
      targetLocale === "en" ? "en-US" :
        targetLocale === "pt" ? "pt-BR" : targetLocale
    const result = await translator.translateText(text, null, targetFinalLocale as deepL.TargetLanguageCode)
    return result.text
  } catch {
    return text
  }
}

function sortObjectKeys(obj: { [key: string]: any }): { [key: string]: any } {
  return Object.fromEntries(
    Object.entries(obj).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)),
  )
}

// Nested JSON utility functions
function setNestedValue(obj: any, path: string, value: string): void {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
}

function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (typeof current !== 'object' || current === null || !(key in current)) {
      return undefined
    }
    current = current[key]
  }

  return typeof current === 'string' ? current : undefined
}

function deleteNestedValue(obj: any, path: string): boolean {
  const keys = path.split('.')
  let current = obj
  const parents: any[] = []

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (typeof current !== 'object' || current === null || !(key in current)) {
      return false
    }
    parents.push({ obj: current, key })
    current = current[key]
  }

  const lastKey = keys[keys.length - 1]
  if (typeof current !== 'object' || current === null || !(lastKey in current)) {
    return false
  }

  delete current[lastKey]

  // Clean up empty parent objects
  for (let i = parents.length - 1; i >= 0; i--) {
    const parent = parents[i]
    if (Object.keys(parent.obj[parent.key]).length === 0) {
      delete parent.obj[parent.key]
    } else {
      break
    }
  }

  return true
}

function findInNested(obj: any, searchTerm: string, basePath = ''): Array<{ path: string, value: string }> {
  const results: Array<{ path: string, value: string }> = []
  const lowerSearchTerm = searchTerm.toLowerCase()

  function traverse(current: any, currentPath: string) {
    if (typeof current === 'string') {
      if (current.toLowerCase().includes(lowerSearchTerm) ||
        currentPath.toLowerCase().includes(lowerSearchTerm)) {
        results.push({ path: currentPath, value: current })
      }
    } else if (typeof current === 'object' && current !== null) {
      for (const [key, value] of Object.entries(current)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key
        traverse(value, newPath)
      }
    }
  }

  traverse(obj, basePath)
  return results
}

// Key case validation functions
function validateKeyCase(key: string, caseType: 'camelCase' | 'snake_case' | 'kebab-case'): boolean {
  switch (caseType) {
    case 'camelCase':
      return /^[a-z][a-zA-Z0-9]*$/.test(key)
    case 'snake_case':
      return /^[a-z][a-z0-9_]*$/.test(key)
    case 'kebab-case':
      return /^[a-z][a-z0-9-]*$/.test(key)
    default:
      return true
  }
}

function fixKeyCase(key: string, caseType: 'camelCase' | 'snake_case' | 'kebab-case'): string {
  // Convert to camelCase first
  let camelCase = key
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^[A-Z]/, char => char.toLowerCase())

  switch (caseType) {
    case 'camelCase':
      return camelCase
    case 'snake_case':
      return camelCase.replace(/[A-Z]/g, char => `_${char.toLowerCase()}`)
    case 'kebab-case':
      return camelCase.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)
    default:
      return key
  }
}

function validatePath(path: string, caseType: 'camelCase' | 'snake_case' | 'kebab-case'): { valid: boolean, invalidKeys: string[] } {
  const keys = path.split('.')
  const invalidKeys: string[] = []

  for (const key of keys) {
    if (!validateKeyCase(key, caseType)) {
      invalidKeys.push(key)
    }
  }

  return {
    valid: invalidKeys.length === 0,
    invalidKeys
  }
}

function fixPath(path: string, caseType: 'camelCase' | 'snake_case' | 'kebab-case'): string {
  return path.split('.').map(key => fixKeyCase(key, caseType)).join('.')
}

/**
 * Add a new word to all common.json files in the target folder.
 *
 * @param key The key/path of the word to add (e.g., "hello" or "contact.header").
 * @param value The value of the word to add.
 * @param localeValues An object with locale as key and value as value.
 * @param overwrite If true, overwrite existing key.
 * @param autoFix If true, automatically fix key case issues.
 * @param skipValidation If true, skip key case validation.
 */
const add = async (
  key: string,
  value: string,
  localeValues = {} as Record<string, string>,
  overwrite = false,
  autoFix = false,
  skipValidation = false,
) => {
  const config = readConfig(true);

  // Key validation
  if (!skipValidation) {
    const validation = validatePath(key, config.keyCase);
    if (!validation.valid) {
      if (autoFix) {
        const fixedKey = fixPath(key, config.keyCase);
        logExt(`Key case fixed: #Y${key}# → #G${fixedKey}#`);
        key = fixedKey;
      } else {
        logExt(`#RError#: Invalid key case for #Y${key}#. Expected #G${config.keyCase}# format.`);
        logExt(`Invalid parts: ${validation.invalidKeys.map(k => `#R${k}#`).join(', ')}`);
        logExt(`Use #Y--auto-fix# to automatically correct or #Y--skip-validation# to bypass.`);
        return;
      }
    }
  }

  await config.forEachFile(async (folder, commonJsonPath, commonJsonObj) => {
    // Check if key exists (different for i18n vs intl)
    const keyExists = config.isIntl ?
      getNestedValue(commonJsonObj, key) !== undefined :
      commonJsonObj[key] !== undefined;

    if (keyExists && !overwrite) {
      logExt(
        `Key #G${key}# already#R exists# in #G${folder}# folder. Use "#Y--overwrite#" to overwrite.`,
      );
      return;
    }

    const localeValue = localeValues[folder] ?? (await translateText(config.deepL_ApiKey, value, folder));

    if (config.isIntl) {
      setNestedValue(commonJsonObj, key, localeValue);
    } else {
      commonJsonObj[key] = localeValue;
    }

    const sortedCommonJsonObj =
      config.sortItemByName === true
        ? sortObjectKeys(commonJsonObj)
        : commonJsonObj;

    const jsonString = JSON.stringify(sortedCommonJsonObj, null, 2);
    fs.writeFileSync(commonJsonPath, jsonString);

    logExt(`Added #C${key}#: #G${localeValue}# to #G${folder}# folder.`);
  })
};

program
  .command("add")
  .description(
    "Add a new key=value entry to all common.json files in the target folder.",
  )
  .argument("<key>", "Key/path of the word to add (e.g., 'hello' or 'contact.header')")
  .argument(
    "<value>", colored(
      `value of the key to add (will be used for every locale file, unless "#Y--locale#" specifies otherwise)
${example}:
  ${execute} add #Chello# #Cworld# #Y--locale# #Ctr=merhaba# #Y--overwrite#
  ${execute} add #Ccontact.header# #CContact Us# #Y--locale# #Ctr=Bize Ulaşın#
  The first command adds a flat key, the second adds a nested key for intl format.`,
    ))
  .option(
    "-l, --locale <locale-value>",
    `Add locale value (e.g. #Ctr=merhaba#)`,
    (value: string, previous: Record<string, string>) => {
      if (!value) return previous
      const parts = value.split("=")
      const key = parts[0]
      const val = parts[1]
      return { ...previous, [key]: val }
    },
    {} as Record<string, string>,
  )
  .option("-o, --overwrite", "Overwrite existing key", () => true, false)
  .option("-f, --auto-fix", "Automatically fix key case issues", () => true, false)
  .option("-s, --skip-validation", "Skip key case validation", () => true, false)
  .action((key: string, value: string, options: any) => {
    add(key, value, options.locale, options.overwrite, options.autoFix, options.skipValidation)
  })

/******************************
  DELETE

*******************************/

/**
 * Delete keys/paths from all common.json files in the target folder.
 *
 * @param {string[]} keys The keys/paths to delete.
 */
const deleteKeys = (keys: string[]) => {
  const config = readConfig()

  config.forEachFile(async (folder, commonJsonPath, commonJsonObj) => {
    const deletedKeys: string[] = []

    keys.forEach((key) => {
      let deleted = false

      if (config.isIntl) {
        deleted = deleteNestedValue(commonJsonObj, key)
      } else {
        if (commonJsonObj[key]) {
          delete commonJsonObj[key]
          deleted = true
        }
      }

      if (deleted) {
        deletedKeys.push(key)
      }
    })

    if (deletedKeys.length === 0) {
      logExt(`No#R key/path# found in #G${folder}# folder.`)
      return
    }

    const jsonString = JSON.stringify(commonJsonObj, null, 2)
    fs.writeFileSync(commonJsonPath, jsonString)
    const strDeleted = deletedKeys.map(k => `#C${k}#`).join(", ")
    logExt(`Deleted ${strDeleted} from #G${folder}# folder.`)
  })
}

/**
 * Delete key from all common.json files in the target folder and its additional folders.
 * If selective is true, then it will ask user to input the key's numbers to delete separated by comma (,)
 *
 * @param key The key to delete
 * @param selective If true, ask user to input the key's numbers to delete
 */
const deleteKey = (key: string, selective = false) => {
  if (!selective) {
    deleteKeys([key])
    return
  }
  const result = find(key, "both", null)
  if (!result) return
  console.log("Enter the key's numbers to delete separated by comma (,) :")
  process.stdin.setEncoding("utf8")
  process.stdin.on("data", (input: any) => {
    const numbers = input.toString().split(",")
    const list = numbers.map((n: string) => result[+n])
    deleteKeys(list)
    process.stdin.destroy()
  })
}

program
  .command("delete")
  .argument(
    "<key>",
    `Key/path of the entry to delete or word to search if option --selective is used
${example}:
  ${execute} delete #Chello# #Y--selective#
  ${execute} delete #Ccontact.header#
  The first command searches and lets you select which keys to delete. The second deletes a specific nested path.
\nNote:
  If #Y--selective# is not used, the command will delete the key/path only if it matches exactly.`,
  )
  .description("Delete a key/path from all common.json files.")
  .option("-s, --selective", "Choose from all occurrences", () => true, false)
  .action((key: string, options: any) => {
    deleteKey(key, options.selective)
  })

/******************************
UNUSED

*******************************/

const unused = async (workingDir: string | null) => {
  const config = readConfig()
  logExt("Checking common.json...", null)
  const commonJsonObj = config.getCommonFileAsObject(null);
  let keys = Object.keys(commonJsonObj)

  const currentDir = workingDir ?? process.cwd()
  const ignoredFolders = ["node_modules", "dist", "build", "coverage"]

  const walkDir = (dir: string) => {
    if (!keys.length) return
    const files = fs.readdirSync(dir)
    for (const file of files) {
      if (!keys.length) return
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      if (stat.isDirectory()) {
        if (!ignoredFolders.includes(file)) {
          walkDir(filePath)
        }
      } else if (file.endsWith(".tsx") || file.endsWith(".jsx")) {
        logExt(`Checking #C${filePath}#...`, null)
        const fileContent = fs.readFileSync(filePath, "utf8")
        const keysToRemove: string[] = []
        for (const key of keys) {
          if (
            fileContent.includes(`'${key}'`) ||
            fileContent.includes(`"${key}"`)
          ) {
            keysToRemove.push(key)
          }
        }
        if (keysToRemove.length) {
          const keysStr = keysToRemove.map(k => `#Y${k}#`).join(", ")
          logExt(`Found in #G${filePath}#: ${keysStr}`, 'success')
        }
        keys = keys.filter((key) => !keysToRemove.includes(key))
        if (!keys.length) return
      }
    }
  }

  walkDir(currentDir)

  logExt("Done!", 'success')
  logExt("#BWarning#: These listed keys might be used as a parameter. Only keys found directly in the file are listed.")
  logExt(`Found #Y${keys.length}# possible unused keys:`)
  keys.map((key, index) => {
    logExt(`${(index + 1).toFixed(0).padStart(3, " ")} - "#R${key}#"`, 'fail')
  })
}

program
  .command("unused")
  .argument("[dir]", "the directory to search in", process.cwd())
  .description("Find unused keys in common.json files.")
  .action((dir: string) => {
    unused(dir)
  })

if (process.argv.length < 3) {
  program.help()
}

program.parse(process.argv)
