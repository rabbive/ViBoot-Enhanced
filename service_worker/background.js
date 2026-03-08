const extApi = typeof chrome !== 'undefined' ? chrome : browser;
let course = '';
let faculty_slot = '';
let module_wise = true;
let data = {};
let time_last = new Date();

let set_time_last = (time) => {
	time_last = time;
};
const returnMessage = (MessageToReturn) => {
	extApi.tabs.query({ active: true, currentWindow: true }, (tab) => {
		const targetTab = tab.find((currentTab) =>
			(currentTab.url || '').includes('vtop'),
		);
		if (!targetTab || typeof targetTab.id !== 'number') return;
		extApi.tabs.sendMessage(targetTab.id, {
			message: MessageToReturn,
		});
	});
};

const trigger_download = (request) => {
	if (!request || !request.data) return;
	course = request.data.course;
	faculty_slot = request.data.faculty_slot;
	module_wise = request.data.module_wise;
	request.data.link_data.forEach((link) => {
		fetch(link.url, { method: 'HEAD', credentials: 'include' })
			.then((response) => {
				const contentType = response.headers.get('Content-Type') || '';
				if (
					response.ok &&
					contentType.includes('pdf')
				) {
					// console.log(response.text);
					extApi.downloads.download({
						url: link.url,
						conflictAction: 'uniquify',
					});
				} else {
					// console.log('Skipping non-PDF file: ', link.url);
				}
			})
			.catch((error) => {
				console.error('Error fetching file: ', error);
			});
	});
};

extApi.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (!request || typeof request.message !== 'string') return;

	if (
		request.message === 'course-page-data' ||
		request.message === 'assignment-page-data'
	) {
		data = request.data || {};
		trigger_download(request);
		return;
	}

	if (request.message === 'logout') {
		extApi.storage.sync.set({ token: null });
		return;
	}

	if (request.message === 'login') {
		extApi.storage.sync.set({ token: null }, () => {
			sendResponse(false);
		});
		return true;
	}
});

extApi.downloads.onDeterminingFilename.addListener((item, suggest) => {
	// console.log('Item');
	// console.log(item);
	if (
		item.url.includes('vtop.vit.ac.in') ||
		item.url.includes('vtopcc.vit.ac.in') ||
		item.url.includes('vtop.vitbhopal.ac.in')
	) {
		let view;
		let fileUrlLower = item.url.toLowerCase();
		// console.log(fileUrlLower);
		if (fileUrlLower.includes('examinations')) {
			view = 'Assignment';
		} else if (fileUrlLower.includes('coursesyllabusdownload')) {
			view = 'Syllabus';
		} else if (fileUrlLower.includes('downloadpdf')) {
			view = 'Course';
		} else {
			view = 'Unknown';
		}
		// console.log(view);

		if (view == 'Course') {
			let file_extension = item.filename
				.replace(/([^_]*_){8}/, '')
				.split('.');
			file_extension = '.' + file_extension[file_extension.length - 1];
			// console.log(course);
			// console.log(faculty_slot);
			if (course != '' && faculty_slot != '') {
				let filename =
					'VIT Downloads/' + course + '/' + faculty_slot + '/';
				if (data.link_data[0]['folder_title'] != undefined) {
					if (module_wise)
						filename +=
							data.link_data[0]['folder_title'] +
							'/' +
							data.link_data[0]['title'] +
							file_extension;
					else
						filename += data.link_data[0]['title'] + file_extension;
				} else filename += item.filename;
				// console.log(filename);
				suggest({
					filename: filename,
				});
				course = '';
				faculty_slot = '';
				// console.log('Flag 1');
			} else
				suggest({
					filename: 'VIT Downloads/Other Downloads/' + item.filename,
				});
		} else if (view == 'Assignment') {
			// console.log('Flag 2');
			let file_extension = item.filename
				.replace(/([^_]*_){8}/, '')
				.split('.');
			file_extension = '.' + file_extension[file_extension.length - 1];
			// console.log(course);
			let file_name = course;
			if (item.url.includes('doDownloadQuestion')) file_name += ' QP ';
			else if (item.url.includes('downloadSTudentDA'))
				file_name += ' Submission ';
			else {
				suggest({
					filename:
						'VIT Downloads/Other Downloads/Assignments/' +
						item.filename,
				});
				return;
			}
			file_name += item.filename.slice(-5, -4);
			suggest({
				filename:
					'VIT Downloads/Other Downloads/Assignments/' +
					file_name +
					file_extension,
			});
		} else if (view == 'Syllabus') {
			// console.log('Flag 3');
			let file_extension = item.filename
				.replace(/([^_]*_){8}/, '')
				.split('.');
			file_extension = '.' + file_extension[file_extension.length - 1];
			syllabus_course = item.filename.split('_')[1];
			suggest({
				filename:
					'VIT Downloads/Other Downloads/Syllabus/' +
					syllabus_course +
					file_extension,
			});
		}
	}
});

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

extApi.webRequest.onCompleted.addListener(
	async (details) => {
		let link = details['url'];
		time_last = new Date();
		set_time_last(time_last);
		if (link.indexOf('doStudentMarkView') !== -1) {
			returnMessage('mark_view_page');
		} else if (
			link.indexOf('processViewStudentAttendance') !== -1 ||
			link.indexOf('processBackAttendanceDetails') !== -1
		) {
			returnMessage('view_attendance');
		} else if (
			link.indexOf('menu.js') !== -1 ||
			link.indexOf('home') !== -1
		) {
			if (link.indexOf('menu.js') !== -1) await sleep(1500);
			returnMessage('nav_bar_change');
		} else if (link.indexOf('processViewStudentCourseDetail') !== -1) {
			returnMessage('course_page_change');
		} else if (link.indexOf('vtopcc.vit.ac.in/vtop/vtopLogin') !== -1) {
			returnMessage('vtopcc_captcha');
		} else if (
			link.indexOf('vtop/doLogin') !== -1 ||
			link.indexOf('assets/img/favicon.png') !== -1 ||
			link.indexOf('goHomePage') !== -1
		) {
			returnMessage('vtopcc_nav_bar');
		} else if (link.indexOf('doSearchExamScheduleForStudent') !== -1) {
			returnMessage('exam_schedule');
		} else if (link.indexOf('processViewTimeTable') !== -1) {
			returnMessage('time_table');
		}
	},
	{
		urls: [
			'*://vtop.vit.ac.in/*',
			'*://vtopcc.vit.ac.in/vtop/*',
			'*://vtop.vitbhopal.ac.in/vtop/*',
		],
	},
);

extApi.alarms.create({ periodInMinutes: 0.5 });
extApi.alarms.onAlarm.addListener(() => {
	let a;
	let time_nw = new Date();
});
