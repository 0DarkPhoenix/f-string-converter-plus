const vscode = require("vscode");

function activate(context) {
	let activeEditor = vscode.window.activeTextEditor;
	let timeout = undefined;
	let config = vscode.workspace.getConfiguration("f-string-converter-plus");
	let ignorePatterns = config.get("ignorePatterns", []);

	function shouldIgnoreFile(filePath) {
		const normalizedPath = filePath.replace(/\\/g, "/");

		return ignorePatterns.some((pattern) => {
			// Convert glob-style pattern to RegExp
			const regexPattern = pattern
				.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape special RegExp chars
				.replace(/\\\*/g, ".*") // Convert * back to .* for wildcards
				.replace(/\\\//g, "\\/"); // Handle path separators

			return new RegExp(regexPattern).test(normalizedPath);
		});
	}

	function updateFstring() {
		if (!activeEditor) {
			return;
		}

		const document = activeEditor.document;
		const position = activeEditor.selection.active;
		const lineText = document.lineAt(position.line).text;

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
	}

	function triggerUpdateFstring() {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(updateFstring, 5);
	}

	if (activeEditor) {
		triggerUpdateFstring();
	}

	vscode.window.onDidChangeActiveTextEditor(
		(editor) => {
			activeEditor = editor;
			if (editor) {
				triggerUpdateFstring();
			}
		},
		null,
		context.subscriptions,
	);

	vscode.workspace.onDidChangeTextDocument(
		(event) => {
			if (activeEditor && event.document === activeEditor.document) {
				triggerUpdateFstring();
			}
		},
		null,
		context.subscriptions,
	);

	vscode.workspace.onDidChangeConfiguration(
		(event) => {
			if (event.affectsConfiguration("f-string-converter-plus.ignorePatterns")) {
				config = vscode.workspace.getConfiguration("f-string-converter-plus");
				ignorePatterns = config.get("ignorePatterns", []);
			}
		},
		null,
		context.subscriptions,
	);
}
module.exports = {
	activate,
};
