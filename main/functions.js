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

const {
	types,
	functionReturn
} = require('./types')



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


// TODO: add scope logic :D
/**
 * 
 * @param {string} cod 
 */
function findVariables(cod, type = 0) {
	let name = '',
	variable,
	result = [],
	startTemp = 0,
	secondResult = {}

	for (let i = 0; i < cod.length; i++) {
        if (!insideBraces(cod.slice(i))) continue
		let char = cod[i]
		if (variable) {
			if (alphanumerical.includes(char)) {
				name += char
			} else {
				let sli = cod.slice(i).trim()
				// uh should '=' also be here? cuz defining is := so uhonly definitions and not updating
				if (sli.startsWith(':=')) {
					// dont ask me why we have a class for variables
					if (type === 1) {
						for (let j = i; j < cod.length; j++) {
							if (cod.slice(j).startsWith('}}')||cod.slice(j).startsWith('-}}')) {
								if (!(name in secondResult)) secondResult[name] = []
								secondResult[name].push(new Variable({
									place: [
										startTemp,
										i
									],
									name,
									value: cod.slice(i, j).replace(/^\s*:=\s*/, '').trim()
								}))
								break
							}
						}
					}
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
	if (type === 0) return result
	return secondResult
}

/**
 * 
 * @param {string|undefined} s 
 * @param {(string: string) => Boolean} f 
 */
function endsWithFilter(s, f) {
	const last = s.split(/[^\$\.\w]+/g).pop() // uh idk, works well till now so..
	if (f(last)) {
		return last
	}
	return undefined
}


/**
 * 
 * @param {string} val 
 */
function findReturnType(val) {
	if (match = val.trim().match(/^\w+/g)) {
		if (va = functionReturn[val.split(/\s+/g)[0]]) {
			return va
		}
	}
}


/**
 * 
 * @param {string} functionReturnType
 * @param {string} restOfTheStuff
 * @returns {string}
 */
function findReturnTypesWithDot(functionReturnType, restOfTheStuff) {
	if (functionReturnType === '') return
	let currentType = functionReturnType ?? 'dot',
	i = 1,
	split = restOfTheStuff.split('.')
	split.shift()
	if (!currentType) return ''
	for (let mm of split) {
		if (i === split.length) {
			return currentType
		} else {
			if (val = types[currentType]) {
				if (ty = val[mm]) {
					currentType = ty
				} else {
					return ''
				}
			} else {
				return ''
			}
		}
		i++
	}
	return currentType
}


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

/**
 * @param {string} s
 */
function insideBraces(s) {
    /**
     * @type {boolean}
     */
    let inside

    for (let i = 0; i < s.length; i++) {
        if (
            (!inside && s.slice(i).startsWith('{{')) ||
            (inside && s.slice(i).startsWith('}}'))
        )
        {
            inside = !inside
            i += 2
        }
    }

    return inside
}

module.exports = {
    clearStrings,
    findVariables,
    endsWithFilter,
    findReturnType,
    findReturnTypesWithDot,
    toPropertyCompletion,
    insideBraces,
}