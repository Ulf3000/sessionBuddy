# sessionBuddy
simple session manager for firefox 100+ (tested on ff134)

![grafik](https://github.com/user-attachments/assets/85c3f8fc-0e96-444b-90fe-4abf9453ce72)




This add-on offers several features:

- It prevents lost sessions after a Firefox crash, which is infrequent but possible, by maintaining a backup of Firefox's restore point.
- It allows you to save, restore, and append browser sessions or individual windows through a user-friendly menu.
- It provides a convenient user interface for renaming and editing sessions.
- It keeps a history of recent sessions in a menu.
![grafik](https://github.com/user-attachments/assets/d336c49e-b2cf-4389-8b60-3e6035830d8a)

   

Why should you use this addon over some of the session managers in the addon store?

- It uses Firefox's internal session API, which handles everything from closed tabs, tab history, and crash restore and several other customvalues.
- That means after session restore with SessionBuddy, even the tab history and other tab data is restored 1:1.
- This also enables other userscripts and classic addons to attach and retrieve arbitrary data to tabbrowser tabs, and the sessionstore api will save and restore them accordingly.
- Of course, it's much faster, more CPU friendly, and less error prone than web extension API addons. In fact, I've been using this addon since 2018 without any error, and it restores 100s of tabs in a second.
--------
to be able to install you have to use this userchrome loader with legacy addon support in new firefox versions from xiaoxiaoflood (he's the userchrome god !) 
https://github.com/xiaoxiaoflood/firefox-scripts

--------

based on this userscript: 
https://github.com/Endor8/userChrome.js/blob/master/simplesessionmanager/SimpleSessionManager.uc.js
or
https://forum.mozilla-russia.org/viewtopic.php?id=57048
(i dont know the origin) 




