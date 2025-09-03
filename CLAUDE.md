# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm run build` - Compile TypeScript to JavaScript using tsc
- `pnpm run dev` - Run the CLI tool directly with tsx for development

## Project Architecture

This is a Node.js CLI tool for managing i18n (internationalization) and intl (nested internationalization) files, specifically common.json files across multiple locales.

### Core Structure
- **Single file architecture**: All functionality is in `src/index.ts` (~700 lines)
- **CLI framework**: Uses commander.js for command-line interface
- **Config-driven**: Requires `i18nHelper.config.json` setup file in working directory
- **Dual format support**: Supports both flat i18n and nested intl JSON structures
- **Multi-locale support**: Manages common.json files across different language folders

### Key Classes and Interfaces
- `Config` interface: Defines configuration structure (targetFolder, isIntl, keyCase, sortItemByName)
- `ExtConfig` class: Extends Config with DeepL API integration and folder operations
- **Breaking Change**: Removed additionalFolders support for simplified architecture

### Main Commands Implementation
- `setup` - Creates configuration file with new structure
- `find` - Searches through locale files with both flat and nested support
- `add` - Adds new key-value pairs with key case validation, auto-fix, and nested path support
- `delete` - Removes keys with nested path support and selective matching
- `unused` - Finds potentially unused translation keys by scanning source files

### New Features in v0.2.x
- **intl Format Support**: Nested JSON structure (`contact.header`, `navigation.home`)
- **Key Case Validation**: Enforces camelCase, snake_case, or kebab-case consistency
- **Auto-fix**: Automatically corrects key case issues with `--auto-fix` flag
- **Skip Validation**: Bypass validation with `--skip-validation` flag
- **Enhanced Search**: Nested path search capabilities for intl format

### Dependencies
- `commander` - CLI argument parsing and command structure
- `deepl-node` - Translation service integration
- `dotenv-flow` - Environment variable management for API keys
- Standard Node.js fs/path modules for file operations

### JSON Structure Support

#### i18n Format (isIntl: false)
Flat key-value structure:
```json
{
  "hello": "Hello",
  "welcomeMessage": "Welcome to our app"
}
```

#### intl Format (isIntl: true)
Nested namespace structure:
```json
{
  "contact": {
    "header": "Contact Us",
    "form": {
      "name": "Name",
      "email": "Email"
    }
  }
}
```

### File Structure Expectations
```
targetFolder/
├── en/common.json
├── tr/common.json
└── de/common.json
```

### Configuration Structure
```json
{
  "targetFolder": "../locales",
  "isIntl": false,
  "keyCase": "camelCase",
  "sortItemByName": true
}
```

### Utility Functions Added
- `setNestedValue()` - Sets values in nested objects using dot notation
- `getNestedValue()` - Gets values from nested objects using dot notation
- `deleteNestedValue()` - Deletes values from nested objects with cleanup
- `findInNested()` - Searches through nested structures
- `validateKeyCase()` - Validates key naming conventions
- `fixKeyCase()` - Auto-corrects key case format

### Development Notes
- ES modules (type: "module" in package.json)
- TypeScript with strict mode enabled and @types/node
- Single executable binary with multiple command aliases (i18nHelp, i18nhelp, i18n-help)
- Color-coded console output with custom colored() function
- Async operations for file processing and translation
- Uses pnpm for package management