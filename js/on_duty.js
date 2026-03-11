const extApi = typeof chrome !== 'undefined' ? chrome : browser;

const isDevMode = false;

function log(...args) {
	if (isDevMode) {
		// console.log(...args);
	}
}

function getDuration(dayTime) {
	if (!dayTime) return 0;

	let timeString = dayTime;
	if (dayTime.includes(',')) {
		const parts = dayTime.split(',');
		timeString = parts[1].trim();
	}

	const times = timeString.split('-').map((part) => part.trim());
	if (times.length !== 2) return 0;

	const startTime = times[0];
	const endTime = times[1];

	const startDate = new Date(`1970/01/01 ${startTime}`);
	const endDate = new Date(`1970/01/01 ${endTime}`);

	let diff = (endDate - startDate) / 60000;

	if (diff < 0) {
		diff += 24 * 60;
	}

	return diff;
}

async function checkAllCoursesForOnDuty() {
	const courseInfo = [];
	document.querySelectorAll('.table tbody tr').forEach((row) => {
		const viewButton = row.querySelector('a.btn-link');
		if (viewButton) {
			const onClickAttr = viewButton.getAttribute('onclick');
			const match = onClickAttr.match(
				/processViewAttendanceDetail\('([^']+)',\s*'([^']+)'\)/,
			);
			if (match) {
				courseInfo.push({
					classId: match[1],
					slotName: match[2],
					courseCode: row
						.querySelector('td:nth-child(2) p')
						?.textContent.trim(),
					courseTitle: row
						.querySelector('td:nth-child(3) p')
						?.textContent.trim(),
				});
			}
		}
	});

	log(`Found ${courseInfo.length} courses to check`);

	const csrfToken = document.querySelector("input[name='_csrf']")?.value;
	const authorizedID = document.querySelector('input#authorizedID')?.value;

	if (!csrfToken || !authorizedID) {
		console.error('Could not find CSRF token or authorizedID');
		return [];
	}

	const onDutyEntries = [];

	async function checkCourse(course) {
		log(`Checking course: ${course.courseCode} - ${course.courseTitle}`);

		const formData = new FormData();
		formData.append('_csrf', csrfToken);
		formData.append('classId', course.classId);
		formData.append('slotName', course.slotName);
		formData.append('authorizedID', authorizedID);
		formData.append('x', new Date().toUTCString());

		const response = await fetch('processViewAttendanceDetail', {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			console.error(`Failed to fetch details for ${course.courseCode}`);
			return;
		}

		const html = await response.text();

		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');

		const attendanceRows = doc.querySelectorAll('.table tbody tr');
		log(
			`Found ${attendanceRows.length} attendance entries for ${course.courseCode}`,
		);

		attendanceRows.forEach((row) => {
			const date = row
				.querySelector('td:nth-child(2)')
				?.textContent.trim();
			const dayTime = row
				.querySelector('td:nth-child(4) p')
				?.textContent.trim();
			const statusCell = row.querySelector('td:nth-child(5)');
			const status = statusCell?.textContent.trim();

			if (status && status.includes('On Duty')) {
				const duration = getDuration(dayTime);
				const odCount = duration < 60 ? 1 : 2;

				onDutyEntries.push({
					courseCode: course.courseCode,
					courseTitle: course.courseTitle,
					slot: course.slotName,
					date,
					dayTime,
					status,
					odCount,
				});

				log(
					`Found On Duty: ${course.courseCode} on ${date} (${dayTime}) with duration ${duration} minutes, OD Count: ${odCount}`,
				);
			}
		});
	}

	for (const course of courseInfo) {
		await checkCourse(course);
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	log('=== ON DUTY ATTENDANCE SUMMARY ===');
	if (onDutyEntries.length === 0) {
		log("No 'On Duty' entries found in any course");
	} else {
		log(`Found ${onDutyEntries.length} 'On Duty' entries:`);
		onDutyEntries.forEach((entry, index) => {
			log(`${index + 1}. ${entry.courseCode} - ${entry.courseTitle}`);
			log(`   Date: ${entry.date}, Time: ${entry.dayTime}`);
			log(`   Attendance Status: ${entry.status}`);
			log(`   OD Count: ${entry.odCount}`);
			log('---');
		});
	}

	displayOnDutyTable(onDutyEntries);

	return onDutyEntries;
}

function createStyledCell(text, centered) {
	const td = document.createElement('td');
	if (centered) td.style.textAlign = 'center';
	td.textContent = text;
	return td;
}

function displayOnDutyTable(entries) {
	const container = document.querySelector('.table-responsive');

	function extractStartTime(dayTime) {
		if (!dayTime) return '00:00';
		if (dayTime.includes(',')) {
			const parts = dayTime.split(',');
			dayTime = parts[1].trim();
		}
		const times = dayTime.split('-');
		return times[0]?.trim() || '00:00';
	}

	entries.sort((a, b) => {
		const dateA = new Date(`${a.date} ${extractStartTime(a.dayTime)}`);
		const dateB = new Date(`${b.date} ${extractStartTime(b.dayTime)}`);
		return dateA - dateB;
	});

	if (!container) {
		console.error('Could not find .table-responsive container');
		return;
	}

	const existingTable = document.getElementById('onDutyTableContainer');
	if (existingTable) {
		existingTable.remove();
	}

	const tableContainer = document.createElement('div');
	tableContainer.id = 'onDutyTableContainer';
	tableContainer.classList.add('mt-4');

	const heading = document.createElement('h4');
	heading.textContent = 'OD Summary';
	heading.classList.add('mb-2', 'text-primary');
	tableContainer.appendChild(heading);

	let totalOdCount = 0;
	entries.forEach((entry) => {
		totalOdCount += entry.odCount;
	});

	const odCountDiv = document.createElement('div');
	odCountDiv.className = 'mb-3 p-3';
	odCountDiv.style.cssText = `
        background-color: #f8f9fa;
        border: 2px solid #007bff;
        border-radius: 8px;
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        color: #007bff;
    `;
	const odLabel = document.createTextNode('Total OD Count: ');
	odCountDiv.appendChild(odLabel);
	const odCountSpan = document.createElement('span');
	odCountSpan.style.cssText = 'color: #dc3545; font-size: 22px;';
	odCountSpan.textContent = String(totalOdCount);
	odCountDiv.appendChild(odCountSpan);
	odCountDiv.appendChild(document.createElement('br'));
	const odNote = document.createElement('small');
	odNote.style.cssText = 'color: #6c757d; font-weight: normal;';
	odNote.textContent = 'The total number of ODs includes all types combined (SWC, School, CDC, etc.), be careful.';
	odCountDiv.appendChild(odNote);
	tableContainer.appendChild(odCountDiv);

	const table = document.createElement('table');
	table.id = 'onDutyTable';
	table.className = 'table table-bordered table-striped';

	const thead = document.createElement('thead');
	thead.className = 'thead-dark';
	const headerRow = document.createElement('tr');
	['#', 'Course Code', 'Course Title', 'Slot', 'Date', 'Day/Time', 'Attendance Status', 'OD Count'].forEach((label) => {
		const th = document.createElement('th');
		th.style.textAlign = 'center';
		th.textContent = label;
		headerRow.appendChild(th);
	});
	thead.appendChild(headerRow);
	table.appendChild(thead);

	const tbody = document.createElement('tbody');
	entries.forEach((entry, index) => {
		const row = document.createElement('tr');
		row.appendChild(createStyledCell(String(index + 1), true));
		row.appendChild(createStyledCell(entry.courseCode, true));
		row.appendChild(createStyledCell(entry.courseTitle, false));
		row.appendChild(createStyledCell(entry.slot, true));
		row.appendChild(createStyledCell(entry.date, true));
		row.appendChild(createStyledCell(entry.dayTime, true));
		row.appendChild(createStyledCell(entry.status, true));
		row.appendChild(createStyledCell(String(entry.odCount), true));
		tbody.appendChild(row);
	});
	table.appendChild(tbody);
	tableContainer.appendChild(table);

	const courseWiseButtonContainer = document.createElement('div');
	courseWiseButtonContainer.style.cssText = `
		margin: 15px 0 10px 0;
		text-align: left;
	`;

	const courseWiseButton = document.createElement('button');
	courseWiseButton.textContent = 'Check Course-Wise OD';
	courseWiseButton.style.cssText = `
		background-color: #28a745;
		color: white;
		border: none;
		padding: 12px 24px;
		font-size: 16px;
		border-radius: 5px;
		cursor: pointer;
		transition: background-color 0.3s;
	`;

	courseWiseButton.addEventListener('mouseenter', () => {
		courseWiseButton.style.backgroundColor = '#218838';
	});

	courseWiseButton.addEventListener('mouseleave', () => {
		courseWiseButton.style.backgroundColor = '#28a745';
	});

	courseWiseButton.addEventListener('click', () => {
		displayCourseWiseTable(entries);
	});

	courseWiseButtonContainer.appendChild(courseWiseButton);
	tableContainer.appendChild(courseWiseButtonContainer);

	container.appendChild(tableContainer);
}

function displayCourseWiseTable(entries) {
	const allCourses = [];
	document.querySelectorAll('.table tbody tr').forEach((row) => {
		const viewButton = row.querySelector('a.btn-link');
		if (viewButton) {
			const onClickAttr = viewButton.getAttribute('onclick');
			const match = onClickAttr.match(
				/processViewAttendanceDetail\('([^']+)',\s*'([^']+)'\)/,
			);
			if (match) {
				const courseCode = row
					.querySelector('td:nth-child(2) p')
					?.textContent.trim();
				const courseTitle = row
					.querySelector('td:nth-child(3) p')
					?.textContent.trim();
				const slotName = match[2];

				const isLab =
					courseCode.endsWith('L') ||
					(slotName && slotName.includes('L'));
				const courseType = isLab ? 'Lab' : 'Theory';

				allCourses.push({
					courseCode,
					courseTitle,
					slotName,
					courseType,
					courseKey: `${courseCode}_${courseType}`,
				});
			}
		}
	});

	const courseWiseData = {};

	allCourses.forEach((course) => {
		if (!courseWiseData[course.courseKey]) {
			courseWiseData[course.courseKey] = {
				courseCode: course.courseCode,
				courseTitle: course.courseTitle,
				courseType: course.courseType,
				slots: new Set(),
				odCount: 0,
			};
		}
		if (
			course.slotName &&
			course.slotName !== 'undefined' &&
			course.slotName !== undefined
		) {
			courseWiseData[course.courseKey].slots.add(course.slotName);
		}
	});

	entries.forEach((entry) => {
		const isLab =
			entry.courseCode.endsWith('L') ||
			(entry.slot && entry.slot.includes('L'));
		const courseType = isLab ? 'Lab' : 'Theory';
		const courseKey = `${entry.courseCode}_${courseType}`;

		if (courseWiseData[courseKey]) {
			if (
				entry.slot &&
				entry.slot !== 'undefined' &&
				entry.slot !== undefined
			) {
				courseWiseData[courseKey].slots.add(entry.slot);
			}
			courseWiseData[courseKey].odCount += entry.odCount;
		}
	});

	const courseWiseArray = Object.values(courseWiseData)
		.map((course) => ({
			...course,
			slots:
				course.slots.size > 0
					? Array.from(course.slots).join(', ')
					: 'N/A',
		}))
		.sort((a, b) => {
			const codeCompare = a.courseCode.localeCompare(b.courseCode);
			if (codeCompare !== 0) return codeCompare;
			return a.courseType.localeCompare(b.courseType);
		});

	const container = document.querySelector('.table-responsive');
	if (!container) {
		console.error('Could not find .table-responsive container');
		return;
	}

	const existingCourseWiseTable = document.getElementById(
		'courseWiseTableContainer',
	);
	if (existingCourseWiseTable) {
		existingCourseWiseTable.remove();
	}

	const tableContainer = document.createElement('div');
	tableContainer.id = 'courseWiseTableContainer';
	tableContainer.classList.add('mt-4');

	const heading = document.createElement('h4');
	heading.textContent = 'Course-Wise OD Summary';
	heading.classList.add('mb-2', 'text-primary');
	tableContainer.appendChild(heading);

	const table = document.createElement('table');
	table.id = 'courseWiseTable';
	table.className = 'table table-bordered table-striped';

	const thead = document.createElement('thead');
	thead.className = 'thead-dark';
	const headerRow = document.createElement('tr');
	['#', 'Course Code', 'Course Title', 'Slot', 'OD Count'].forEach((label) => {
		const th = document.createElement('th');
		th.style.textAlign = 'center';
		th.textContent = label;
		headerRow.appendChild(th);
	});
	thead.appendChild(headerRow);
	table.appendChild(thead);

	const tbody = document.createElement('tbody');

	courseWiseArray.forEach((course, index) => {
		const row = document.createElement('tr');
		row.appendChild(createStyledCell(String(index + 1), true));
		row.appendChild(createStyledCell(course.courseCode, true));
		row.appendChild(createStyledCell(course.courseTitle, false));
		row.appendChild(createStyledCell(course.slots, true));

		const odTd = document.createElement('td');
		odTd.style.textAlign = 'center';
		const odSpan = document.createElement('span');
		odSpan.style.cssText = course.odCount === 0
			? 'color: #000000'
			: 'font-weight: bold; color: #28a745';
		odSpan.textContent = String(course.odCount);
		odTd.appendChild(odSpan);
		row.appendChild(odTd);

		tbody.appendChild(row);
	});

	table.appendChild(tbody);
	tableContainer.appendChild(table);
	container.appendChild(tableContainer);
}

window.checkAllCoursesForOnDuty = checkAllCoursesForOnDuty;

extApi.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'generateODSummary') {
		checkAllCoursesForOnDuty()
			.then((results) => {
				sendResponse({ success: true, results });
			})
			.catch((error) => {
				console.error('Error:', error);
				sendResponse({ success: false, error: error.message });
			});
		return true;
	}
});
