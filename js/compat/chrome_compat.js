(() => {
	if (typeof globalThis.chrome !== 'undefined') return;
	if (typeof globalThis.browser === 'undefined') return;

	const toCallback = (promise, callback) => {
		if (typeof callback === 'function') {
			promise.then((result) => callback(result)).catch(() => callback());
			return;
		}
		return promise;
	};

	const wrapEvent = (eventObject) => {
		if (!eventObject || typeof eventObject.addListener !== 'function') {
			return {
				addListener: () => {},
				removeListener: () => {},
				hasListener: () => false,
			};
		}
		return eventObject;
	};

	globalThis.chrome = {
		runtime: {
			getManifest: () => globalThis.browser.runtime.getManifest(),
			sendMessage: (message, callback) =>
				toCallback(globalThis.browser.runtime.sendMessage(message), callback),
			onMessage: wrapEvent(globalThis.browser.runtime.onMessage),
		},
		storage: {
			sync: {
				get: (keys, callback) =>
					toCallback(globalThis.browser.storage.sync.get(keys), callback),
				set: (items, callback) =>
					toCallback(globalThis.browser.storage.sync.set(items), callback),
			},
		},
		tabs: {
			query: (queryInfo, callback) =>
				toCallback(globalThis.browser.tabs.query(queryInfo), callback),
			sendMessage: (tabId, message, callback) =>
				toCallback(
					globalThis.browser.tabs.sendMessage(tabId, message),
					callback,
				),
		},
		downloads: {
			download: (downloadOptions, callback) =>
				toCallback(
					globalThis.browser.downloads.download(downloadOptions),
					callback,
				),
			onDeterminingFilename: wrapEvent(
				globalThis.browser.downloads &&
					globalThis.browser.downloads.onDeterminingFilename,
			),
		},
		webRequest: {
			onCompleted: wrapEvent(
				globalThis.browser.webRequest &&
					globalThis.browser.webRequest.onCompleted,
			),
		},
		alarms: {
			create: (...args) => {
				if (
					globalThis.browser.alarms &&
					typeof globalThis.browser.alarms.create === 'function'
				) {
					return globalThis.browser.alarms.create(...args);
				}
				return undefined;
			},
			onAlarm: wrapEvent(
				globalThis.browser.alarms && globalThis.browser.alarms.onAlarm,
			),
		},
		notifications: {
			create: (notificationId, options, callback) =>
				toCallback(
					globalThis.browser.notifications.create(notificationId, options),
					callback,
				),
		},
	};
})();
