const extApi = typeof chrome !== 'undefined' ? chrome : browser;

function appendTotalRow(tbody, values, isOther) {
	const tr = document.createElement('tr');
	tr.className = 'tableContent-level1';
	tr.style.background = 'rgb(60,141,188,0.8)';

	const lostWeightage = (values.weightagePercent - values.weightageEqui).toFixed(2);

	if (!isOther) {
		const cells = [
			'',
			{ text: 'Total', bold: true },
			values.maxMarks.toFixed(2),
			values.weightagePercent.toFixed(2),
			'',
			{ text: values.scored.toFixed(2), bold: true },
			{ text: values.weightageEqui.toFixed(2), bold: true },
			{ text: 'Lost Weightage Marks: ' + lostWeightage, bold: true },
		];
		cells.forEach((cell) => {
			const td = document.createElement('td');
			if (typeof cell === 'object') {
				const b = document.createElement('b');
				b.textContent = cell.text;
				td.appendChild(b);
			} else {
				td.textContent = cell;
			}
			tr.appendChild(td);
		});
	} else {
		const cells = [
			'',
			{ text: 'Total:', bold: true },
			values.maxMarks.toFixed(2),
			values.weightagePercent.toFixed(2),
			'',
			{ text: values.scored.toFixed(2), bold: true },
			{ text: values.weightageEqui.toFixed(2), bold: true },
			values.classAvg.toFixed(2),
			' ',
			{ text: 'Lost Weightage Marks:', bold: true },
			lostWeightage,
		];
		cells.forEach((cell) => {
			const td = document.createElement('td');
			if (typeof cell === 'object') {
				const b = document.createElement('b');
				b.textContent = cell.text;
				td.appendChild(b);
			} else {
				td.textContent = cell;
			}
			tr.appendChild(td);
		});
	}

	tbody.appendChild(tr);
}

function appendResultRow(tbody, message, colspan, isPass) {
	const tr = document.createElement('tr');
	tr.className = 'tableContent-level1';
	tr.style.background = isPass ? 'rgb(170, 255, 0,0.6)' : 'rgb(255,0,0,0.6)';

	const td = document.createElement('td');
	td.colSpan = colspan;
	td.style.textAlign = 'center';
	if (!isPass) {
		const b = document.createElement('b');
		b.textContent = message;
		td.appendChild(b);
	} else {
		td.textContent = message;
	}
	tr.appendChild(td);
	tbody.appendChild(tr);
}

let modify_marks_page = () => {
	let other = false,
		colspan = 8;
	let tables = document.querySelectorAll('.customTable-level1 > tbody');
	let subject_header = Array.from(document.querySelectorAll('.tableContent'));
	let i = 0;
	for (let j = 0; j < tables.length; j++) {
		let sub_header_row = subject_header[i].getElementsByTagName('td');
		let sub_type = sub_header_row[4].textContent;
		i += 2;
		let tot_max_marks = 0,
			tot_weightage_percent = 0,
			tot_scored = 0,
			tot_weightage_equi = 0,
			tot_class_avg = 0;

		let table_marks = tables[j].querySelectorAll('.tableContent-level1');
		table_marks = Array.from(table_marks);

		for (let k = 0; k < table_marks.length; k++) {
			if (table_marks[k].style.background !== '') {
				other = true;
				colspan = 11;
				continue;
			}

			const cells = table_marks[k].getElementsByTagName('td');
			let max_marks = cells[2] ? cells[2].textContent.replace(/[^0-9.]+/g, '') : '0';
			let weightage_percent = cells[3] ? cells[3].textContent.replace(/[^0-9.]+/g, '') : '0';
			let scored = cells[5] ? cells[5].textContent.replace(/[^0-9.]+/g, '') : '0';
			let weightage_equi = cells[6] ? cells[6].textContent.replace(/[^0-9.]+/g, '') : '0';
			let class_avg = cells[7] ? cells[7].textContent.replace(/[^0-9.]+/g, '') : '0';

			tot_max_marks += parseFloat(max_marks);
			tot_weightage_percent += parseFloat(weightage_percent);
			tot_scored += parseFloat(scored);
			tot_weightage_equi += parseFloat(weightage_equi);
			tot_class_avg += parseFloat(class_avg);
		}

		appendTotalRow(tables[j], {
			maxMarks: tot_max_marks,
			weightagePercent: tot_weightage_percent,
			scored: tot_scored,
			weightageEqui: tot_weightage_equi,
			classAvg: tot_class_avg,
		}, other);

		let pass_marks;

		if (
			(sub_type.includes('Theory') && tot_weightage_percent == 60) ||
			(sub_type.includes('Lecture') && tot_weightage_percent == 70)
		) {
			if (tot_weightage_equi >= 34) {
				pass_marks = 40;
				appendResultRow(
					tables[j],
					'You need only ' + pass_marks + ' marks out of 100 in FAT to pass this course. \u{1F973}',
					colspan,
					true,
				);
			} else {
				pass_marks = (34 - tot_weightage_equi) * 2.5 + 40;
				appendResultRow(
					tables[j],
					'Minimum ' + pass_marks.toFixed(2) + ' marks are required in FAT to pass this course.',
					colspan,
					false,
				);
			}
		} else if (
			(sub_type.includes('Lab') || sub_type.includes('Online')) &&
			tot_weightage_percent == 60
		) {
			if (tot_weightage_equi >= 50) {
				appendResultRow(
					tables[j],
					'You have fulfilled the criteria of passing this lab course. \u{1F973}',
					colspan,
					true,
				);
			} else {
				pass_marks = 50 - tot_weightage_equi;
				appendResultRow(
					tables[j],
					'Minimum ' + pass_marks.toFixed(2) + ' marks are required in FAT to pass this course.',
					colspan,
					false,
				);
			}
		} else if (sub_type.includes('Soft') && tot_weightage_percent == 60) {
			if (tot_weightage_equi >= 50) {
				appendResultRow(
					tables[j],
					'You have fulfilled the criteria of passing this STS course. \u{1F973}',
					colspan,
					true,
				);
			} else {
				pass_marks = 50 - tot_weightage_equi;
				appendResultRow(
					tables[j],
					'Minimum ' + pass_marks.toFixed(2) + ' marks are required in FAT to pass this course.',
					colspan,
					false,
				);
			}
		}
	}
};
extApi.runtime.onMessage.addListener((request) => {
	if (request.message === 'mark_view_page') {
		try {
			modify_marks_page();
		} catch (error) {}
	}
});
