const vscode = require("vscode");

function activate(context) {
	let activeEditor = vscode.window.activeTextEditor;
	let timeout = undefined;
	let config = vscode.workspace.getConfiguration("f-string-converter-plus");
	let ignorePatterns = config.get("ignorePatterns", []);

	function shouldIgnoreFile(filePath) {
		return ignorePatterns.some((pattern) => {
			// Add $ to the end of the pattern if it's not already there
			const adjustedPattern = pattern.endsWith("$") ? pattern : `${pattern}$`;
			return new RegExp(adjustedPattern).test(filePath);
		});
	}

	function updateFString() {
		if (!activeEditor) {
			return;
		}

		const document = activeEditor.document;

		if (document.languageId !== "python") {
			return;
		}

		const filePath = document.fileName;

		if (shouldIgnoreFile(filePath)) {
			return;
		}

		const position = activeEditor.selection.active;
		const lineText = document.lineAt(position.line).text;

		// Check if we're inside a docstring
		const docstringRegex = /^(\s*)('{3}|"{3})/;
		if (docstringRegex.test(lineText)) {
			return;
		}

		// Optimize regex to match strings more efficiently
		const stringRegex = /([a-zA-Z])?(['"])((?:\\\2|.)*?)\2/g;
		let match;

		while ((match = stringRegex.exec(lineText)) !== null) {
			const start = match.index;
			const end = stringRegex.lastIndex;
			if (position.character > start && position.character < end) {
				const stringContent = match[0];
				const hasPlaceholders = /\{.*?\}/.test(stringContent);
				const prefix = match[1] || "";

				if (hasPlaceholders && prefix !== "f") {
					activeEditor.edit(
						(editBuilder) => {
							if (!prefix) {
								editBuilder.insert(new vscode.Position(position.line, start), "f");
							}
						},
						{ undoStopBefore: false, undoStopAfter: false },
					);
				} else if (!hasPlaceholders && prefix === "f") {
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

	function triggerUpdateFString() {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(updateFString, 5);
	}

	if (activeEditor) {
		triggerUpdateFString();
	}

	vscode.window.onDidChangeActiveTextEditor(
		(editor) => {
			activeEditor = editor;
			if (editor) {
				triggerUpdateFString();
			}
		},
		null,
		context.subscriptions,
	);

	vscode.workspace.onDidChangeTextDocument(
		(event) => {
			if (activeEditor && event.document === activeEditor.document) {
				triggerUpdateFString();
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

function deactivate() {}

module.exports = {
	activate,
	deactivate,
};
