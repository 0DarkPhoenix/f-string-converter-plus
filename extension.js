const vscode = require("vscode");

function activate(context) {
	let timeout = undefined;

	// Store settings at module level
	const settings = {
		ignorePatterns: [],
		supportSameTypeOfQuotes: false,
	};

	// Function to update settings
	const updateSettings = () => {
		settings.ignorePatterns = vscode.workspace
			.getConfiguration("f-string-converter-plus")
			.get("ignorePatterns");
		settings.supportSameTypeOfQuotes = vscode.workspace
			.getConfiguration("f-string-converter-plus")
			.get("supportSameTypeOfQuotes");
	};

	// Initial settings load
	updateSettings();

	// Listen for any change to all settings for this extension
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("f-string-converter-plus")) {
				updateSettings();
			}
		}),
	);

	function shouldIgnoreFile(filePath) {
		const normalizedPath = filePath.replace(/\\/g, "/");

		return settings.ignorePatterns.some((pattern) => {
			// Convert glob-style pattern to RegExp
			const regexPattern = pattern
				.replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape special RegExp chars except *
				.replace(/\*/g, ".*"); // Convert * to .* for wildcards

			return new RegExp(`^${regexPattern}$`).test(normalizedPath);
		});
	}

	const twoPointerApproach = (position, lineText, activeEditor) => {
		let left = 0;
		let right = lineText.length - 1;

		while (left < right) {
			// Skip any whitespace or other characters
			while (left < right && lineText[left] !== '"' && lineText[left] !== "'") {
				left++;
			}
			while (right > left && lineText[right] !== '"' && lineText[right] !== "'") {
				right--;
			}

			if (
				lineText[left] === lineText[right] &&
				(lineText[left] === '"' || lineText[left] === "'")
			) {
				const hasPrefix = left > 0 && lineText[left - 1] === "f";
				let braceCount = 0;
				let hasValidBraces = false;

				for (let i = left + 1; i < right; i++) {
					const char = lineText[i];
					const nextChar = lineText[i + 1];

					// Handle escaped braces first
					if (char === "{" && nextChar === "{") {
						i++;
						continue;
					}
					if (char === "}" && nextChar === "}") {
						i++;
						continue;
					}

					// Handle regular braces
					if (char === "{") {
						if (braceCount === 0) {
							hasValidBraces = false;
						}
						braceCount++;
					} else if (char === "}") {
						braceCount--;
						if (braceCount === 0) {
							hasValidBraces = true;
						}
					}
				}

				if (hasValidBraces && !hasPrefix) {
					activeEditor.edit(
						(editBuilder) => {
							editBuilder.insert(new vscode.Position(position.line, left), "f");
						},
						{
							undoStopBefore: false,
							undoStopAfter: false,
						},
					);
				} else if (!hasValidBraces && hasPrefix) {
					activeEditor.edit(
						(editBuilder) => {
							editBuilder.delete(
								new vscode.Range(
									new vscode.Position(position.line, left - 1),
									new vscode.Position(position.line, left),
								),
							);
						},
						{
							undoStopBefore: false,
							undoStopAfter: false,
						},
					);
				}
				return;
			}

			if (position.character - left > right - position.character) {
				left++;
			} else {
				right--;
			}
		}
	};

	const stackApproach = (position, lineText, activeEditor) => {
		const stringRegex = /([a-zA-Z])?(['"])((?:\\\2|.)*?)\2/g;
		let match;

		while ((match = stringRegex.exec(lineText)) !== null) {
			const start = match.index;
			const end = stringRegex.lastIndex;

			if (position.character >= start && position.character <= end) {
				const stringPrefix = match[1] || "";
				const stringContent = match[3];

				// Simplified placeholder detection
				let hasPlaceholder = false;
				let bracketDepth = 0;

				for (let i = 0; i < stringContent.length; i++) {
					const char = stringContent[i];

					if (char === "{") {
						// Check if it's not an escaped bracket
						if (i === 0 || stringContent[i - 1] !== "{") {
							bracketDepth++;
						}
					} else if (char === "}") {
						// Check if it's not an escaped bracket
						if (i === 0 || stringContent[i - 1] !== "}") {
							bracketDepth--;
							if (bracketDepth === 0) {
								hasPlaceholder = true;
							}
						}
					}
				}

				if (hasPlaceholder && stringPrefix !== "f") {
					activeEditor.edit(
						(editBuilder) => {
							if (!stringPrefix) {
								editBuilder.insert(new vscode.Position(position.line, start), "f");
							}
						},
						{ undoStopBefore: false, undoStopAfter: false },
					);
				} else if (!hasPlaceholder && stringPrefix === "f") {
					activeEditor.edit(
						(editBuilder) => {
							editBuilder.delete(
								new vscode.Range(
									new vscode.Position(position.line, start),
									new vscode.Position(position.line, start + 1),
								),
							);
						},
						{ undoStopBefore: false, undoStopAfter: false },
					);
				}
				break;
			}
		}
	};

	function updateFstring() {
		const activeEditor = vscode.window.activeTextEditor;

		if (!activeEditor) {
			return;
		}

		const document = activeEditor.document;

		// Return early when the document is not a Python file
		if (document.languageId !== "python") {
			return;
		}

		// Return early when the file path matches one of the ignore patterns
		const filePath = document.fileName;
		if (shouldIgnoreFile(filePath)) {
			return;
		}

		const position = activeEditor.selection.active;
		const lineText = document.lineAt(position.line).text;

		if (settings.supportSameTypeOfQuotes) {
			twoPointerApproach(position, lineText, activeEditor);
		} else {
			stackApproach(position, lineText, activeEditor);
		}
	}

	function triggerUpdateFstring() {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(updateFstring, 10);
	}

	vscode.window.onDidChangeActiveTextEditor(() => {
		triggerUpdateFstring();
	});

	vscode.workspace.onDidChangeTextDocument((event) => {
		if (
			vscode.window.activeTextEditor &&
			event.document === vscode.window.activeTextEditor.document
		) {
			triggerUpdateFstring();
		}
	});
}
module.exports = {
	activate,
};
