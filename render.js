"use strict";
import Errors from './errors.js'

const TemplateButton = document.getElementById('Template-Header');
const TemplatePage = document.getElementById('Template-Page');
const TemplateItem = document.getElementById('Template-Item');
const Header = document.getElementById('header');
const Main = document.getElementById('main');

const Renderer = (object) => {
	if (object.Classes.length === 0) return false;

	for (let i = 0; i < object.Classes.length; i++) {
		RenderPage(object.Classes[i]);
	}

	return true;
}

export default Renderer;

function HideAll() {
	document.querySelectorAll('main > .Page').forEach((page) => {
		page.classList.remove('show');
	});
}

function RenderPage(page) {
	const pageElement = document.importNode(TemplatePage.content.querySelector('div'), true);
	const items = RenderItem(page, false);
	pageElement.appendChild(items);
	Main.appendChild(pageElement);
	RenderHeaders(page.Name, pageElement);
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