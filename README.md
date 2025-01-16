# sessionBuddy
simple session manager for firefox 100+ (tested on ff134)

![grafik](https://github.com/user-attachments/assets/85c3f8fc-0e96-444b-90fe-4abf9453ce72)




This addon does a few things: 

- circumvents lost session after a firefox crash, whcih happens very rarely but happens. It keeps a backup of firefox's own restore point. 
- lets you save, restore and append the browser session or individual browser windows in nice menu 
- lets you rename and edit sessions in a convinient ui
- keeps a history of recent sessions in a menu

![grafik](https://github.com/user-attachments/assets/d336c49e-b2cf-4389-8b60-3e6035830d8a)

   

Why should you use this addon over some of the session managers in the addon store ?

- it uses firefox`s internal session api which handles everything from closed tabs, tab history and crash restore
- that means after session restore with sessionbuddy even the tabhistory and other tab data is restored 1:1
- this also enables other userscripts and classic addons to attach and retrieve abritrary data to tabbrowser tabs and sessionstore will
  save and load them accordingly
- of course its much faster and more cpu friendly and less error prone than webextension api addons, in fact ive been using this addon since 2018 without any error and it restores 100s of tabs in mere seconds 

--------
to be able to install you have to use this userchrome loader with legacy addon support in new firefox versions from xiaoxiaoflood
https://github.com/xiaoxiaoflood/firefox-scripts

--------

based on this userscript: 
https://github.com/Endor8/userChrome.js/blob/master/simplesessionmanager/SimpleSessionManager.uc.js
or
https://forum.mozilla-russia.org/viewtopic.php?id=57048
(i dont know the origin) 




