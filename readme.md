

# i18n-help


A command-line tool to help manage multiple common.json files for internationalization (i18n) purposes.

## Installation


You can install i18n-help using npm or yarn:

### npm
```bash
npm install -g i18n-help
```

### yarn
```bash
yarn global add i18n-help
```

## Program Usage

### Commands

The following commands are available:


> #### `setup`
----------------
| Option | Description |
| --- | ---  |
| `<targetFolder>` | Target folder to setup |
| `[additionalFolders...]` | Additional folders to copy locale files to |

Sets up the required config file.

Example:
```bash
i18nHelp setup /path/to/target/folder
# This command creates 'i18nHelper.config.json' file with targetFolder value set.
```

this is the `i18nHelper.config.json` config file.
```json
{
  "targetFolder": "../path/to/common/folder",
  "additionalFolders": [
    "../other/path/to/copy/targetFolder/1",
    "../other/path/to/copy/targetFolder/2"
  ],
  "sortItemByName": true
}
```    
> #### `find`

| Option | Description |
| --- | --- |
| `<any-word>` | Word to search (case-insensitive) |
| `[search-in]` | Where to search (key, value, or both) |
| `[locale]` | Locale to search in |

Searches for a word in the common.json files.

Example:
```bash
i18nHelp find hello --search-in key --locale en
# This command will search for the word "hello" in the "key" field of the "tr" locale in the common.json files.
```

> #### `copy`

Copies locale files from `targetFolder` to `additionalFolders`. This ll come in handy if you manually modify the files.

Example:
```bash
i18nHelp copy
# This command will copies files from `targetFolder` to `additionalFolders`
```

> #### `add`

| Option | Description |
| --- | --- |
| `<key>` | Key of the word to add |
| `<value>` | Value of the key to add |
| `[locale]` | Locale to add the key-value pair to |
| `[overwrite]` | Overwrite existing key |

Adds a new key-value pair to all common.json files.

Example:
```bash
i18nHelp add hello world --locale tr=merhaba --overwrite
# This command will add the word 'hello' with value 'world' and the Turkish value 'merhaba' to the common.json files, overwriting any existing key. And if DEEPL_API_KEY has set in your `.env` file, default word 'world' will be translated to related language except locale "tr" because it's manually set.
```

in your `.env.*` files:
```.env
DEEPL_API_KEY=deepL api key
```

> #### `delete`

| Option | Description |
| --- | --- |
| `<key>` | Key of the entry to delete |
| `[selective]` | Choose from all occurrences |

Deletes a key from all common.json files.

Example:
```bash
i18nHelp delete hello --selective
# This command will find all occurrences of the word 'hello' in the common.json files, including partial matches, and ask you to select which ones to delete, separated by commas (e.g. 1,3,5). If "--selective" is not used, the command will delete the key only if it matches exactly.
```

> #### `unused`

| Option | Description|
| --- | ---|
| `[dir]` | Directory to search in|

Finds unused keys in common.json files.

Example:
```bash
i18nHelp unused /path/to/directory
# These listed keys might be used as a parameter. Only keys found directly in the file are listed.
```

## License
-------

i18n-help is licensed under the MIT License.

## Author
------

myniqx
