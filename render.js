"use strict";
import Errors from './errors.js'

const TemplateButton = document.getElementById('Template-Header');
const TemplatePage = document.getElementById('Template-Page');
const TemplateItem = document.getElementById('Template-Item');
const TemplateBandageTable = document.getElementById('Template-BandageTable');
const Header = document.getElementById('header');
const Main = document.getElementById('main');

const Renderer = (object) => {
	if (object.Classes.length === 0) return false;
	RenderPage(object, true);

	for (let i = 0; i < object.Classes.length; i++) {
		RenderPage(object.Classes[i], false);
	}

	return true;
}

export default Renderer;

function HideAll() {
	document.querySelectorAll('main > .Page').forEach((page) => {
		page.classList.remove('show');
	});
}

function PadLeft(text, minWidth) {
	text = text.toString();
	if (text.length >= minWidth) return text;
	text = `${' '.repeat(minWidth)}${text}`
	return text.substr(-minWidth);
}

function RenderPage(page, isBandageTable) {
	const pageElement = document.importNode(TemplatePage.content.querySelector('div'), true);
	if (isBandageTable) {
		pageElement.classList.add('show'); // Default
		const table = RenderBandageTable(page);
		pageElement.appendChild(table);
		Main.appendChild(pageElement);
		RenderHeaders('Bandage Table', pageElement);
	} else {
		const items = RenderItem(page, false);
		pageElement.appendChild(items);
		Main.appendChild(pageElement);
		RenderHeaders(page.Name, pageElement);
	}
}

function RenderHeaders(name, page) {
	const button = document.importNode(TemplateButton.content.querySelector('div'), true);
	button.innerHTML = name;
	button.addEventListener('click', () => {
		HideAll();
		page.classList.add('show');
	});
	Header.appendChild(button);
}

function RenderItem(item, renderVariables = true) {
	const itemElement = document.importNode(TemplateItem.content.querySelector('section'), true);
	const itemTitle = itemElement.querySelector('.Item-Title');
	const varsTable = itemElement.querySelector('tbody');
	const subItems = itemElement.querySelector('.SubItems');

	itemTitle.innerHTML = item.Name;

	if (renderVariables) {
		for (let i = 0; i < item.Variables.length; i++) {
			const variable = item.Variables[i];
			const row = document.createElement('tr');
			const name = document.createElement('td');
			const value = document.createElement('td');

			name.innerHTML = variable.Name;
			if (Array.isArray(variable.Value)) {
				value.innerHTML = `{ ${variable.Value.join(', ')} }`;
			} else {
				value.innerHTML = variable.Value;
			}

			row.appendChild(name);
			row.appendChild(value);
			varsTable.appendChild(row);
		}
	}

	if (item.Variables.length === 0 || !renderVariables) {
		itemElement.querySelector('table').classList.add('no-variables');
	}

	for (let i = 0; i < item.Classes.length; i++) {
		const subitem = RenderItem(item.Classes[i]);
		subItems.appendChild(subitem);
	}

	return itemElement;
}

function RenderBandageTable(object) {
	const div = document.importNode(TemplateBandageTable.content.querySelector('div'), true);
	const tableElement = div.querySelector('table');
	const tableHead = tableElement.querySelector('thead');
	const tableBody = tableElement.querySelector('tbody');

	let bandages = [];
	let wounds = [];
	// Find bandaging class
	for (let i = 0; i < object.Classes.length; i++) {
		const bandaging = object.Classes[i];
		if (bandaging.Name === 'Bandaging') {
			// For each bandage type
			for (let j = 0; j < bandaging.Classes.length; j++) {
				// Skip basic bandage
				const bandage = bandaging.Classes[j];
				if (bandage.Name === 'BasicBandage') continue;
				const woundInfo = {};
				// Get all wound values
				for (let k = 0; k < bandage.Classes.length; k++) {
					const wound = bandage.Classes[k];
					if (bandages.length === 0) wounds.push(wound.Name);
					woundInfo[wound.Name] = {
						effect: -1,
						chance: -1,
						time: -1,
					};
					for (let v = 0; v < wound.Variables.length; v++) {
						const variable = wound.Variables[v];
						if (variable.Name === 'effectiveness') woundInfo[wound.Name].effect = variable.Value;
						if (variable.Name === 'reopeningChance') woundInfo[wound.Name].chance = variable.Value * 100;
						if (variable.Name === 'reopeningMinDelay') woundInfo[wound.Name].time = variable.Value;
					}
				}
				bandages.push([bandage.Name, woundInfo]);
			}
			break;
		}
	}

	// Add wounds to rows
	let rows = [['']];
	for (let i = 0; i < wounds.length; i++) {
		rows.push([wounds[i]]);
	}

	// Add bandage name to first row and info below
	for (let i = 0; i < bandages.length; i++) {
		const name = bandages[i][0];
		const woundInfo = bandages[i][1];
		rows[0].push(name);

		for (let j = 1; j < rows.length; j++) {
			const wound = rows[j][0];
			if (woundInfo.hasOwnProperty(wound)) {
				const effect = woundInfo[wound].effect.toFixed(2);
				const chance = woundInfo[wound].chance + '%';
				const time = woundInfo[wound].time;

				rows[j].push(effect, chance, time);
			} else rows[j].push('-');
		}
	}

	//check row last last

	// Render table
	const headerRow = document.createElement('tr');
	for (let i = 0; i < rows[0].length; i++) {
		const element = document.createElement('th');
		if (i > 0) element.colSpan = 3;
		element.innerHTML = rows[0][i];
		headerRow.appendChild(element);
	}
	tableHead.appendChild(headerRow);

	for (let i = 1; i < rows.length; i++) {
		const rowElements = rows[i];
		const row = document.createElement('tr');

		for (let j = 0; j < rowElements.length; j++) {
			const element = document.createElement(j === 0 ? 'th' : 'td');
			element.innerHTML = rowElements[j];
			row.appendChild(element);
		}

		tableBody.appendChild(row);
	}

	return div;
}