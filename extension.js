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
