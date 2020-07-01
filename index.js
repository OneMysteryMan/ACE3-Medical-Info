/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
ACE3 Medical Info © 2020 by OneMysteryMan

ACE3 Medical Info by OneMysteryMan is licensed under
Creative Commons Attribution-ShareALike 4.0 International.

You should have received a copy of the licensed along with this
work. If not, see <https://creativecommons.org/licenses/by-sa/4.0>.
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
"use strict";
import Errors from './errors.js'
import FileParser from './parser.js'
import Renderer from './render.js'

const ACE3_URL = 'https://raw.githubusercontent.com/acemod/ACE3/master/addons/medical_treatment/ACE_Medical_Treatment.hpp';
const COMMENT_REGEX = /(?=".*?")|\/\*(?:.|\n)*?\*\/|\/\/.*?\n/gm;
const SHOW_PARSED_JSON = false; // Make sure blob: popups are not blocked

const Download = () => {
	return fetch(ACE3_URL).then((response) => {
		if (!response.ok) {
			console.log(response);
			throw new Error(Errors.DOWNLOAD);
		} else {
			return response.text();
		}
	}).catch(() => {
		throw new Error(Errors.DOWNLOAD);
	});
}

const FilterAndParse = (text) => {
	return new Promise((resolve, reject) => {
		// Remove comments
		text = text.replace(COMMENT_REGEX, '').trim();
		const result = FileParser(text);
		console.log(result);
		/**************************************************************************************************/
		if (SHOW_PARSED_JSON) { // Make sure popups are not blocked
			const blob = new Blob([JSON.stringify(result)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			window.open(url);
			setTimeout(() => window.URL.revokeObjectURL(url), 5000);
		}
		/**************************************************************************************************/
		if (result.constructor.name === 'HppClass') resolve(result);
		else reject(new Error(Errors.PARSE));
	});
}

const Render = (object) => {
	return new Promise((resolve, reject) => {
		if (Renderer(object)) {
			resolve();
		} else
			reject();
	});
}

const Finish = () => {
	document.body.classList.remove('loading');
}

Download().then(FilterAndParse).then(Render).then(Finish).catch((error) => {
	console.log(error);
	let errorText;
	switch (error.message) {
		case Errors.DOWNLOAD:
			errorText = 'Error while loading ACE3 Medical Treatment file!';
			break;
		case Errors.PARSE:
			errorText = 'Error while parsing ACE3 Medical Treatment file!';
			break;
		case Errors.PARSE_VARIABLE:
			errorText = 'Error while parsing variable in ACE3 Medical Treatment file!';
			break;
		case Errors.PARSE_CLASS:
			errorText = 'Error while parsing class in ACE3 Medical Treatment file!';
			break;
		case Errors.RENDER:
			errorText = 'Error while rendering!';
			break;
		default:
			errorText = 'Unknown error occurred!';
			break;
	}
	document.getElementById('loading-message').innerHTML = errorText;
});