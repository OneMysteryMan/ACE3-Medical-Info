"use strict";
import Errors from './errors.js'

const ARRAY_REGEX = /\{|\}/g;
const QUOTE_REGEX = /^"|"$/g;
const SEPARATOR_REGEX = /\s|=/;

const INHERIT_SPECIAL_CASES = [
	['iv', ['BloodIV']],
	['Medication', ['Morphine', 'Epinephrine', 'Adenosine', 'PainKillers']]
];

const FileParser = (text) => {
	const name = text.substring(text.indexOf('class') + 5, text.indexOf('{')).trim();
	const addonClass = new HppClass(false, name);
	// Get class text
	text = text.substring(text.indexOf('{') + 1, text.lastIndexOf('}'));
	addonClass.Parse(text);
	return addonClass;
}
export default FileParser;

function ParseVariableValue(value) {
	if (value.startsWith('"')) {
		return value.replace(QUOTE_REGEX, '');
	} else {
		if (isNaN(value)) // Not a number
			return value;
		else // Is a number
			return parseFloat(value);
	}
}

function ParseArrayVariableValue(text) {
	text = text.replace(ARRAY_REGEX, '').split(',').map(s => s.trim());
	let values = [];
	for (let i = 0; i < text.length; i++) {
		values.push(ParseVariableValue(text[i]));
	}
	return values;
}

function CheckSpecialCase(name) {
	name = name.toLowerCase();
	for (let i = 0; i < INHERIT_SPECIAL_CASES.length; i++) {
		const inherit = INHERIT_SPECIAL_CASES[i][0];
		const cases = INHERIT_SPECIAL_CASES[i][1];

		for (let j = 0; j < cases.length; j++) {
			if (name == cases[j].toLowerCase()) return inherit;
		}
	}
	return '';
}

class HppClass {
	constructor(parent, name) {
		this.Name = name;
		this.Parent = parent;
		this.Variables = [];
		this.Classes = [];
	}

	HasVariable(variableName) {
		variableName = variableName.toLowerCase();
		for (let i = 0; i < this.Variables.length; i++) {
			const name = this.Variables[i].Name;
			if (variableName === name.toLowerCase()) return i;
		}
		return -1;
	}

	SetVariable(name, value) {
		const index = this.HasVariable(name);
		if (index === -1) this.Variables.push(new HppVariable(name, value));
		else this.Variables[index] = new HppVariable(name, value);
	}

	HasClass(className) {
		className = className.toLowerCase();
		for (let i = 0; i < this.Classes.length; i++) {
			const name = this.Classes[i].Name;
			if (className === name.toLowerCase()) return i;
		}
		return -1;
	}

	GetInheritVariables(className) {
		const index = this.HasClass(className);
		if (this.Name.toLowerCase() === className.toLowerCase()) return this.Variables.slice();
		else if (index > -1) return this.Classes[index].Variables.slice();
		else if (this.Parent !== false) return this.Parent.GetInheritVariables(className);
		else throw new Error(Errors.PARSE_CLASS);
	}

	RemoveParents() {
		for (let i = 0; i < this.Classes.length; i++) {
			this.Classes[i].RemoveParents();
		}
		delete this.Parent;
	}

	Parse(text) {
		this.ParseVariables(text);
		this.ParseClasses(text);
		this.RemoveParents();
	}

	ParseClasses(text) {
		let index = 0;
		let buffer = [];
		let word, name, inherit, classText;
		let isSeparator = false;
		let wasSeparator = true;

		while (true) {
			if (index === text.length) return;

			isSeparator = SEPARATOR_REGEX.test(text[index]);

			// Word started
			if (!isSeparator) {
				if (wasSeparator) {
					buffer.length = 0;
				}
				buffer.push(text[index]);
			}

			// Word ended
			if (isSeparator && !wasSeparator) {
				word = buffer.join('').trim();

				// Word is not a real word
				if (/\W/.test(word) || word.length === 0) {
					index++;
					wasSeparator = true;
					buffer.length = 0;
					word = '';
					continue;
				}

				if (word !== 'class') {
					// Skip variables
					buffer.length = 0;

					while (true) {
						if (text.length === index && buffer.length > 0) throw new Error(Errors.PARSE_VARIABLE);

						// Found end of class
						if (text[index] === ';') break;
						index++;
					}
					index++;
					continue;
				}

				// Word is class

				// Get class name
				buffer.length = 0;
				while (true) {
					// End of class name
					if (text[index] === ':' || text[index] === ';' || (SEPARATOR_REGEX.test(text[index]) && buffer.length > 0)) {
						if (buffer.length === 0) throw new Error(Errors.PARSE_CLASS);
						name = buffer.join('').trim();
						index++;
						break;
					}

					buffer.push(text[index]);
					index++;
				}

				// Get inherit
				buffer.length = 0;
				inherit = '';
				while (true) {
					// End of inherit class name
					if (text[index] === '{' || (SEPARATOR_REGEX.test(text[index]) && buffer.length > 0)) {
						inherit = buffer.join('').trim();
						break;
					}

					// Early end of class
					if (text[index] === ';') throw new Error(Errors.PARSE_CLASS);

					buffer.push(text[index]);
					index++;
				}

				// Get class text
				buffer.length = 0;
				classText = [];
				while (true) {
					if (text.length === index && buffer.length > 0) throw new Error(Errors.PARSE_CLASS);

					// Found end of class
					if ((buffer.length === 0 && text[index] === ';')) {
						classText = classText.join('');
						break;
					}

					if (text[index] === '{') buffer.push('');

					if (text[index] === '}') {
						if (buffer.length === 0) throw new Error(Errors.PARSE_CLASS);
						buffer.pop();
					}

					classText.push(text[index]);
					index++;
				}

				// Create the new class
				const newClass = new HppClass(this, name);
				if (inherit === '') inherit = CheckSpecialCase(name);
				if (inherit !== '') newClass.Variables = this.GetInheritVariables(inherit);
				newClass.Parse(classText);
				this.Classes.push(newClass);

				buffer.length = 0;
				word = name = inherit = classText = '';
			}

			index++;
			wasSeparator = isSeparator;
		}
	}

	ParseVariables(text) {
		let index = 0;
		let buffer = [];
		let word, name, value;
		let isSeparator = false;
		let wasSeparator = true;

		while (true) {
			if (index === text.length) return;

			isSeparator = SEPARATOR_REGEX.test(text[index]);

			// Word started
			if (!isSeparator) {
				if (wasSeparator) {
					buffer.length = 0;
				}
				buffer.push(text[index]);
			}

			// Word ended
			if (isSeparator && !wasSeparator) {
				word = buffer.join('').trim();

				// Word is not a real word
				if (/\W/.test(word) || word.length === 0) {
					index++;
					wasSeparator = true;
					buffer.length = 0;
					word = '';
					continue;
				}

				if (word === 'class') {
					// Skip classes
					buffer.length = 0;

					while (true) {
						if (text.length === index && buffer.length > 0) throw new Error(Errors.PARSE_CLASS);

						// Found end of class
						if ((buffer.length === 0 && text[index] === ';')) break;

						if (text[index] === '{') buffer.push('');

						if (text[index] === '}') {
							if (buffer.length === 0) throw new Error(Errors.PARSE_CLASS);
							buffer.pop();
						}

						index++;
					}
					index++;
					continue;
				}

				// Word is a variable name
				name = word;

				// Test for empty variable
				if (text[index] === ';') throw new Error(Errors.PARSE_VARIABLE);

				// Find start of value
				let x = index;
				while (text[index] !== '=') {
					if (index === text.length) throw new Error(Errors.PARSE_VARIABLE);
					index++;
				}
				index++;

				// Get variable value
				buffer.length = 0;
				while (text[index] !== ';') {
					if (index === text.length) throw new Error(Errors.PARSE_VARIABLE);
					buffer.push(text[index]);
					index++;
				}
				value = buffer.join('').trim();

				if (name.endsWith('[]')) {
					// Variable is array
					name = name.substring(0, name.length - 2); // Remove [] from name
					this.SetVariable(name, ParseArrayVariableValue(value));
				} else {
					this.SetVariable(name, ParseVariableValue(value));
				}

				buffer.length = 0;
				word = name = value = '';
			}

			index++;
			wasSeparator = isSeparator;
		}
	}
}

class HppVariable {
	constructor(name, value) {
		this.Name = name;
		this.Value = value;
	}
}