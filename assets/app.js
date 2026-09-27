const themeFiles = [
	'alltag', 'ethik', 'goetter', 'liebe', 'musik',
	'natur', 'politik', 'rhetorik', 'tod', 'wissen'
];

const state = {
	themes: [],
	texts: [],
	index: 0,
	language: 'de'
};

const themesGrid = document.querySelector('#themesGrid');
const reader = document.querySelector('#reader');
const readerText = document.querySelector('#rText');

function createStars() {
	const field = document.querySelector('#skyField');
	if (!field) return;

	for (let index = 0; index < 90; index += 1) {
		const star = document.createElement('span');
		star.className = 'star';
		star.style.left = `${Math.random() * 100}%`;
		star.style.top = `${Math.random() * 100}%`;
		star.style.width = `${Math.random() * 2 + 1}px`;
		star.style.height = star.style.width;
		star.style.animationDelay = `${Math.random() * 8}s`;
		field.append(star);
	}
}

function renderThemes() {
	themesGrid.innerHTML = '';

	state.themes.forEach((theme, themeIndex) => {
		const card = document.createElement('button');
		card.className = 'theme';
		card.type = 'button';
		card.innerHTML = `<div class="theme-name">${theme.titel}</div><div class="theme-count">${theme.texte.length} Texte</div>`;
		card.addEventListener('pointermove', (event) => {
			const bounds = card.getBoundingClientRect();
			card.style.setProperty('--mx', `${event.clientX - bounds.left}px`);
			card.style.setProperty('--my', `${event.clientY - bounds.top}px`);
		});
		card.addEventListener('click', () => selectTheme(themeIndex, card));
		themesGrid.append(card);
	});
}

function selectTheme(themeIndex, card) {
	document.querySelectorAll('.theme.active').forEach((item) => item.classList.remove('active'));
	card.classList.add('active');
	state.texts = state.themes[themeIndex].texte;
	state.index = 0;
	renderText();
	reader.classList.add('visible');
	reader.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderText() {
	const text = state.texts[state.index];
	if (!text) return;

	document.querySelector('#rAuthor').textContent = text.autor;
	document.querySelector('#rWork').textContent = text.werk;
	readerText.className = `reader-text ${state.language === 'de' ? 'german-text' : 'greek-text'}`;
	readerText.textContent = state.language === 'de' ? text.deutsch : text.griechisch;
	document.querySelector('#rSourceLink').textContent = text.quelle.primaer;
	document.querySelector('#rSourceLink').href = text.quelle.url;
	document.querySelector('#rPosition').textContent = `${text.kolumne} · Zeilen ${text.zeilen}`;
	document.querySelector('#rCount').textContent = `${state.index + 1} / ${state.texts.length}`;
	document.querySelector('#rPrev').disabled = state.index === 0;
	document.querySelector('#rNext').disabled = state.index === state.texts.length - 1;
}

async function loadCollection() {
	const responses = await Promise.all(
		themeFiles.map(async (name) => {
			const path = `data/${name}.json?v=3`;
			let response;
			try {
				response = await fetch(path, { cache: 'no-store' });
			} catch {
				throw new Error(`${path} ist nicht erreichbar`);
			}
			if (!response.ok) throw new Error(`${path} antwortet mit HTTP ${response.status}`);
			try {
				return await response.json();
			} catch {
				throw new Error(`${path} enthält kein gültiges JSON`);
			}
		})
	);

	state.themes = responses;
	state.texts = responses.flatMap((theme) => theme.texte);
	renderThemes();
}

document.querySelectorAll('.reader-tab').forEach((tab) => {
	tab.addEventListener('click', () => {
		state.language = tab.dataset.lang;
		document.querySelectorAll('.reader-tab').forEach((item) => {
			const active = item === tab;
			item.classList.toggle('active', active);
			item.setAttribute('aria-selected', String(active));
		});
		renderText();
	});
});

document.querySelector('#rPrev')?.addEventListener('click', () => {
	if (state.index > 0) {
		state.index -= 1;
		renderText();
	}
});

document.querySelector('#rNext')?.addEventListener('click', () => {
	if (state.index < state.texts.length - 1) {
		state.index += 1;
		renderText();
	}
});

document.querySelector('#copyText')?.addEventListener('click', async (event) => {
	const button = event.currentTarget;
	try {
		await navigator.clipboard.writeText(readerText.textContent);
		button.title = 'Text kopiert';
		button.setAttribute('aria-label', 'Text kopiert');
		button.classList.add('copied');
		window.setTimeout(() => {
			button.title = 'Text kopieren';
			button.setAttribute('aria-label', 'Text kopieren');
			button.classList.remove('copied');
		}, 1400);
	} catch {
		button.title = 'Kopieren nicht möglich';
		button.setAttribute('aria-label', 'Kopieren nicht möglich');
	}
});

createStars();

loadCollection().catch((error) => {
	themesGrid.innerHTML = '';
	const message = document.createElement('div');
	message.className = 'loading';
	message.textContent = `Die Sammlung konnte nicht geladen werden: ${error.message}`;
	const retry = document.createElement('button');
	retry.className = 'retry-button';
	retry.type = 'button';
	retry.textContent = 'Erneut versuchen';
	retry.addEventListener('click', () => {
		message.textContent = 'Die Sammlung wird geladen…';
		retry.remove();
		loadCollection().catch((retryError) => {
			message.textContent = `Die Sammlung konnte nicht geladen werden: ${retryError.message}`;
			themesGrid.append(retry);
		});
	});
	themesGrid.append(message, retry);
	console.error(error);
});
