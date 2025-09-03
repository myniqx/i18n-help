
# i18n-help

A command-line tool to help manage multiple common.json files for internationalization (i18n) and intl purposes.

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

Sets up the required config file.

Example:
```bash
i18nHelp setup /path/to/target/folder
# This command creates 'i18nHelper.config.json' file with targetFolder value set.
```

This is the `i18nHelper.config.json` config file:
```json
{
  "targetFolder": "../path/to/common/folder",
  "isIntl": false,
  "keyCase": "camelCase",
  "sortItemByName": true
}
```

### Config Options
- `targetFolder`: Path to folder containing locale subfolders  
- `isIntl`: `false` for flat JSON (i18n), `true` for nested JSON (intl)
- `keyCase`: Key naming convention (`"camelCase"`, `"snake_case"`, `"kebab-case"`)
- `sortItemByName`: Whether to sort keys alphabetically

## JSON Structure Support

### i18n Format (isIntl: false)
Flat key-value structure:
```json
{
  "hello": "Hello",
  "goodbye": "Goodbye",
  "welcomeMessage": "Welcome to our app"
}
```

### intl Format (isIntl: true)
Nested namespace structure:
```json
{
  "contact": {
    "header": "Contact Us",
    "form": {
      "name": "Name",
      "email": "Email"
    }
  },
  "navigation": {
    "home": "Home",
    "about": "About"
  }
}
```

> #### `find`

| Option | Description |
| --- | --- |
| `<any-word>` | Word to search (case-insensitive) |
| `[search-in]` | Where to search (key, value, or both) |
| `[locale]` | Locale to search in |

Searches for a word in the common.json files. Supports both flat and nested structures.

Example:
```bash
# i18n format
i18nHelp find hello --search-in key --locale en

# intl format - searches in nested paths
i18nHelp find contact --search-in key --locale en
```

> #### `add`

| Option | Description |
| --- | --- |
| `<key>` | Key/path of the word to add (e.g., 'hello' or 'contact.header') |
| `<value>` | Value of the key to add |
| `--locale` | Locale-specific values (e.g., tr=merhaba) |
| `--overwrite` | Overwrite existing key |
| `--auto-fix` | Automatically fix key case issues |
| `--skip-validation` | Skip key case validation |

Adds a new key-value pair to all common.json files. Supports both flat and nested structures with key case validation.

Example:
```bash
# i18n format (flat)
i18nHelp add hello world --locale tr=merhaba --overwrite

# intl format (nested)
i18nHelp add contact.header "Contact Us" --locale tr="Bize Ulaşın"

# With auto-fix for case issues
i18nHelp add contact_header "Contact Header" --auto-fix
# contact_header will be converted to contactHeader (if keyCase is camelCase)
```

### Key Case Validation
The tool enforces key naming conventions based on the `keyCase` config:
- `camelCase`: contactHeader, userName, formData
- `snake_case`: contact_header, user_name, form_data  
- `kebab-case`: contact-header, user-name, form-data

### DeepL Integration
Set up automatic translation in your `.env.*` files:
```env
DEEPL_API_KEY=your_deepl_api_key_here
```

> #### `delete`

| Option | Description |
| --- | --- |
| `<key>` | Key/path of the entry to delete |
| `--selective` | Choose from all occurrences |

Deletes a key/path from all common.json files. Supports both flat and nested structures.

Example:
```bash
# i18n format (exact match)
i18nHelp delete hello

# intl format (nested path)
i18nHelp delete contact.header

# Selective deletion (search and choose)
i18nHelp delete hello --selective
# This will find all occurrences and let you select which ones to delete
```

> #### `unused`

| Option | Description|
| --- | ---|
| `[dir]` | Directory to search in|

Finds unused keys in common.json files by scanning source code files.

Example:
```bash
i18nHelp unused /path/to/directory
# These listed keys might be used as parameters. Only keys found directly in files are listed.
```

## Migration Guide

### From v0.1.x to v0.2.x

1. **Config Changes**: The config structure has changed:
   ```json
   // Old format
   {
     "targetFolder": "../locales",
     "additionalFolders": ["../dist/locales"],
     "sortItemByName": true
   }
   
   // New format
   {
     "targetFolder": "../locales", 
     "isIntl": false,
     "keyCase": "camelCase",
     "sortItemByName": true
   }
   ```

2. **Removed Features**:
   - `additionalFolders` support has been removed
   - `copy` command has been removed

3. **New Features**:
   - intl format support with nested JSON
   - Key case validation and auto-fix
   - Enhanced nested search capabilities

## License

i18n-help is licensed under the MIT License.

## Author

myniqx
