const vscode = require("vscode");

function activate(context) {
	const disposable = vscode.commands.registerCommand("extension.convertFStrings", () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const selection = editor.selection;
			const text = document.getText(selection);

			const convertedText = convertStrings(text);

			editor.edit((editBuilder) => {
				editBuilder.replace(selection, convertedText);
			});
		}
	});

	function convertStrings(text) {
		return text.replace(
			/(?<![\w'])(?:'''|"""|'|")([^'"]*?\{.*?\}[^'"]*?)(?:'''|"""|'|")/g,
			(match, p1) => {
				if (match.startsWith("f")) {
					// Convert f-string back to regular string
					return match.slice(1);
				}
				// Convert regular string to f-string
				return `f${match}`;
			},
		);
	}

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate,
};
