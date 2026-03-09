const extApi = typeof chrome !== 'undefined' ? chrome : browser;

function createNavButton(label, index) {
	const btn = document.createElement('button');
	btn.className = 'btn btn-primary border-primary shadow-none nav-short';
	btn.type = 'button';
	btn.style.background = 'rgba(13,110,253,0)';
	btn.style.borderStyle = 'none';
	btn.textContent = label;
	btn.addEventListener('click', () => {
		const items = Array.from(document.getElementsByTagName('a')).filter(
			(e) => e.dataset.url,
		);
		if (items[index]) items[index].click();
	});
	return btn;
}

const nav_bar_change = () => {
	let items_list = Array.from(document.getElementsByTagName('a')).filter(
		(e) => e.dataset.url,
	);
	let marks, attendance, time_table, calendar, course_page;
	for (let i = 0; i < items_list.length; i++) {
		const item = items_list[i].innerText.trim();
		if (item.includes('Class Attendance')) {
			attendance = i;
		} else if (item.includes('Time Table')) {
			time_table = i;
		} else if (item.includes('Calendar')) {
			calendar = i;
		} else if (item.includes('Marks')) {
			marks = i;
		} else if (item.includes('Course Page')) {
			course_page = i;
		}
	}
	let nav = document.getElementsByClassName('collapse navbar-collapse');
	let span = document.createElement('div');
	span.id = 'navbar';

	const spacer = document.createElement('span');
	spacer.className = 'navbar-text px-0 px-sm-2 mx-0 mx-sm-1 text-light';
	span.appendChild(spacer);

	span.appendChild(createNavButton('Attendance', attendance));
	span.appendChild(createNavButton('Marks', marks));
	span.appendChild(createNavButton('Calendar', calendar));
	span.appendChild(createNavButton('Course Page', course_page));

	if (time_table) {
		span.appendChild(createNavButton('Time Table', time_table));
	} else {
		span.appendChild(createNavButton('Calendar', time_table));
	}

	nav[0].insertBefore(span, nav[0].children[0]);

	let buttons = document.querySelectorAll('.nav-short');
	buttons.forEach((button) => {
		button.addEventListener('click', () => {
			buttons.forEach((but) => {
				but.disabled = true;
				setTimeout(() => {
					buttons.forEach((btn) => {
						btn.disabled = false;
					});
				}, 1500);
			});
		});
	});
};

const clear_navbar = () => {
	document.getElementById('navbar').remove();
};

let flag = false;

extApi.runtime.onMessage.addListener((request) => {
	if (request.message === 'nav_bar_change') {
		try {
			if (
				document.getElementsByClassName('btn-group dropend')[0].style
					.backgroundColor === 'red'
			) {
				document
					.getElementsByClassName('btn-group dropend')[0]
					.remove();
			}
			if (
				document.getElementsByClassName(
					'btn btn-primary border-primary shadow-none',
				).length == 0 &&
				flag
			) {
				nav_bar_change();
			}
		} catch (error) {}
	}
});
if (
	document.getElementsByClassName('btn-group dropend')[0]?.style
		.backgroundColor === 'red'
) {
	document.getElementsByClassName('btn-group dropend')[0].remove();
}
if (
	document.getElementsByClassName(
		'btn btn-primary border-primary shadow-none',
	).length == 0
) {
	window.addEventListener('load', nav_bar_change, false);
	flag = true;
}

let input = document.createElement('input');
