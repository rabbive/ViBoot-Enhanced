const extApi = typeof chrome !== 'undefined' ? chrome : browser;

let view_attendance_page = () => {
	if (document.location.href.includes('vtopcc')) {
		let table_line = document.querySelectorAll('.table-responsive')[0];
		table_line.getElementsByTagName('span')[0].outerHTML +=
			"<br><br><p id='attendance' style='color:#32750e; background:#f7f710; font-size:1rem; display: inline-block; border-radius: 5px;'><b>* Note: This calculator doesn't calculate the attendance till the exam date, it only calculates the attendance to 74.01%.</b></p>";

		let color_detail = document.createElement('div');
		color_detail.innerHTML = `
            <p style='color:RGB(34 144 62);'>*Attendance greater than 75%.</p>
            <p style='color:rgb(255, 171, 16);margin-top:-10px;'>*Be cautious, your attendance is in between 74.01% to 74.99%.</p>
            <p style='color:rgb(238, 75, 43); margin-top:-10px'>*Attendance less than 75%.</p>
            `;
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
		divCaution.innerHTML =
			"<p id='attendance' style='color:#32750e; background:#f7f710; font-size:1rem; display: inline-block; border-radius: 5px;'><b>* Note: This calculator doesn't calculate the attendance till the exam date, it only calculates the attendance to 74.01%.</b></p>";
		table_line.insertAdjacentElement('beforebegin', divCaution);

		let color_detail = document.createElement('div');
		color_detail.innerHTML = `
		    <p style='color:RGB(34 144 62);'>*Attendance greater than 75%.</p>
		    <p style='color:rgb(255, 171, 16);margin-top:-10px;'>*Be Cautious, your attendance is in between 74.01% to 74.99%.</p>
		    <p style='color:rgb(238, 75, 43); margin-top:-10px'>*Attendance less than 75%.</p>
		    `;
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
		let new_Table_Content = row.innerHTML.split('\n');
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
			let new_table_content_splice = document.location.href.includes(
				'vtopcc',
			)
				? 29
				: 37;

			if (attended_classes / tot_classes < 0.7401) {
				let req_classes = Math.ceil(
					(0.7401 * tot_classes - attended_classes) / 0.2599,
				);

				if (course_type.includes('Lab')) {
					req_classes /= 2;
					req_classes = Math.ceil(req_classes);
					new_Table_Content.splice(
						new_table_content_splice,
						0,
						`<td style="vertical-align: middle; border: 1px solid #b2b2b2; padding: 5px; background: rgb(238, 75, 43,0.7);"><p style="margin: 0px;">${req_classes} lab(s) should be attended.</p></td>`,
					);
					row.innerHTML = new_Table_Content.join('');
				} else {
					new_Table_Content.splice(
						new_table_content_splice,
						0,
						`<td style="vertical-align: middle; border: 1px solid #b2b2b2; padding: 5px; background: rgb(238, 75, 43,0.7);"><p style="margin: 0px;">${req_classes} class(es) should be attended.</p></td>`,
					);
					row.innerHTML = new_Table_Content.join('');
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
					if (bunk_classes == -1) {
						bunk_classes = 0;
					}
					new_Table_Content.splice(
						new_table_content_splice,
						0,
						`<td style="vertical-align: middle; border: 1px solid #b2b2b2; padding: 5px; background: ${color};"><p style="margin: 0px;">Only ${bunk_classes} lab(s) can be skipped. <br>Be cautious.</p></td>`,
					);
					row.innerHTML = new_Table_Content.join('');
				} else {
					if (bunk_classes == -1) {
						bunk_classes = 0;
					}
					new_Table_Content.splice(
						new_table_content_splice,
						0,
						`<td style="vertical-align: middle; border: 1px solid #b2b2b2; padding: 5px; background: ${color};"><p style="margin: 0px;">Only ${bunk_classes} class(es) can be skipped. <br>Be cautious.</p></td>`,
					);
					row.innerHTML = new_Table_Content.join('');
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
		} catch (error) {
			console.error('ViBoot: Error in view_attendance handler:', error);
		}
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
	checkODBtn.innerHTML = 'Check OD';
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
		checkODBtn.innerHTML = 'Processing attendance data...';
		checkODBtn.disabled = true;

		checkAllCoursesForOnDuty()
			.then(() => {
				hideProcessingMessage();
				checkODBtn.innerHTML = 'Check OD';
				checkODBtn.disabled = false;
			})
			.catch((error) => {
				hideProcessingMessage();
				checkODBtn.innerHTML = 'Check OD';
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

function getAttendanceColumnIndices() {
	const href = document.location.href;
	if (href.includes('vtopcc')) {
		return { attended: 19, total: 21 };
	}
	return { attended: 11, total: 13 };
}

function calculateAttendanceSummary() {
	const body = document.getElementsByTagName('tbody')[0];
	const bodyRows = body.querySelectorAll('tr');
	const { attended, total } = getAttendanceColumnIndices();

	let totalAttendedClasses = 0;
	let totalClasses = 0;

	bodyRows.forEach((row) => {
		const attendedClasses = parseFloat(
			row.childNodes[attended]?.innerText || '0',
		);
		const classes = parseFloat(
			row.childNodes[total]?.innerText || '0',
		);
		if (!isNaN(attendedClasses)) totalAttendedClasses += attendedClasses;
		if (!isNaN(classes)) totalClasses += classes;
	});

	const overallPercentage = totalClasses > 0
		? ((totalAttendedClasses / totalClasses) * 100).toFixed(2)
		: '0.00';
	const totalBunkedClasses = totalClasses - totalAttendedClasses;

	return {
		totalAttendedClasses,
		totalClasses,
		overallPercentage,
		totalBunkedClasses,
	};
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
	table.querySelectorAll('th, td').forEach((cell) => {
		cell.style.textAlign = 'center';
	});

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

	function classesToReachTarget(
		currentAttended,
		currentTotal,
		targetPercentage,
	) {
		return Math.ceil(
			(targetPercentage * currentTotal - currentAttended) /
				(1 - targetPercentage),
		);
	}

	table.innerHTML = `
        <thead class="text-center">
            <tr style="background-color: #f8f9fa; border-bottom: 2px solid #007bff;">
            <th style="text-align: center;">Total Classes</th>
            <th style="text-align: center;">Classes Attended</th>
            <th style="text-align: center;">Classes Unattended</th>
            <th colspan="3" style="text-align: center;">Attendance Percentage</th>
        </tr>
        </thead>
        <tbody style="text-align: center">
            <tr style="text-align: center">
            <td>${totalClasses}</td>
            <td style="padding: 10px;">${totalAttendedClasses}</td>
            <td>${totalBunkedClasses}</td>
                <td colspan="3" style="color: ${overallPercentage >= 75 ? '#28a745' : '#dc3545'}; font-weight: bold;">${overallPercentage}%</td>
                
            </tr>
            <tr>
            <th rowspan="2" style="text-align: center; vertical-align: middle; padding: 10px; font-weight: bold;">Classes that can be skipped for attendance</th>
            <th style="text-align: center; padding: 10px; font-weight: bold;">> 95%</th>
            <th style="text-align: center; padding: 10px; font-weight: bold;">> 90%</th>
            <th style="text-align: center; padding: 10px; font-weight: bold;">> 85%</th>
            <th style="text-align: center; padding: 10px; font-weight: bold;">> 80%</th>
            <th style="text-align: center; padding: 10px; font-weight: bold;">> 75%</th>
        </tr>
            <tr style="text-align: center">
                <td style="padding: 10px;">${canLeaveClasses95}</td>
                <td>${canLeaveClasses90}</td>
                <td>${canLeaveClasses85}</td>
                <td>${canLeaveClasses80}</td>
                <td>${canLeaveClasses75}</td>
            </tr>
        </tbody>
    `;

	summaryBox.appendChild(table);

	const mainTable = document.querySelector('#AttendanceDetailDataTable');
	if (mainTable) {
		mainTable.insertAdjacentElement('afterend', summaryBox);
	} else {
		container.appendChild(summaryBox);
	}
}

