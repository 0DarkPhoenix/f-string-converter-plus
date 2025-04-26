## [0.4.2] - 2025-04-26
### Fixed
- Fixed an issue where the ignore patterns didn't work

## [0.4.1] - 2025-02-22
### Changed
- Updated Readme

## [0.4.0] - 2025-02-22
### Added
- Added a new setting where you can enable different logic for converting f-strings which supports same type of quotes inside of the brackets. This setting is off by default, because this approach is experimental and may not work correctly for all cases.

## [0.3.1] - 2025-01-19
### Fixed
- Fixed an issue where the extension would convert f-strings in a file that wasn't a Python file

## [0.3.0] - 2025-01-18
### Changed
- Changed the logic of determining when a string is an f-string to a two-pointer technique approach to allow more unique cases within the brackets without incorrectly removing the f prefix

## [0.2.0] - 2025-01-12
### Changed
- Changed the logic of determining when a string is an f-string to a stack based approach

## [0.1.0] - 2024-11-19
### Fixed
- Fixed an issue where an ignore pattern for a folder wouldn't work

## [0.0.4] - 2024-10-19
### Changed
- Replaced poor quality logo with a better one

### Fixed
- Fixed f being placed incorrectly before a string when an r (raw string) or b (bytes string) prefix was present

## [0.0.3] - 2024-10-17
### Changed
- Small saturation change to logo

### Fixed
- Fixed f-string being converted in any other programming languages than Python

## [0.0.2] - 2024-10-16
### Added
- Logo
- Readme

### Fixed
- Fixed f-string being converted inside of a docstring

## [0.0.1] - 2024-10-15
### Initial release