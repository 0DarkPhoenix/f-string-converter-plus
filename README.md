# F-String Converter Plus

## Overview

The "F-String Converter Plus" extension for Visual Studio Code is a customizable tool designed to enhance your Python coding experience by automatically converting regular string literals into f-strings when they contain brackets. This ensures your code is more efficient and readable by leveraging Python's f-string formatting.

## Features

- **Automatic Conversion**: Detects and converts string literals with placeholders into f-strings.
- **Ignore Patterns**: Customize which files should be ignored during the conversion process.
- **Real-time Updates**: Automatically updates strings as you type or modify your code.

## Usage

### Automatic Conversion

The extension automatically converts eligible string literals into f-strings as you type. It checks for placeholders within strings and adds or removes the `f` prefix as needed.

### Configuration

You can configure the extension to ignore specific files or patterns by updating the settings:

- Open your VS Code settings.
- Search for `f-string-converter-plus.ignorePatterns`.
- Add file patterns to the list to exclude them from automatic conversion (e.g. "\*route.py", "\*/tests/config/*)

## Extension Settings

This extension contributes the following settings:

- `f-string-converter-plus.ignorePatterns`: Define file patterns to ignore when converting f-strings (Default: `[]`).

## Known Issues

- The extension may not correctly identify strings within complex expressions or multiline strings. Ensure your strings are formatted correctly for best results.

## Repository

For more information, issues, or contributions, visit the [GitHub repository](https://github.com/0DarkPhoenix/f-string-converter-plus).

## License

This extension is licensed under the MIT License.
