const extApi = typeof chrome !== 'undefined' ? chrome : browser;

document.addEventListener('DOMContentLoaded', function () {
	const loginBtn = document.getElementById('login-btn');
	const logoutBtn = document.getElementById('logout-btn');
	const userInfo = document.getElementById('user-info');

	const versionElement = document.getElementById('extension-version');
	if (versionElement) {
		const manifestData = extApi.runtime.getManifest();
		versionElement.textContent = manifestData.version;
	}

	// Firefox-focused build: Google auth is intentionally disabled.
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
		userInfo.textContent = 'Google Calendar sign-in is disabled in Firefox.';
	}
});
