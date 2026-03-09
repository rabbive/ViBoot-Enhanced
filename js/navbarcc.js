const extApi = typeof chrome !== 'undefined' ? chrome : browser;

const NAV_ITEMS = [
	{ label: 'Marks View', id: 'EXM0011', route: 'examinations/StudentMarkView' },
	{ label: 'Class Attendance', id: 'ACD0042', route: 'academics/common/StudentAttendance' },
	{ label: 'Course Page', id: 'ACD0045', route: 'academics/common/StudentCoursePage' },
	{ label: 'DA Upload', id: 'EXM0017', route: 'examinations/StudentDA' },
	{ label: 'Time Table', id: 'ACD0034', route: 'academics/common/StudentTimeTable' },
	{ label: 'Academic Calendar', id: 'ACD0128', route: 'academics/common/CalendarPreview' },
];

const LINK_STYLE = 'color: #fafafa; border-style: none; text-decoration: none; margin-left: 15px; font-size: 15px';

let nav_barcc = () => {
	if (document.URL.match('vtopcc') == null) return;

	const span = document.createElement('div');
	span.className = 'navbar-brand';
	span.style.paddingTop = '20px';

	NAV_ITEMS.forEach((item) => {
		const a = document.createElement('a');
		a.href = '#';
		a.id = item.id;
		a.className = 'btnItem';
		a.style.cssText = LINK_STYLE;
		a.textContent = item.label;
		a.addEventListener('click', (e) => {
			e.preventDefault();
			if (typeof loadmydiv === 'function') {
				loadmydiv(item.route);
			}
			if (typeof toggleButtonMenuItem === 'function') {
				toggleButtonMenuItem();
			}
		});
		span.appendChild(a);
	});

	document
		.getElementsByClassName('navbar-header')[0]
		.insertAdjacentElement('beforeend', span);
};

extApi.runtime.onMessage.addListener((request) => {
	if (request.message === 'vtopcc_nav_bar') {
		try {
			nav_barcc();
		} catch (error) {}
	}
});
