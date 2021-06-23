const vscode = require('vscode');

const {
	Variable
} = require('./classes')
const {
	characters: {
		alphanumerical,
		whitespaces
	},
	functions,
	keywords,
	dot
} = require('./thingk')

const types = require('./types')


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// let disposable = vscode.commands.registerCommand('hm.helloWorld', function () {
	// 	vscode.window.showInformationMessage('Hello World from hm!');
	// });

	// context.subscriptions.push(disposable);

	const wordCompletionProvider = vscode.languages.registerCompletionItemProvider('smt', {
		provideCompletionItems(document, position) {
			let variableCompletion = [],
			keywordCompletion = [],
			functionCompletion = [],
			textBeforePosition = document.getText(
				new vscode.Range(0, 0, position.line, position.character)
			)

			// variable completion
			if (endsWithFilter(textBeforePosition, (text) => {
				return /^\$[\w ]+$/g.test(text)
			})) {
				const cleared = clearStrings(
					textBeforePosition
				)
				const variables = findVariables(
					cleared
				)
				console.log(variables, {text: textBeforePosition, cleared})
				variableCompletion = variables.map(va => {
					let v = new vscode.CompletionItem()
					v.label = va.name
					v.insertText = va.name
					v.kind = vscode.CompletionItemKind.Variable
					return v
				})
			}


			// TODO: add a negative lookahead so it doesnt trigger on $name, etc.
			if (endsWithFilter(textBeforePosition, (text) => {
				return /^[a-zA-Z]+$/g.test(text)
			})) {
				// function completion
				functionCompletion = functions.map((fn) => {
					let fun = new vscode.CompletionItem()
					fun.label = fn
					fun.insertText = fn
					fun.kind = vscode.CompletionItemKind.Function
					return fun
				})

				// keywords completion, ex - if, else, end, etc.
				keywordCompletion = keywords.map((kw) => {
					let kwo = new vscode.CompletionItem()
					kwo.label = kw
					kwo.kind = vscode.CompletionItemKind.Keyword
					return kwo
				})
			}

			return [
				...variableCompletion,
				...keywordCompletion,
				...functionCompletion
			]
		}
	})

	const dotCompletionProvider = vscode.languages.registerCompletionItemProvider('smt', {
		provideCompletionItems(document, position) {
			const textBeforePosition = document.getText(
				new vscode.Range(0, 0, position.line, position.character)
			)

			if (endsWithFilter(textBeforePosition, (text) => {
				return /\B\$?(\.\w+)+\b$/g.test(text)
			})) {
				/**
				 * 
				 * @param {string[]} ar 
				 * @param {{}} reference
				 */
				function toPropertyCompletion(ar, reference) {
					return ar.map(v => {
						let va = new vscode.CompletionItem()
						va.insertText = v
						va.label = v
						if (reference[v] === 'func') va.kind = vscode.CompletionItemKind.Method
						else va.kind = vscode.CompletionItemKind.Field
						return va
					})
				}
				const [match] = textBeforePosition.match(/\B\$?(\.\w+)+\b$/g)
				const split = match.split('.')
				split.shift()

				console.log(JSON.stringify(split))
				if (split.length === 1) {
					console.log(toPropertyCompletion(Object.keys(dot), dot))
					return toPropertyCompletion(Object.keys(dot), dot)
				}

				let currentType = [],
				i = 1
				for (let mm of split) {
					if (i === 1) {
						if (val = dot[mm]) {
							if (ty = types[val]) {
								currentType = ty
							} else return []
						} else {
							return []
						}
					} else if (i === split.length) {
						return toPropertyCompletion(Object.keys(currentType), currentType)
					} else {
						if (val = currentType[mm]) {
							if (ty = types[val]) {
								currentType = ty
							} else return []
						} else return []
					}
					i++
				}
				
			}

		}
	})

	context.subscriptions.push(wordCompletionProvider)
	context.subscriptions.push(dotCompletionProvider)

	vscode.workspace.onDidChangeTextDocument((change) => {
		var editor = vscode.window.activeTextEditor;
		if (!editor) {
			// console.log("no editor")
			return
		}

		const text = editor.document.getText();
		const cod = clearStrings(text)
		// const variables = findVariables(cod)
	})
}

// dont want strings interfering :(
/**
 * 
 * @param {string} s 
 * @returns {string}
 */
function clearStrings(s) {
	let inString = '', escape = '', result = ''
	for (let char of s.split('')) {
		if ((inString === '') && (!'"`'.includes(char))) result += char
		if ((escape === '\\') && (char === '\\')) escape = 'hello'
		if ((escape !== '\\') && ('"`'.includes(char))) {
			if (inString !== '') {
				if (char === inString) {
					inString = ''
				}
			} else {
				inString = char
			}
		}
		if (escape !== 'hello') escape = char
	}
	return result
}


/**
 * 
 * @param {string} cod 
 */
function findVariables(cod) {
	let name = '',
	variable,
	result = [],
	startTemp = 0

	for (let i = 0; i < cod.length; i++) {
		let char = cod[i]
		if (variable) {
			if (alphanumerical.includes(char)) {
				name += char
			} else {
				let sli = cod.slice(i).trim()
				if (sli.startsWith(':=')) {
					// dont ask me why we have a class for variables
					result.push(new Variable({
						place: [
							startTemp,
							i
						],
						name
					}))
					variable = false
				}
			}
		}
		if (char === '$') {
			variable = true
			startTemp = i
			name = ''
		}
	}
	return result
}

/**
 * 
 * @param {string|undefined} s 
 * @param {(string: string) => Boolean} f 
 */
function endsWithFilter(s, f) {
	const last = s.split(/[^\$\.\w]+/g).pop()
	if (f(last)) {
		return last
	}
	return undefined
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
