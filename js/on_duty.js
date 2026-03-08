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

	let diff = (endDate - startDate) / 60000; // ms to minutes

	if (diff < 0) {
		diff += 24 * 60;
	}

	return diff;
}

async function checkAllCoursesForOnDuty() {
	// Get all the class IDs and slot names
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

	// Check a single course
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

		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = html;

		const attendanceRows = tempDiv.querySelectorAll('.table tbody tr');
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
				// OD count: less than 60 minutes(theory slot) => 1, 60 or more minutes(labs) => 2.
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

// Display the OD table
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

	// Calculate total OD count first
	let totalOdCount = 0;
	entries.forEach((entry) => {
		totalOdCount += entry.odCount;
	});

	// Add OD count above the table
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
	odCountDiv.innerHTML = `Total OD Count: <span style="color: #dc3545; font-size: 22px;">${totalOdCount}</span><br><small style="color: #6c757d; font-weight: normal;">The total number of ODs includes all types combined (SWC, School, CDC, etc.), be careful.</small>`;
	tableContainer.appendChild(odCountDiv);

	const table = document.createElement('table');
	table.id = 'onDutyTable';
	table.className = 'table table-bordered table-striped';

	table.innerHTML = `
      <thead class="thead-dark">
        <tr>
          <th style="text-align: center;">#</th>
          <th style="text-align: center;">Course Code</th>
          <th style="text-align: center;">Course Title</th>
          <th style="text-align: center;">Slot</th>
          <th style="text-align: center;">Date</th>
          <th style="text-align: center;">Day/Time</th>
          <th style="text-align: center;">Attendance Status</th>
          <th style="text-align: center;">OD Count</th>
        </tr>
      </thead>
      <tbody>
      </tbody>
    `;

	const tbody = table.querySelector('tbody');

	entries.forEach((entry, index) => {
		const row = document.createElement('tr');
		row.innerHTML = `
        <td style="text-align: center;">${index + 1}</td>
        <td style="text-align: center;">${entry.courseCode}</td>
        <td>${entry.courseTitle}</td>
        <td style="text-align: center;">${entry.slot}</td>
        <td style="text-align: center;">${entry.date}</td>
        <td style="text-align: center;">${entry.dayTime}</td>
        <td style="text-align: center;">${entry.status}</td>
        <td style="text-align: center;">${entry.odCount}</td>
      `;
		tbody.appendChild(row);
	});

	tableContainer.appendChild(table);

	// Add Course-Wise OD button below the table
	const courseWiseButtonContainer = document.createElement('div');
	courseWiseButtonContainer.style.cssText = `
		margin: 15px 0 10px 0;
		text-align: left;
	`;

	const courseWiseButton = document.createElement('button');
	courseWiseButton.innerHTML = 'Check Course-Wise OD';
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

// Display course-wise OD summary table
function displayCourseWiseTable(entries) {
	// First, get all courses from the attendance table
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

				// Determine if it's a lab or theory course
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

	// Group entries by course code and type (theory/lab) and calculate total OD count per course
	const courseWiseData = {};

	// Initialize all courses with 0 OD count
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
		// Add slot if it exists
		if (
			course.slotName &&
			course.slotName !== 'undefined' &&
			course.slotName !== undefined
		) {
			courseWiseData[course.courseKey].slots.add(course.slotName);
		}
	});

	// Now add OD counts from actual entries
	entries.forEach((entry) => {
		// Determine if it's a lab or theory course
		const isLab =
			entry.courseCode.endsWith('L') ||
			(entry.slot && entry.slot.includes('L'));
		const courseType = isLab ? 'Lab' : 'Theory';
		const courseKey = `${entry.courseCode}_${courseType}`;

		if (courseWiseData[courseKey]) {
			// Only add slot if it exists and is not undefined/null
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

	// Convert to array and sort by course code, then by type (Theory first, then Lab)
	const courseWiseArray = Object.values(courseWiseData)
		.map((course) => ({
			...course,
			slots:
				course.slots.size > 0
					? Array.from(course.slots).join(', ')
					: 'N/A', // Handle empty slots
		}))
		.sort((a, b) => {
			// First sort by course code
			const codeCompare = a.courseCode.localeCompare(b.courseCode);
			if (codeCompare !== 0) return codeCompare;
			// Then sort by type (Theory before Lab)
			return a.courseType.localeCompare(b.courseType);
		});

	const container = document.querySelector('.table-responsive');
	if (!container) {
		console.error('Could not find .table-responsive container');
		return;
	}

	// Remove existing course-wise table if any
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

	table.innerHTML = `
		<thead class="thead-dark">
			<tr>
				<th style="text-align: center;">#</th>
				<th style="text-align: center;">Course Code</th>
				<th style="text-align: center;">Course Title</th>
				<th style="text-align: center;">Slot</th>
				<th style="text-align: center;">OD Count</th>
			</tr>
		</thead>
		<tbody>
		</tbody>
	`;

	const tbody = table.querySelector('tbody');

	courseWiseArray.forEach((course, index) => {
		const row = document.createElement('tr');
		const odCountStyle =
			course.odCount === 0
				? 'color: #000000'
				: 'font-weight: bold; color: #28a745';
		row.innerHTML = `
			<td style="text-align: center;">${index + 1}</td>
			<td style="text-align: center;">${course.courseCode}</td>
			<td>${course.courseTitle}</td>
			<td style="text-align: center;">${course.slots}</td>
			<td style="text-align: center;"><span style="${odCountStyle};">${course.odCount}</span></td>
		`;
		tbody.appendChild(row);
	});

	tableContainer.appendChild(table);
	container.appendChild(tableContainer);
}

// Make the function globally available for automatic execution
window.checkAllCoursesForOnDuty = checkAllCoursesForOnDuty;

// Keep the Chrome message listener for backward compatibility (if needed from popup)
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
