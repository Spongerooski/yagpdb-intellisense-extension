const vscode = require('vscode');


const {
	characters: {
		whitespaces
	},
	functions,
	keywords,
	dot
} = require('./main/thingk')

const {
	types
} = require('./main/types')

const {
    clearStrings,
    findVariables,
    endsWithFilter,
    findReturnType,
    findReturnTypesWithDot,
    toPropertyCompletion,
	insideBraces,
} = require('./main/functions')


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	vscode.window.showInformationMessage('coolio')
	const documentSelector = {
		pattern: '**/*.{smt,gotmpl,go.tmpl,**yag**}'
	}    // glob pattern, don't mind the '**/*', the .{....} part matches any file extension with
		// yag in it, matches .gotmpl, .go.tmpl and .smt, WHY DID IT TAKE ME SO LONG TO FIGURE OUT AAAAAA

	const wordCompletionProvider = vscode.languages.registerCompletionItemProvider(documentSelector, {
		provideCompletionItems(document, position) {
			let textBeforePosition = document.getText(
				new vscode.Range(0, 0, position.line, position.character)
			)
			
			if (!insideBraces(textBeforePosition)) return
			
			// TODO: add a negative lookahead so it doesnt trigger on $name, etc.
			if (endsWithFilter(textBeforePosition, (text) => {
				return /^[a-zA-Z]+$/g.test(text)
			})) {
				// function completion
				const functionCompletion = functions.map((fn) => {
					let fun = new vscode.CompletionItem()
					fun.label = fn
					fun.insertText = fn
					fun.kind = vscode.CompletionItemKind.Function
					return fun
				})
			
				// keywords completion, ex - if, else, end, etc.
				const keywordCompletion = keywords.map((kw) => {
					let kwo = new vscode.CompletionItem()
					kwo.label = kw
					kwo.kind = vscode.CompletionItemKind.Keyword
					return kwo
				})
			
				return [
					...functionCompletion,
					...keywordCompletion
				]
			}
		}
	})

	// have to make it seperate due to the trigger on $ :(
	const variableCompletionProvider = vscode.languages.registerCompletionItemProvider(documentSelector, {
		provideCompletionItems(document, position) {
			let = textBeforePosition = document.getText(
				new vscode.Range(0, 0, position.line, position.character)
			)

			if (!insideBraces(textBeforePosition)) return

			if (endsWithFilter(textBeforePosition, (text) => {
				return /^\$[\w ]*$/g.test(text)
			})) {
				const cleared = clearStrings(
					textBeforePosition
				)
				const variables = findVariables(
					cleared
				)
				let variableCompletion = variables.map(va => {
					let v = new vscode.CompletionItem()
					v.label = va.name
					v.insertText = va.name
					v.kind = vscode.CompletionItemKind.Variable
					return v
				})
				return variableCompletion
			}
		}
	}, '$')

	// have to make it seperate due to the trigger on '.' :(
	const dotCompletionProvider = vscode.languages.registerCompletionItemProvider(documentSelector, {
		provideCompletionItems(document, position) {
			const textBeforePosition = document.getText(
				new vscode.Range(0, 0, position.line, position.character)
			)

			if (!insideBraces(textBeforePosition)) return

			let someText = ''

			if (endsWithFilter(textBeforePosition, (text) => {
				return /\B\$?(\.\w*)+$/g.test(text) && ('{(' + whitespaces).includes(textBeforePosition[textBeforePosition.length - (text.length + 1)])
			})) {
				const [match] = textBeforePosition.match(/\B\$?(\.\w*)+$/g)
				const split = match.split('.')
				split.shift()

				// console.log(JSON.stringify(split))
				if (split.length === 1) {
					// console.log(toPropertyCompletion(Object.keys(dot), dot))
					return toPropertyCompletion(Object.keys(dot), dot)
				}

				let currentType = {},
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
				
			} else if (
				endsWithFilter(
					textBeforePosition,
					(text) => {
						someText = text
						return /\$\w+(\.\w*)+$/g.test(text)
					}
				)
			) {
				const vars = findVariables(textBeforePosition, 1),
				[, variableName, rest] = /\$(\w+)((?:\.\w*)+)$/g.exec(someText)
				if (!(variableName in vars)) return
				if (vars[variableName].length > 1) return // they defined twice D:
				let type = findReturnTypesWithDot(
						findReturnType(
							vars[variableName][0].value
						) ?? '', rest
					)
				if (!types[type]) return
				return toPropertyCompletion(Object.keys(types[type]), types[type])
			}
		}
	}, '.')


	context.subscriptions.push(wordCompletionProvider)
	context.subscriptions.push(dotCompletionProvider)
	context.subscriptions.push(variableCompletionProvider)
}


function deactivate() {}

module.exports = {
	activate,
	deactivate
}
