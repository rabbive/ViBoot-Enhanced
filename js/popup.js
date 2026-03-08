const extApi = typeof chrome !== 'undefined' ? chrome : browser;

const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo;

document.addEventListener('DOMContentLoaded', function () {
	const loginBtn = document.getElementById('login-btn');
	const logoutBtn = document.getElementById('logout-btn');
	const userInfo = document.getElementById('user-info');

	const versionElement = document.getElementById('extension-version');
	if (versionElement) {
		const manifestData = extApi.runtime.getManifest();
		versionElement.textContent = manifestData.version;
	}

	if (isFirefox) {
		extApi.storage.sync.set({ token: null });

		if (loginBtn) {
			loginBtn.style.display = 'none';
			loginBtn.disabled = true;
		}

		if (logoutBtn) {
			logoutBtn.style.display = 'none';
			logoutBtn.disabled = true;
		}

		if (userInfo) {
			userInfo.textContent =
				'Google Calendar sign-in is not available in Firefox.';
		}
	} else {
		extApi.storage.sync.get(['token'], (result) => {
			if (result.token) {
				if (loginBtn) loginBtn.style.display = 'none';
				if (logoutBtn) logoutBtn.style.display = 'inline-block';
				if (userInfo) userInfo.textContent = 'Signed in to Google Calendar.';
			} else {
				if (loginBtn) loginBtn.style.display = 'inline-block';
				if (logoutBtn) logoutBtn.style.display = 'none';
				if (userInfo) userInfo.textContent = '';
			}
		});

		if (loginBtn) {
			loginBtn.addEventListener('click', () => {
				extApi.runtime.sendMessage({ message: 'login' }, (response) => {
					if (response) {
						loginBtn.style.display = 'none';
						logoutBtn.style.display = 'inline-block';
						if (userInfo) userInfo.textContent = 'Signed in to Google Calendar.';
					}
				});
			});
		}

		if (logoutBtn) {
			logoutBtn.addEventListener('click', () => {
				extApi.runtime.sendMessage({ message: 'logout' });
				logoutBtn.style.display = 'none';
				loginBtn.style.display = 'inline-block';
				if (userInfo) userInfo.textContent = '';
			});
		}
	}
});
