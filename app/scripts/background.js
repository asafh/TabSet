'use strict';

function MultiMap() { //Values and keys are string/integers
    var keyToValue = {};
    var valueToKeys = {};
    var map = this;
    this.set = function(key,val) {
        map.remove(key);

        keyToValue[key] = val;
        var keys = valueToKeys[val] = (valueToKeys[val] || []);
        keys.push(key);
    };
    this.remove = function(key) {
        if(!map.hasKey(key)) {
            return false;
        }

        var oldVal = keyToValue[key];
        delete keyToValue[key];
        var valKeys = valueToKeys[oldVal];
        var myIndex = valKeys.indexOf(key);
        valKeys.splice(myIndex,1);
        return true;
    };
    this.get = function(key) {
        return keyToValue[key];
    };
    this.getKeys = function(value) {
        return valueToKeys[value] || [];
    }
    this.hasKey = function(key) {
        return keyToValue.hasOwnProperty(key);
    };
}

var idToUrl = new MultiMap();

function newTab(tab) {
    if(tab.url && tab.url.indexOf("http") ===0) {
        idToUrl.set(tab.id, tab.url);
        var tabs = idToUrl.getKeys(tab.url);
        if(tabs.length > 1) {
            tabs.forEach(function(tabId) {
                chrome.pageAction.setTitle({tabId: tabId, title: "In "+ tabs.length + " tabs"});
                chrome.pageAction.show(tabId);
            });
        }
    }
}
function removeTab(id) {
    var url = idToUrl.get(id);
    idToUrl.remove(id);
    chrome.pageAction.hide(id);

    var others = idToUrl.getKeys(url);
    if(others.length === 1) {
        chrome.pageAction.hide(others[0]);
    }
}

chrome.tabs.query({}, function(tabs) {
    tabs.forEach(newTab);

    chrome.tabs.onCreated.addListener(newTab);
    chrome.tabs.onRemoved.addListener(removeTab);
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if(changeInfo.url) {
            removeTab(tab.id);
            newTab(tab);
        }
    });

    chrome.pageAction.onClicked.addListener(function(tab) {
        var tabs = idToUrl.getKeys(tab.url);
        var index = tabs.indexOf(tab.id);
        index += 1;
        var next = tabs[index % tabs.length];
        chrome.tabs.update(next,{active:true});
        chrome.tabs.get(next, function(tab) {
            chrome.windows.update(tab.windowId, {focused:true});
        });
    });
});