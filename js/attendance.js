const extApi = typeof chrome !== 'undefined' ? chrome : browser;

function createColorLegend(cautionText) {
	const div = document.createElement('div');

	const p1 = document.createElement('p');
	p1.style.color = 'RGB(34 144 62)';
	p1.textContent = '*Attendance greater than 75%.';
	div.appendChild(p1);

	const p2 = document.createElement('p');
	p2.style.color = 'rgb(255, 171, 16)';
	p2.style.marginTop = '-10px';
	p2.textContent = cautionText;
	div.appendChild(p2);

	const p3 = document.createElement('p');
	p3.style.color = 'rgb(238, 75, 43)';
	p3.style.marginTop = '-10px';
	p3.textContent = '*Attendance less than 75%.';
	div.appendChild(p3);

	return div;
}

function createCautionNote() {
	const p = document.createElement('p');
	p.id = 'attendance';
	p.style.cssText = 'color:#32750e; background:#f7f710; font-size:1rem; display: inline-block; border-radius: 5px;';
	const b = document.createElement('b');
	b.textContent = "* Note: This calculator doesn't calculate the attendance till the exam date, it only calculates the attendance to 74.01%.";
	p.appendChild(b);
	return p;
}

function createAttendanceCell(text, bgColor) {
	const td = document.createElement('td');
	td.style.cssText = 'vertical-align: middle; border: 1px solid #b2b2b2; padding: 5px; background: ' + bgColor + ';';
	const p = document.createElement('p');
	p.style.margin = '0px';
	p.textContent = text;
	td.appendChild(p);
	return td;
}

let view_attendance_page = () => {
	if (document.location.href.includes('vtopcc')) {
		let table_line = document.querySelectorAll('.table-responsive')[0];
		const noteP = createCautionNote();
		const br1 = document.createElement('br');
		const br2 = document.createElement('br');
		const spanEl = table_line.getElementsByTagName('span')[0];
		spanEl.parentNode.insertBefore(br1, spanEl.nextSibling);
		spanEl.parentNode.insertBefore(br2, br1.nextSibling);
		spanEl.parentNode.insertBefore(noteP, br2.nextSibling);

		const color_detail = createColorLegend('*Be cautious, your attendance is in between 74.01% to 74.99%.');
		table_line.insertAdjacentElement('afterend', color_detail);

		let table_head =
			document.getElementsByTagName('thead')[0].children[0].children;
		table_head[8].innerText = 'Attendance Start Date';
		let attendance_calc = table_head[0].cloneNode(true);
		attendance_calc.innerText = '75% Attendance Alert';
		table_head[11].insertAdjacentElement('afterend', attendance_calc);
	} else {
		let table_line = document.getElementById('AttendanceDetailDataTable')
			.parentElement.parentElement;

		let divCaution = document.createElement('div');
		divCaution.appendChild(createCautionNote());
		table_line.insertAdjacentElement('beforebegin', divCaution);

		const color_detail = createColorLegend('*Be Cautious, your attendance is in between 74.01% to 74.99%.');
		table_line.insertAdjacentElement('beforeend', color_detail);

		let table_head =
			document.getElementsByTagName('thead')[0].children[0].children;
		let attendance_calc = table_head[0].cloneNode(true);
		attendance_calc.innerText = '75% Attendance Alert';
		table_head[7].insertAdjacentElement('afterend', attendance_calc);
	}

	let body = document.getElementsByTagName('tbody');
	let body_row = body[0].querySelectorAll('tr');
	body_row.forEach((row) => {
		if (row.childNodes.length > 3) {
			let attended_classes, tot_classes, course_type;
			if (
				document.location.href.includes('vtop.vit') ||
				document.location.href.includes('vtop.vitbhopal')
			) {
				attended_classes = parseFloat(row.childNodes[11].innerText);
				tot_classes = parseFloat(row.childNodes[13].innerText);
				course_type = row.childNodes[5].innerText;
			} else if (document.location.href.includes('vtopcc')) {
				attended_classes = parseFloat(row.childNodes[19].innerText);
				tot_classes = parseFloat(row.childNodes[21].innerText);
				course_type = row.childNodes[7].innerText;
			}

			if (attended_classes / tot_classes < 0.7401) {
				let req_classes = Math.ceil(
					(0.7401 * tot_classes - attended_classes) / 0.2599,
				);

				if (course_type.includes('Lab')) {
					req_classes /= 2;
					req_classes = Math.ceil(req_classes);
					row.appendChild(
						createAttendanceCell(
							req_classes + ' lab(s) should be attended.',
							'rgb(238, 75, 43,0.7)',
						),
					);
				} else {
					row.appendChild(
						createAttendanceCell(
							req_classes + ' class(es) should be attended.',
							'rgb(238, 75, 43,0.7)',
						),
					);
				}
			} else {
				let bunk_classes = Math.floor(
					(attended_classes - 0.7401 * tot_classes) / 0.7401,
				);

				let color = 'rgb(170, 255, 0,0.7)';
				if (
					0.7401 <= attended_classes / tot_classes &&
					attended_classes / tot_classes <= 0.7499
				) {
					color = 'rgb(255, 171, 16)';
				}

				if (course_type.includes('Lab')) {
					bunk_classes /= 2;
					bunk_classes = Math.floor(bunk_classes);
					if (bunk_classes === -1) {
						bunk_classes = 0;
					}
					const td = createAttendanceCell(
						'Only ' + bunk_classes + ' lab(s) can be skipped.',
						color,
					);
					td.querySelector('p').appendChild(document.createElement('br'));
					const cautionText = document.createTextNode('Be cautious.');
					td.querySelector('p').appendChild(cautionText);
					row.appendChild(td);
				} else {
					if (bunk_classes === -1) {
						bunk_classes = 0;
					}
					const td = createAttendanceCell(
						'Only ' + bunk_classes + ' class(es) can be skipped.',
						color,
					);
					td.querySelector('p').appendChild(document.createElement('br'));
					const cautionText = document.createTextNode('Be cautious.');
					td.querySelector('p').appendChild(cautionText);
					row.appendChild(td);
				}
			}
		}
	});
};
extApi.runtime.onMessage.addListener((request) => {
	if (
		request.message === 'view_attendance' &&
		!document.getElementById('attendance')
	) {
		try {
			view_attendance_page();
			setTimeout(() => {
				displayAttendanceSummary();
				if (typeof checkAllCoursesForOnDuty === 'function') {
					addCheckODButton();
				}
			}, 1000);
		} catch (error) {}
	}
});

function addCheckODButton(summaryBox) {
	const container = document.querySelector('.table-responsive');
	if (!container) return;

	const existingButton = document.getElementById('checkODButton');
	if (existingButton) {
		existingButton.remove();
	}

	const buttonContainer = document.createElement('div');
	buttonContainer.id = 'checkODButton';
	buttonContainer.style.cssText = `
        margin-bottom: 10px;
        text-align: center;
    `;

	const checkODBtn = document.createElement('button');
	checkODBtn.textContent = 'Check OD';
	checkODBtn.style.cssText = `
        background-color: #007bff;
        color: white;
        border: none;
        padding: 12px 24px;
        font-size: 16px;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
    `;

	checkODBtn.addEventListener('mouseenter', () => {
		checkODBtn.style.backgroundColor = '#0056b3';
	});

	checkODBtn.addEventListener('mouseleave', () => {
		checkODBtn.style.backgroundColor = '#007bff';
	});

	checkODBtn.addEventListener('click', () => {
		checkODBtn.textContent = 'Processing attendance data...';
		checkODBtn.disabled = true;

		checkAllCoursesForOnDuty()
			.then(() => {
				hideProcessingMessage();
				checkODBtn.textContent = 'Check OD';
				checkODBtn.disabled = false;
			})
			.catch((error) => {
				hideProcessingMessage();
				checkODBtn.textContent = 'Check OD';
				checkODBtn.disabled = false;
				console.error('Error generating OD summary:', error);
			});
	});

	buttonContainer.appendChild(checkODBtn);

	if (summaryBox) {
		summaryBox.insertAdjacentElement('afterend', buttonContainer);
	} else {
		container.appendChild(buttonContainer);
	}

	checkODBtn.style.display = 'block';
}

function hideProcessingMessage() {
	const processingMsg = document.getElementById('odProcessingMessage');
	if (processingMsg) {
		processingMsg.remove();
	}
}

function calculateAttendanceSummary() {
	const body = document.getElementsByTagName('tbody')[0];
	const bodyRows = body.querySelectorAll('tr');

	let totalAttendedClasses = 0;
	let totalClasses = 0;

	bodyRows.forEach((row) => {
		const attendedClasses = parseFloat(
			row.childNodes[19]?.innerText || '0',
		);
		const classes = parseFloat(row.childNodes[21]?.innerText || '0');
		totalAttendedClasses += attendedClasses;
		totalClasses += classes;
	});

	const overallPercentage = (
		(totalAttendedClasses / totalClasses) *
		100
	).toFixed(2);
	const totalBunkedClasses = totalClasses - totalAttendedClasses;

	return {
		totalAttendedClasses,
		totalClasses,
		overallPercentage,
		totalBunkedClasses,
	};
}

function sortODSummaryTable() {
	const odTable = document.querySelector('#odSummaryTable tbody');
	if (!odTable) return;

	const rows = Array.from(odTable.rows);
	rows.sort((a, b) => {
		const dateA = new Date(a.cells[0].innerText.trim());
		const dateB = new Date(b.cells[0].innerText.trim());
		return dateA - dateB;
	});

	rows.forEach((row) => odTable.appendChild(row));
}

function createCell(text, style) {
	const td = document.createElement('td');
	if (style) td.style.cssText = style;
	td.textContent = text;
	return td;
}

function createHeaderCell(text, style) {
	const th = document.createElement('th');
	if (style) th.style.cssText = style;
	th.textContent = text;
	return th;
}

function createBoldCell(text, style) {
	const td = document.createElement('td');
	if (style) td.style.cssText = style;
	const b = document.createElement('b');
	b.textContent = text;
	td.appendChild(b);
	return td;
}

function displayAttendanceSummary() {
	const {
		totalAttendedClasses,
		totalClasses,
		overallPercentage,
		totalBunkedClasses,
	} = calculateAttendanceSummary();

	const container = document.querySelector('.table-responsive');
	if (!container) return;

	const existingSummary = document.getElementById('attendanceSummaryBox');
	if (existingSummary) {
		existingSummary.remove();
	}

	const summaryBox = document.createElement('div');
	summaryBox.id = 'attendanceSummaryBox';
	summaryBox.style.cssText = `
        margin-top: 20px;
        overflow: hidden;
    `;

	const table = document.createElement('table');
	table.className = 'table table-bordered table-striped';
	table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        text-align: center;
        background-color: #ffffff;
        border: 1px solid #ddd;
    `;

	const canLeaveClasses95 = Math.max(
		0,
		Math.floor(
			(0.05 * totalAttendedClasses - 0.95 * totalBunkedClasses) / 0.95,
		),
	);
	const canLeaveClasses90 = Math.max(
		0,
		Math.floor(
			(0.1 * totalAttendedClasses - 0.9 * totalBunkedClasses) / 0.9,
		),
	);
	const canLeaveClasses85 = Math.max(
		0,
		Math.floor(
			(0.15 * totalAttendedClasses - 0.85 * totalBunkedClasses) / 0.85,
		),
	);
	const canLeaveClasses80 = Math.max(
		0,
		Math.floor(
			(0.2 * totalAttendedClasses - 0.8 * totalBunkedClasses) / 0.8,
		),
	);
	const canLeaveClasses75 = Math.max(
		0,
		Math.floor(
			(0.25 * totalAttendedClasses - 0.75 * totalBunkedClasses) / 0.75,
		),
	);

	const thead = document.createElement('thead');
	thead.className = 'text-center';
	const headerRow = document.createElement('tr');
	headerRow.style.cssText = 'background-color: #f8f9fa; border-bottom: 2px solid #007bff;';
	headerRow.appendChild(createHeaderCell('Total Classes', 'text-align: center;'));
	headerRow.appendChild(createHeaderCell('Classes Attended', 'text-align: center;'));
	headerRow.appendChild(createHeaderCell('Classes Unattended', 'text-align: center;'));
	const pctHeader = createHeaderCell('Attendance Percentage', 'text-align: center;');
	pctHeader.colSpan = 3;
	headerRow.appendChild(pctHeader);
	thead.appendChild(headerRow);
	table.appendChild(thead);

	const tbody = document.createElement('tbody');
	tbody.style.textAlign = 'center';

	const dataRow = document.createElement('tr');
	dataRow.style.textAlign = 'center';
	dataRow.appendChild(createCell(String(totalClasses)));
	dataRow.appendChild(createCell(String(totalAttendedClasses), 'padding: 10px;'));
	dataRow.appendChild(createCell(String(totalBunkedClasses)));
	const pctCell = document.createElement('td');
	pctCell.colSpan = 3;
	pctCell.style.cssText = 'color: ' + (overallPercentage >= 75 ? '#28a745' : '#dc3545') + '; font-weight: bold;';
	pctCell.textContent = overallPercentage + '%';
	dataRow.appendChild(pctCell);
	tbody.appendChild(dataRow);

	const skipHeaderRow = document.createElement('tr');
	const skipLabel = createHeaderCell('Classes that can be skipped for attendance', 'text-align: center; vertical-align: middle; padding: 10px; font-weight: bold;');
	skipLabel.rowSpan = 2;
	skipHeaderRow.appendChild(skipLabel);
	['> 95%', '> 90%', '> 85%', '> 80%', '> 75%'].forEach((label) => {
		skipHeaderRow.appendChild(createHeaderCell(label, 'text-align: center; padding: 10px; font-weight: bold;'));
	});
	tbody.appendChild(skipHeaderRow);

	const skipDataRow = document.createElement('tr');
	skipDataRow.style.textAlign = 'center';
	skipDataRow.appendChild(createCell(String(canLeaveClasses95), 'padding: 10px;'));
	skipDataRow.appendChild(createCell(String(canLeaveClasses90)));
	skipDataRow.appendChild(createCell(String(canLeaveClasses85)));
	skipDataRow.appendChild(createCell(String(canLeaveClasses80)));
	skipDataRow.appendChild(createCell(String(canLeaveClasses75)));
	tbody.appendChild(skipDataRow);

	table.appendChild(tbody);
	summaryBox.appendChild(table);

	const mainTable = document.querySelector('#AttendanceDetailDataTable');
	if (mainTable) {
		mainTable.insertAdjacentElement('afterend', summaryBox);
	} else {
		container.appendChild(summaryBox);
	}
}

function showODTableDirectly() {
	const odPlaceholder = document.getElementById('odProcessingMessage');
	if (odPlaceholder) odPlaceholder.remove();
	const odTable = document.querySelector('#odSummaryTable');
	if (odTable) {
		odTable.style.display = 'table';
		const checkODButton = document.getElementById('checkODButton');
		if (checkODButton) checkODButton.remove();
	}
}

checkAllCoursesForOnDuty = async () => {
	showODTableDirectly();
	displayAttendanceSummary();
};
