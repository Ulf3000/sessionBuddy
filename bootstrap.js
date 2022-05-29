const Ci = Components.interfaces;
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource:///modules/sessionstore/SessionStore.jsm");
Components.utils.import("resource://gre/modules/osfile.jsm");

let sessionsDataBase = {};
sessionsDataBase.backupedSessions = [];
sessionsDataBase.savedSessions = [];

// ------------------------SETUP FOLDERS------------------------
let profDir = OS.Constants.Path.profileDir;
let origSS = OS.Path.join(profDir, "sessionstore.jsonlz4");
let sessionBuddyDir = OS.Path.join(profDir, "sessionBuddy");
let sessionDir = OS.Path.join(sessionBuddyDir, "savedSessions");
let sessionsDataBaseFile = OS.Path.join(sessionBuddyDir, "sessionBuddyDataBase.json");
let backupSessionsDir = OS.Path.join(sessionBuddyDir, "backupSessions");
let recoveryDir = OS.Path.join(profDir, "sessionstore-backups");
let recoveryFile = OS.Path.join(recoveryDir, "recovery.jsonlz4");

let failStateFile = OS.Path.join(sessionBuddyDir, "failStateFile.json");

var WindowListener = {
	setupBrowserUI: function (window) {

		// Take any steps to add UI or anything to the browser window
		// document.getElementById() etc. will work here
	},

	tearDownBrowserUI: function (window) {
		let document = window.document;

		// Take any steps to remove UI or anything from the browser window
		// document.getElementById() etc. will work here
	},

	// nsIWindowMediatorListener functions
	onOpenWindow: function (xulWindow) {
		console.log(xulWindow);

		// A new window has opened
		let domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor)
			.getInterface(Ci.nsIDOMWindow);

		// Wait for it to finish loading
		domWindow.addEventListener("load", function listener() {
			domWindow.removeEventListener("load", listener, false);
			console.log("HHHHHHHHHHHHHHHHH");

			// If this is a browser window then setup its UI
			if (domWindow.document.documentElement.getAttribute("windowtype") == "navigator:browser")
				//WindowListener.setupBrowserUI(domWindow);
				if (domWindow.PrivateBrowsingUtils.isWindowPrivate(domWindow) == true)
					return;
			Services.obs.addObserver(function observe_BrowserWindow_startup(win, topic) {
				if (win != domWindow) {
					return;
				}
				console.log("browser-delayed-startup-finished");
				Services.obs.removeObserver(observe_BrowserWindow_startup, topic);
				makeMenu(domWindow);
			}, "browser-delayed-startup-finished");
		}, false);
	},

	onCloseWindow: function (xulWindow) { },

	onWindowTitleChange: function (xulWindow, newTitle) { }
};

var newBackupData;

async function startup(data, reason) {


	hhhObserver = {
		observe: async function (aSubject, aTopic, aData) {
			// alreadyRestored = false;
			// windowRestoreSessionManager();
			console.log("quit-application-requested");
			console.log(aSubject);
			console.log(aData);
			console.log(aTopic);


			let ssdata = SessionStore.getBrowserState();
			await OS.File.writeAtomic(failStateFile, ssdata, {
				encoding: "utf-8"
			});
		}
	}
	Services.obs.addObserver(hhhObserver, "quit-application", false);


	xxObserver = {
		observe: async function (aSubject, aTopic, aData) {
			// alreadyRestored = false;
			// windowRestoreSessionManager();
			console.log("quit-application-requested");
			console.log(aSubject);
			console.log(aData);
			console.log(aTopic);


			let ssdata = SessionStore.getBrowserState();
			await OS.File.writeAtomic(failStateFile, ssdata, {
				encoding: "utf-8"
			});
		}
	}
	Services.obs.addObserver(xxObserver, "browser-delayed-startup-finished", false);


	// SETUP FOLDERS
	let SBDDExists = await OS.File.exists(sessionBuddyDir);
	if (!SBDDExists) {
		await OS.File.makeDir(sessionBuddyDir);
	};
	let SDExists = await OS.File.exists(sessionDir);
	if (!SDExists) {
		await OS.File.makeDir(sessionDir);
	};
	let SBExists = await OS.File.exists(backupSessionsDir);
	if (!SBExists) {
		await OS.File.makeDir(backupSessionsDir);
	};

	// SETUP DATABASE
	let SBDBFExists = await OS.File.exists(sessionsDataBaseFile);
	if (!SBDBFExists) {
		await OS.File.writeAtomic(sessionsDataBaseFile, JSON.stringify(sessionsDataBase), {
			encoding: "utf-8"
		});
	} else {
		let sessionsDataBaseString = await OS.File.read(sessionsDataBaseFile, {
			encoding: "utf-8"
		});
		sessionsDataBase = JSON.parse(sessionsDataBaseString);
	}


	// SETUP MOST RECENT BACKUP SESSION
	let timeStamp = new Date().getTime();
	let name = "backup_" + timeStamp;
	let newBackupFile = OS.Path.join(backupSessionsDir, name);

	// let failStateExists = await OS.File.exists(failStateFile);
	// let origSSExists = await OS.File.exists(origSS);
	console.log("1 origSS");
	try {

		newBackupData = await OS.File.read(origSS, {
			encoding: "utf-8",
			compression: "lz4"
		});
	} catch (err) {
		console.log("2 recoveryFile");
		try {
			newBackupData = await OS.File.read(recoveryFile, {
				encoding: "utf-8",
				compression: "lz4"
			});
		} catch (err) {
			console.log("3 failStateFile");
			newBackupData = await OS.File.read(failStateFile, {
				encoding: "utf-8"
			});
		}
	}


	/* 	if (!origSSExists) {
			console.log("origSSexists = DOOESNNNNTTTT NOOO !!!!!!");
			newBackupData = await OS.File.read(recoveryFile, {
				encoding: "utf-8",
				compression: "lz4"
			});
		} else {
			newBackupData = await OS.File.read(origSS, {
				encoding: "utf-8",
				compression: "lz4"
			});
		}
	 */


	let xxx = JSON.parse(newBackupData);
	let tabCount = 0;
	for (let window of xxx.windows) {
		tabCount += window.tabs.length;
	}
	let entry = {};
	entry.name = name;
	entry.count = "(" + xxx.windows.length + "/" + tabCount + ")";
	entry.date = new Date(xxx.session.lastUpdate).toLocaleString();
	sessionsDataBase.backupedSessions.push(entry);

	OS.File.writeAtomic(newBackupFile, newBackupData, {
		encoding: "utf-8"
	});

	if (sessionsDataBase.backupedSessions.length >= 21) {
		let pathToRemove = OS.Path.join(backupSessionsDir, sessionsDataBase.backupedSessions[0].name);
		sessionsDataBase.backupedSessions.splice(0, 1);
		OS.File.remove(pathToRemove);
	}
	OS.File.writeAtomic(sessionsDataBaseFile, JSON.stringify(sessionsDataBase), {
		encoding: "utf-8"
	});

	// ---------- START UP --------------
	let enumerator = Services.wm.getEnumerator("navigator:browser");
	while (enumerator.hasMoreElements()) {
		let win = enumerator.getNext();
		if (win.PrivateBrowsingUtils.isWindowPrivate(win) == false)
			makeMenu(win);
	};
	Services.wm.addListener(WindowListener);

}

function shutdown(data, reason) {
	// When the application is shutting down we normally don't have to clean
	// up any UI changes made
	if (reason == APP_SHUTDOWN)
		return;

	// Get the list of browser windows already open
	let enumerator = Services.wm.getEnumerator("navigator:browser");
	while (enumerator.hasMoreElements()) {
		let win = enumerator.getNext();
		let SessionBuddyMenu = win.document.getElementById("SessionBuddyMenu");
		SessionBuddyMenu.innerHTML = "";
		SessionBuddyMenu.parentElement.removeChild(SessionBuddyMenu);

		//WindowListener.tearDownBrowserUI(domWindow);


	}

	// Stop listening for any new browser windows to open
	Services.wm.removeListener(WindowListener);
}

// ------------------------SAVE SESSIONS------------------------
function saveSession(ssdata) {
	let xxx = JSON.parse(ssdata);
	// refuse if private session
	if (xxx.windows.length == 1 && xxx.windows[0].hasOwnProperty('isPrivate')) {
		Services.wm.getMostRecentWindow("navigator:browser").alert("Session is PRIVATE! CANNOT be saved")
		return;
	}
	// splice private windows
	let yyy = [];
	for (let entry of xxx.windows) {
		if (entry.hasOwnProperty('isPrivate') == false) {
			yyy.push(entry);
		}
	}
	xxx.windows = yyy;
	// prompt
	let nDate = new Date().toLocaleString("de-DE");
	let name = Services.wm.getMostRecentWindow("navigator:browser").prompt("Save As...  disallowed characters \ / : * \" < > | ?", nDate);
	if (!name)
		return;
	name = name.replace(/[\\/:*"<>|?]/g, " ").trim();
	for (let entry of sessionsDataBase.savedSessions) {
		if (entry.name == name) {
			Services.wm.getMostRecentWindow("navigator:browser").alert("Session with the same name already exists.");
			return saveSession(ssdata);
		}
	}
	let newFile = OS.Path.join(sessionDir, name);
	OS.File.writeAtomic(newFile, JSON.stringify(xxx), {
		encoding: "utf-8"
	});

	// count tabs and windows in session
	let tabCount = 0;
	for (let window of xxx.windows) {
		tabCount += window.tabs.length;
	}
	let count = "(" + xxx.windows.length + "/" + tabCount + ")";
	// create new database entry
	let entry = {};
	entry.name = name;
	entry.count = count;
	sessionsDataBase.savedSessions.push(entry);
	OS.File.writeAtomic(sessionsDataBaseFile, JSON.stringify(sessionsDataBase), {
		encoding: "utf-8"
	});
	// update ui
	let enumerator = Services.wm.getEnumerator("navigator:browser");
	while (enumerator.hasMoreElements()) {
		let win = enumerator.getNext();
		if (win.PrivateBrowsingUtils.isWindowPrivate(win) == false)
			makeitems(newFile, name, count, win);
	}

}

function saveCurrentSession() {
	let ssdata = SessionStore.getBrowserState();
	saveSession(ssdata);
}

function saveCurrentWindowSession() {
	let ssdata = SessionStore.getWindowState(Services.wm.getMostRecentWindow("navigator:browser"));
	saveSession(ssdata);

}

// ------------------------RESTORE SESSIONS----------------------------------------------

async function restoreSession(e) {
	console.log(e.target);
	let sessionValue = await OS.File.read(e.target.fileName, {
		encoding: "utf-8"
	});

	if (e.target.restoreType == 2) { // restore Session
		SessionStore.setBrowserState(sessionValue);
		return;
	};

	if (e.target.restoreType == 3) { // append Session
		let top = Services.wm.getMostRecentWindow("navigator:browser");
		let newWindow = top.openDialog(top.location, "_blank", "chrome,dialog=no,all");
		Services.obs.addObserver(function observe_sessionBuddy_restoretype3(win, topic) {
			if (win != newWindow) {
				return;
			}
			Services.obs.removeObserver(observe_sessionBuddy_restoretype3, topic);
			SessionStore.setWindowState(newWindow, sessionValue, true);
		}, "browser-delayed-startup-finished");
	}
};

async function restoreBackupSession() {

	SessionStore.setBrowserState(newBackupData);
}

async function restoreSessionSelectively(e) {
	let sessionValue = await OS.File.read(e.target.fileName, {
		encoding: "utf-8"
	});
	let gBrowser = Services.wm.getMostRecentWindow("navigator:browser").gBrowser;
	let newTab = gBrowser.addTab("chrome://sessionBuddy/content/restoreSession.xhtml", {
		triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
	});
	let newTabBrowser = gBrowser.getBrowserForTab(newTab);
	newTabBrowser.addEventListener("load", function () {
		let cDoc = newTabBrowser.contentDocument;
		let restoreButton = cDoc.getElementById("restoreButton");
		restoreButton.removeAttribute("disabled");
		let appendButton = cDoc.getElementById("appendButton");
		appendButton.removeAttribute("disabled");
		//console.log(cDoc);
		let sessionData = cDoc.getElementById("sessionData");
		console.log(sessionData);
		sessionData.value = sessionValue;
	}, true);
	gBrowser.selectedTab = newTab;
}

// -----------------------EDIT SESSIONS------------------------------


async function remove(e) {
	let cf = Services.wm.getMostRecentWindow("navigator:browser").confirm("Are you sure you want to delete " + e.target.name + " ?");
	if (cf == true) {
		let enumerator = Services.wm.getEnumerator("navigator:browser");
		while (enumerator.hasMoreElements()) {
			let win = enumerator.getNext();
			if (win.PrivateBrowsingUtils.isWindowPrivate(win) == false) {

				let subMenu = win.document.querySelector('*[label="' + e.target.name + ' ' + e.target.count + '"]');
				//subMenu.innerHTML = "";
				//subMenu.parentElement.hidePopup();
				console.log(subMenu);
				console.log(subMenu.parentElement);
				//subMenu.remove();
				//win.document.getElementById('SessionBuddyMenu').click();
				//win.document.getElementById('SessionBuddyMenu').contextmenu();
				//subMenu.parentElement.removeChild(subMenu);
			}
		}
		let i = 0;
		for (let entry of sessionsDataBase.savedSessions) {
			if (entry.name == e.target.name)
				sessionsDataBase.savedSessions.splice(i, 1);
			i++;
		}
		OS.File.remove(e.target.fileName);
		OS.File.writeAtomic(sessionsDataBaseFile, JSON.stringify(sessionsDataBase), {
			encoding: "utf-8"
		});
		let enumerator2 = Services.wm.getEnumerator("navigator:browser");
		while (enumerator2.hasMoreElements()) {
			let win = enumerator2.getNext();
			let SessionBuddyMenu = win.document.getElementById("SessionBuddyMenu");
			SessionBuddyMenu.innerHTML = "";
			SessionBuddyMenu.parentElement.removeChild(SessionBuddyMenu);
			makeMenu(win);
			//WindowListener.tearDownBrowserUI(domWindow);


		}
		
	}
}

async function rename(e) {
	let oldName = e.target.name;
	let oldFileName = e.target.fileName;
	let count = e.target.count;
	let newName = Services.wm.getMostRecentWindow("navigator:browser").prompt("Rename Session: " + oldName + "   disallowed characters \ / : * \" < > | ?", oldName);
	if (!newName)
		return rename(e);
	newName = newName.replace(/[\\/:*"<>|?]/g, " ").trim();
	for (let entry of sessionsDataBase.savedSessions) {
		if (entry.name == newName) {
			Services.wm.getMostRecentWindow("navigator:browser").alert("Session with the same name already exists")
			return rename(e);
		}
	}
	let newFileName = OS.Path.join(sessionDir, newName);

	let i = 0;
	for (let entry of sessionsDataBase.savedSessions) {
		if (entry.name == oldName) {
			//console.log(session);
			sessionsDataBase.savedSessions[i].name = newName;
			console.log(sessionsDataBase.savedSessions[i]);
		}
		i++;
	}
	OS.File.copy(oldFileName, newFileName);
	

	OS.File.writeAtomic(sessionsDataBaseFile, JSON.stringify(sessionsDataBase), {
		encoding: "utf-8"
	});
	OS.File.remove(oldFileName);
	let enumerator2 = Services.wm.getEnumerator("navigator:browser");
	while (enumerator2.hasMoreElements()) {
		let win = enumerator2.getNext();
		let SessionBuddyMenu = win.document.getElementById("SessionBuddyMenu");
		SessionBuddyMenu.innerHTML = "";
		SessionBuddyMenu.parentElement.removeChild(SessionBuddyMenu);
		makeMenu(win);
	}
}

async function editSession(e) {
	let sessionValue = await OS.File.read(e.target.fileName, {
		encoding: "utf-8"
	});
	let gBrowser = Services.wm.getMostRecentWindow("navigator:browser").gBrowser;
	let newTab = gBrowser.addTab("chrome://sessionBuddy/content/editSession.xhtml", {
		triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
	});
	let newTabBrowser = gBrowser.getBrowserForTab(newTab);
	newTabBrowser.addEventListener("load", function () {
		let cDoc = newTabBrowser.contentDocument;
		console.log(cDoc);
		let sessionData = cDoc.getElementById("sessionData");
		sessionData.value = sessionValue;
		let name = e.target.name;
		let oldCount = e.target.count;
		let filename = e.target.fileName;
		let saveButton = cDoc.getElementById("saveButton");
		saveButton.removeAttribute("disabled");
		let command = "saveSession(" + "'" + name + "'" + ");";
		saveButton.setAttribute("oncommand", command);
		let stateStringContainer = cDoc.getElementById("stateStringContainer");


		stateStringContainer.addEventListener("DOMAttrModified", function () {
			this.removeEventListener('DOMAttrModified', arguments.callee, false);
			let stateString = decodeURIComponent(stateStringContainer.getAttribute("stateString"));
			console.log(stateString);

			let xxx = JSON.parse(stateString);
			let tabCount = 0;
			for (let window of xxx.windows) {
				tabCount += window.tabs.length;
			}
			let count = "(" + xxx.windows.length + "/" + tabCount + ")";

			let i = 0;
			for (let entry of sessionsDataBase.savedSessions) {
				if (entry.name == name) {
					sessionsDataBase.savedSessions[i].count = count;
				}
				i++;
			}
			OS.File.writeAtomic(sessionsDataBaseFile, JSON.stringify(sessionsDataBase), {
				encoding: "utf-8"
			});

			OS.File.writeAtomic(filename, JSON.stringify(xxx), {
				encoding: "utf-8"
			});
			let enumerator2 = Services.wm.getEnumerator("navigator:browser");
			while (enumerator2.hasMoreElements()) {
				let win = enumerator2.getNext();
				let SessionBuddyMenu = win.document.getElementById("SessionBuddyMenu");
				SessionBuddyMenu.innerHTML = "";
				SessionBuddyMenu.parentElement.removeChild(SessionBuddyMenu);
				makeMenu(win);
			}

			
		}, false);
	}, true);
	gBrowser.selectedTab = newTab;
}

//----------------------------SETUP UI -----------------------------------

function elBuilder(doc, tag, props) {
	let el = doc.createXULElement(tag);
	for (let p in props) {
		el.setAttribute(p, props[p]);
	}
	return el;
}

async function makeMenu(win) {



	let document = win.document;

	let mainMenubar = document.getElementById("main-menubar");
	let histMenu = document.getElementById("historyMenuPopup");

	let SM_menu = document.createXULElement("menu");
	SM_menu.setAttribute("label", "SessionBuddy");
	SM_menu.setAttribute("id", "SessionBuddyMenu");
	SM_menu.setAttribute("popup", "SessionBuddyPopup");

	let menupopup = document.createXULElement("menupopup");
	menupopup.setAttribute("class", "menupopup");
	menupopup.setAttribute("id", "SessionBuddyPopup");

	//let mg = menupopup.appendChild(document.createXULElement('menugroup'));
	//mg.setAttribute('id', 'sb-menugroup');
	//mg.style.display = "inline";
	//mg.style.height ="fit-content";


	let scs = document.createXULElement("menuitem");
	scs.setAttribute("label", "Save Session");
	scs.setAttribute("class", "menuitem");
	scs.addEventListener("command", saveCurrentSession, false);
	menupopup.appendChild(scs);



	let scws = document.createXULElement("menuitem");
	scws.setAttribute("label", "Save this window");
	scws.setAttribute("class", "menuitem");
	scws.addEventListener("command", saveCurrentWindowSession, false);
	menupopup.appendChild(scws);

	let restBack = document.createXULElement("menuitem");
	restBack.setAttribute("label", "Restore Previous Session");
	restBack.setAttribute("class", "menuitem");
	restBack.addEventListener("command", restoreBackupSession, false);
	menupopup.appendChild(restBack);


	let prevSessions = document.createXULElement("menu");
	let prevSessionsP = document.createXULElement("menupopup");
	prevSessions.setAttribute("label", "Backup Sessions");
	prevSessions.setAttribute("id", "prevSessions");
	prevSessions.setAttribute("class", "menu");
	prevSessions.appendChild(prevSessionsP);
	menupopup.appendChild(prevSessions);

	let menusep = document.createXULElement("menuseparator");
	menupopup.appendChild(menusep);

	SM_menu.appendChild(menupopup);
	//win.document.insertBefore(win.document.getElementById("menu_showAllHistory"), SM_menu);//taskPopup
	mainMenubar.appendChild(SM_menu);
	//histMenu.appendChild(SM_menu);

	console.log(SM_menu);


	for (let entry of sessionsDataBase.savedSessions) {
		makeitems(OS.Path.join(sessionDir, entry.name), entry.name, entry.count, win);
	};
	for (let entry of sessionsDataBase.backupedSessions) {
		let newItem = makeitems2(OS.Path.join(backupSessionsDir, entry.name), entry.date + " " + entry.count, entry.count, win);
		prevSessionsP.appendChild(newItem);
	};



}

function makeitems2(fileName, name, count, win) {

	let ss_menu = win.document.createXULElement("menu");
	let ss_popup = win.document.createXULElement("menupopup");

	ss_menu.setAttribute("label", name);
	ss_menu.setAttribute("class", "Backup_Sessions");

	let rs2 = win.document.createXULElement("menuitem");
	rs2.setAttribute("label", "Restore Session");
	rs2.name = name;
	rs2.restoreType = 2;
	rs2.fileName = fileName;
	rs2.addEventListener("command", restoreSession, false);

	let rs3 = win.document.createXULElement("menuitem");
	rs3.setAttribute("label", "Append Session");
	rs3.name = name;
	rs3.restoreType = 3;
	rs3.fileName = fileName;
	rs3.addEventListener("command", restoreSession, false);

	let rss = win.document.createXULElement("menuitem");
	rss.setAttribute("label", "restoreSessionSelectively");
	rss.name = name;
	rss.fileName = fileName;
	rss.addEventListener("command", restoreSessionSelectively, false);



	ss_popup.appendChild(rs2);
	ss_popup.appendChild(rs3);
	ss_popup.appendChild(rss);
	ss_menu.appendChild(ss_popup);
	//win.document.getElementById("prevSessions").firstChild.appendChild(ss_menu);

	return ss_menu;
}

function makeitems(fileName, name, count, win) {

	let ss_menu = win.document.createXULElement("menu");
	let ss_popup = win.document.createXULElement("menupopup");

	ss_menu.setAttribute("label", name + " " + count);
	ss_menu.setAttribute("class", "saved_session");

	//ss_popup.setAttribute("class", "menupopup");


	let rs2 = win.document.createXULElement("menuitem");
	rs2.setAttribute("label", "Restore Session");
	rs2.name = name;
	rs2.count = count;
	rs2.fileName = fileName;
	rs2.restoreType = 2;
	rs2.addEventListener("command", restoreSession, false);

	let rs3 = win.document.createXULElement("menuitem");
	rs3.setAttribute("label", "Append Session");
	rs3.name = name;
	rs3.count = count;
	rs3.fileName = fileName;
	rs3.restoreType = 3;
	rs3.addEventListener("command", restoreSession, false);

	let rss = win.document.createXULElement("menuitem");
	rss.setAttribute("label", "restoreSessionSelectively");
	rss.name = name;
	rss.count = count;
	rss.fileName = fileName;
	rss.addEventListener("command", restoreSessionSelectively, false)

	let re = win.document.createXULElement("menuitem");
	re.setAttribute("label", "Edit");
	re.name = name;
	re.count = count;
	re.fileName = fileName;
	re.addEventListener("command", editSession, false);

	let rn = win.document.createXULElement("menuitem");
	rn.setAttribute("label", "Rename");
	rn.name = name;
	rn.count = count;
	rn.fileName = fileName;
	rn.addEventListener("command", rename, false);

	let rm = win.document.createXULElement("menuitem");
	rm.setAttribute("label", "Remove");
	rm.name = name;
	rm.count = count;
	rm.fileName = fileName;
	rm.addEventListener("command", remove, false);

	ss_popup.appendChild(rs2);
	ss_popup.appendChild(rs3);
	ss_popup.appendChild(rss);
	ss_popup.appendChild(re);
	ss_popup.appendChild(rn);
	ss_popup.appendChild(rm);
	ss_menu.appendChild(ss_popup);
	win.document.getElementById("SessionBuddyPopup").appendChild(ss_menu);
}
