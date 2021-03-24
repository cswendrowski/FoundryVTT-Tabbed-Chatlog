(() => {
})();

const CHAT_MESSAGE_TYPES = {
    OTHER: 0,
    OOC: 1,
    IC: 2,
    EMOTE: 3,
    WHISPER: 4,
    ROLL: 5
};

let currentTab = "ic";
let salonEnabled = false;
let turndown = undefined;

function isMessageTypeVisible(messageType) {

    if (salonEnabled) {
        switch (messageType) {
            case CHAT_MESSAGE_TYPES.OTHER:
                messageType = CHAT_MESSAGE_TYPES.IC;
                break;
            case CHAT_MESSAGE_TYPES.WHISPER:
                return false;
        }
    }
    switch (currentTab) {
        case "rolls":
            switch (messageType) {
                case CHAT_MESSAGE_TYPES.OTHER:
                    return true;
                case CHAT_MESSAGE_TYPES.OOC:
                    return false;
                case CHAT_MESSAGE_TYPES.IC:
                    return false
                case CHAT_MESSAGE_TYPES.EMOTE:
                    return false
                case CHAT_MESSAGE_TYPES.WHISPER:
                    return false;
                case CHAT_MESSAGE_TYPES.ROLL:
                    return true;
            }
            break;
        case "ic":
            switch (messageType) {
                case CHAT_MESSAGE_TYPES.OTHER:
                    return false;
                case CHAT_MESSAGE_TYPES.OOC:
                    return false;
                case CHAT_MESSAGE_TYPES.IC:
                    return true;
                case CHAT_MESSAGE_TYPES.EMOTE:
                    return true;
                case CHAT_MESSAGE_TYPES.WHISPER:
                    return game.settings.get("tabbed-chatlog", "icWhispers");
                case CHAT_MESSAGE_TYPES.ROLL:
                    return false;
            }
            break;
        case "ooc":
            switch (messageType) {
                case CHAT_MESSAGE_TYPES.OTHER:
                    return false;
                case CHAT_MESSAGE_TYPES.OOC:
                    return true;
                case CHAT_MESSAGE_TYPES.IC:
                    return false;
                case CHAT_MESSAGE_TYPES.EMOTE:
                    return false;
                case CHAT_MESSAGE_TYPES.WHISPER:
                    return !game.settings.get("tabbed-chatlog", "icWhispers");
                case CHAT_MESSAGE_TYPES.ROLL:
                    return false;
            }
            break;
        default:
            console.log("Unknown tab " + tab + "!");
    }
    return true; // if there is some future new message type, its probably better to default to be visible than to hide it.
}


function isMessageVisible(e) {
    const messageType = e.data.type;

    if (!isMessageTypeVisible(messageType)) return false;

    if (e.data.speaker.scene && game.settings.get("tabbed-chatlog", "perScene")) {
        if ((messageType == CHAT_MESSAGE_TYPES.IC || messageType == CHAT_MESSAGE_TYPES.EMOTE) && (e.data.speaker.scene != game.user.viewedScene)) return false;
    }

    if (e.data.blind && e.data.whisper.find(element => element == game.userId) == undefined) return false;

    return true;
}


function setClassVisibility(cssClass, visible) {
    if (visible) {
        cssClass.removeClass("hardHide");
        cssClass.show();
    } else
        cssClass.hide();
};

Hooks.on("renderChatLog", async function (chatLog, html, user) {

    if (shouldHideDueToStreamView()) return;

    let toPrepend = '<nav class="tabbedchatlog tabs">';
    toPrepend += `<a class="item ic" data-tab="ic">${game.i18n.localize("TC.TABS.IC")}</a><i id="icNotification" class="notification-pip fas fa-exclamation-circle" style="display: none;"></i>`;
    toPrepend += `<a class="item rolls" data-tab="rolls">${game.i18n.localize("TC.TABS.Rolls")}</a><i id="rollsNotification" class="notification-pip fas fa-exclamation-circle" style="display: none;"></i>`;
    toPrepend += `<a class="item ooc" data-tab="ooc">${game.i18n.localize("TC.TABS.OOC")}</a></nav><i id="oocNotification" class="notification-pip fas fa-exclamation-circle" style="display: none;"></i>`;
    html.prepend(toPrepend);

    window.game.tabbedchat = {};

    window.game.tabbedchat.tabs = new TabsV2({
        navSelector: ".tabs",
        contentSelector: ".content",
        initial: "tab1",
        callback: function (event, html, tab) {
            currentTab = tab;

            switch (tab) {
                case "rolls":
                case "ic":
                case "ooc":

                    setClassVisibility($(".type0"), isMessageTypeVisible(CHAT_MESSAGE_TYPES.OTHER));
                    setClassVisibility($(".type1"), isMessageTypeVisible(CHAT_MESSAGE_TYPES.OOC));
                    setClassVisibility($(".type2").filter(".scenespecific"), false);
                    setClassVisibility($(".type2").not(".scenespecific"), isMessageTypeVisible(CHAT_MESSAGE_TYPES.IC));
                    setClassVisibility($(".type2").filter(".scene" + game.user.viewedScene), isMessageTypeVisible(CHAT_MESSAGE_TYPES.IC));
                    setClassVisibility($(".type3").filter(".scenespecific"), false);
                    setClassVisibility($(".type3").not(".scenespecific"), isMessageTypeVisible(CHAT_MESSAGE_TYPES.EMOTE));
                    setClassVisibility($(".type3").filter(".scene" + game.user.viewedScene), isMessageTypeVisible(CHAT_MESSAGE_TYPES.EMOTE));
                    setClassVisibility($(".type4"), isMessageTypeVisible(CHAT_MESSAGE_TYPES.WHISPER));
                    setClassVisibility($(".type5").filter(".gm-roll-hidden"), false);
                    setClassVisibility($(".type5").not(".gm-roll-hidden"), isMessageTypeVisible(CHAT_MESSAGE_TYPES.ROLL));

                    $("#" + tab + "Notification").hide();
                    break;
                default:
                    console.log("Unknown tab " + tab + "!");
            }

            $("#chat-log").scrollTop(9999999);
        }
    });
    window.game.tabbedchat.tabs.bind(html[0]);

    $("[data-tab=\"chat\"]").click(() => {
        setTimeout(() => $(".item." + currentTab).addClass("active"), 100);
    });
});

Hooks.on("renderChatMessage", (chatMessage, html, data) => {

    if (shouldHideDueToStreamView()) return;

    html.addClass("type" + data.message.type);

    var sceneMatches = true;

    if (data.message.type == 0 || data.message.type == 2 || data.message.type == 3 || data.message.type == 5) {
        if (data.message.speaker.scene != undefined && game.settings.get("tabbed-chatlog", "perScene")) {
            html.addClass("scenespecific");
            html.addClass("scene" + data.message.speaker.scene);
            if (data.message.speaker.scene != game.user?.viewedScene) {
                sceneMatches = false;
            }
        }
    }

    if (salonEnabled && chatMessage.data.type == 5) {
        if (!html.hasClass('gm-roll-hidden')) {
            html.css("display", "list-item");
        }
        return;
    }

    if (salonEnabled && chatMessage.data.type == 4) return;

    if (currentTab == "rolls") {
        if (chatMessage.data.type == 0 && sceneMatches) {
            html.css("display", "list-item");
        } else if (data.message.type == 5 && sceneMatches) {
            if (!html.hasClass('gm-roll-hidden')) {
                html.css("display", "list-item");
            }
        } else {
            html.css("display", "none");
        }
    } else if (currentTab == "ic") {
        if ((data.message.type == 2 || data.message.type == 3 || (data.message.type == 4 && game.settings.get("tabbed-chatlog", "icWhispers"))) && sceneMatches) {
            html.css("display", "list-item");
        } else {
            html.css("cssText", "display: none !important;");
            html.addClass("hardHide");
        }
    } else if (currentTab == "ooc") {
        if (data.message.type == 1 || (data.message.type == 4 && !game.settings.get("tabbed-chatlog", "icWhispers"))) {
            html.css("display", "list-item");
        } else {
            html.css("display", "none");
        }
    }
});

Hooks.on("diceSoNiceRollComplete", (id) => {
    if (currentTab != "rolls") {
        $("#chat-log .message[data-message-id=" + id + "]").css("display", "none");
    }
});

Hooks.on("createChatMessage", (chatMessage, content) => {
    var sceneMatches = true;

    if (chatMessage.data.speaker.scene) {
        if (chatMessage.data.speaker.scene != game.user?.viewedScene) {
            sceneMatches = false;
        }
    }

    if (chatMessage.data.type == 0) {
        if (currentTab != "rolls" && sceneMatches) {
            if (game.settings.get("tabbed-chatlog", "autoNavigate")) {
                window.game.tabbedchat.tabs.activate("rolls", {triggerCallback: true});
            }
            else {
                setRollsNotifyProperties();
                $("#rollsNotification").show();
            }
        }
    } else if (chatMessage.data.type == 5) {
        if (currentTab != "rolls" && sceneMatches && chatMessage.data.whisper.length == 0) {
            if (game.settings.get("tabbed-chatlog", "autoNavigate")) {
                window.game.tabbedchat.tabs.activate("rolls", {triggerCallback: true});
            }
            else {
                setRollsNotifyProperties();
                $("#rollsNotification").show();
            }
        }
    } else if (chatMessage.data.type == 2 || chatMessage.data.type == 3 || (chatMessage.data.type == 4 && game.settings.get("tabbed-chatlog", "icWhispers"))) {
        if (currentTab != "ic" && sceneMatches) {
            if (game.settings.get("tabbed-chatlog", "autoNavigate")) {
                window.game.tabbedchat.tabs.activate("ic", {triggerCallback: true});
            }
            else {
                setICNotifyProperties();
                $("#icNotification").show();
            }
        }
    } else {
        if (salonEnabled && chatMessage.data.type == 4 && !game.settings.get("tabbed-chatlog", "icWhispers")) return;

        if (currentTab != "ooc") {
            if (game.settings.get("tabbed-chatlog", "autoNavigate")) {
                window.game.tabbedchat.tabs.activate("ooc", {triggerCallback: true});
            }
            else {
                setOOCNotifyProperties();
                $("#oocNotification").show();
            }
        }
    }
});

Hooks.on("preCreateChatMessage", (chatMessage, content) => {

    if (game.settings.get('tabbed-chatlog', 'icChatInOoc')) {
        if (currentTab == "ooc") {
            if (chatMessage.type == 2) {
                chatMessage.type = 1;
                delete (chatMessage.speaker);
                console.log(chatMessage);
            }
        }
    }

    if (chatMessage.type == 0 || chatMessage.type == 5) {

    } else if (chatMessage.type == 2 || chatMessage.type == 3) {
        try {
            let scene = game.scenes.get(chatMessage.speaker.scene);
            let webhook = scene.getFlag("tabbed-chatlog", "webhook");

            if (webhook == undefined || webhook == "") {
                webhook = game.settings.get("tabbed-chatlog", "icBackupWebhook");
            }

            if (webhook == undefined || webhook == "") {
                return;
            }

            let speaker = chatMessage.speaker
            var actor = loadActorForChatMessage(speaker);
            let img = "";
            let name = "";
            if (actor) {
                img = generatePortraitImageElement(actor);
                name = actor.name;
            } else {
                img = game.users.get(chatMessage.user).avatar;
                name = speaker.alias;
            }

            img = game.data.addresses.remote + "/" + img;

            if (!chatMessage.whisper?.length) {
                let message = chatMessage.content;
                if (game.modules.get("polyglot")?.active) {
                    import("../polyglot/src/polyglot.js");
                    let lang = PolyGlot.languages[chatMessage.flags.polyglot.language] || chatMessage.flags.polyglot.language
                    if (lang != PolyGlot.defaultLanguage) {
                        message = lang + ": ||" + chatMessage.content + "||";
                    }
                }
                sendToDiscord(webhook, {
                    content: turndown.turndown(message),
                    username: name,
                    avatar_url: img
                });
            }
        } catch (error) {
            console.error(error);
        }
    } else {
        try {
            let webhook = game.settings.get("tabbed-chatlog", "oocWebhook");

            if (webhook == undefined || webhook == "") {
                return;
            }

            let img = game.users.get(chatMessage.user).avatar;
            img = game.data.addresses.remote + "/" + img;

            if (!chatMessage.whisper?.length) {
                let message = chatMessage.content;
                if (game.modules.get("polyglot")?.active) {
                    import("../polyglot/src/polyglot.js");
                    let lang = PolyGlot.languages[chatMessage.flags.polyglot.language] || chatMessage.flags.polyglot.language
                    if (lang != PolyGlot.defaultLanguage) {
                        message = lang + ": ||" + chatMessage.content + "||";
                    }
                }
                sendToDiscord(webhook, {
                    content: turndown.turndown(message),
                    username: game.users.get(chatMessage.user).name,
                    avatar_url: img
                });
            }
        } catch (error) {
            console.error(error);
        }
    }
});

function sendToDiscord(webhook, body) {
    $.ajax({
        type: 'POST',
        url: webhook,
        data: JSON.stringify(body),
        success: function (data) {
        },
        contentType: "application/json",
        dataType: 'json'
    });
}

function loadActorForChatMessage(speaker) {
    var actor;
    if (speaker.token) {
        actor = game.actors.tokens[speaker.token];
    }
    if (!actor) {
        actor = game.actors.get((speaker.actor));
    }
    if (!actor) {
        game.actors.forEach((value) => {
            if (value.name === speaker.alias) {
                actor = value;
            }
        });
    }
    return actor;
}

function generatePortraitImageElement(actor) {
    let img = "";
    img = actor.token ? actor.token.data.img : actor.data.token.img;
    return img;
}

Hooks.on("renderSceneNavigation", (sceneNav, html, data) => {

    if (shouldHideDueToStreamView()) return;

    var viewedScene = sceneNav.scenes.find(x => x.isView);

    $(".scenespecific").hide();
    if (currentTab == "rolls") {
        $(".type0.scene" + game.user.viewedScene).removeClass("hardHide");
        $(".type0.scene" + viewedScene.id).show();
        $(".type5.scene" + game.user.viewedScene).removeClass("hardHide");
        $(".type5.scene" + viewedScene.id).not(".gm-roll-hidden").show();
    } else if (currentTab == "ic") {
        $(".type2.scene" + game.user.viewedScene).removeClass("hardHide");
        $(".type2.scene" + viewedScene.id).show();
        $(".type3.scene" + game.user.viewedScene).removeClass("hardHide");
        $(".type3.scene" + viewedScene.id).show();
    }
});


Hooks.on("renderSceneConfig", (app, html, data) => {
    let loadedWebhookData = undefined;

    if (app.object.compendium) return;

    if (app.object.data.flags["tabbed-chatlog"]) {
        if (app.object.data.flags["tabbed-chatlog"].webhook) {
            loadedWebhookData = app.object.getFlag('tabbed-chatlog', 'webhook');
        } else {
            app.object.setFlag('tabbed-chatlog', 'webhook', "");
            loadedWebhookData = "";
        }
    } else {
        app.object.setFlag('tabbed-chatlog', 'webhook', "");
        loadedWebhookData = "";
    }

    const fxHtml = `
  <div class="form-group">
      <label>${game.i18n.localize("TC.SETTINGS.IcSceneWebhookName")}</label>
      <input id="scenewebhook" type="text" name="scenewebhook" value="${loadedWebhookData}" placeholder="Webhook"}>
      <p class="notes">${game.i18n.localize("TC.SETTINGS.IcSceneWebhookHint")}</p>
  </div>
  `
    const fxFind = html.find("select[name ='journal']");
    const formGroup = fxFind.closest(".form-group");
    formGroup.after(fxHtml);
});


Hooks.on("closeSceneConfig", (app, html, data) => {
    if (app.object.compendium) return;

    app.object.setFlag('tabbed-chatlog', 'webhook', html.find("input[name ='scenewebhook']")[0].value);
});


Hooks.on('sidebarCollapse', (sidebar, collapsing) => {
    if (!collapsing) {
        setALLTabsNotifyProperties();
    }

});


Hooks.on('ready', () => {
    if (game.modules.get('narrator-tools')?.active) {
        NarratorTools._msgtype = 2;
    }

    turndown = new TurndownService();

    const sidebar = document.querySelector('#sidebar');

    sidebar.addEventListener("mousedown", sidebarMouseDown, false);

    function sidebarMouseDown() {
        sidebar.addEventListener("mousemove", sidebarMouseMove, false);
        sidebar.addEventListener("mouseup", sidebarMouseUp, false);
    }

    function sidebarMouseUp() {
        sidebar.removeEventListener("mousemove", sidebarMouseMove, false);
        sidebar.removeEventListener("mouseup", sidebarMouseUp, false);
    }

    function sidebarMouseMove() {
        setALLTabsNotifyProperties();
    }


});

function setICNotifyProperties() {
    $("#icNotification").css({'right': ($("div#sidebar.app").width() / 3 * 2).toString() + 'px'});
};

function setRollsNotifyProperties() {
    $("#rollsNotification").css({'right': ($("div#sidebar.app").width() / 3).toString() + 'px'});
};

function setOOCNotifyProperties() {
    //NO-OP Nothing to do
};

function setALLTabsNotifyProperties() {
    setICNotifyProperties();
    setRollsNotifyProperties();
    setOOCNotifyProperties();
}


function shouldHideDueToStreamView() {
    if (game.settings.get("tabbed-chatlog", "hideInStreamView")) {
        if (window.location.href.endsWith("/stream")) {
            return true;
        }
    }
    return false;
}

//The Localization here should probably be improved
Messages.prototype.flush =
    async function () {
        return Dialog.confirm({
            title: game.i18n.localize("CHAT.FlushTitle"),
            content: game.i18n.localize("CHAT.FlushWarning"),
            yes: () => this.object.delete([...game.messages].filter(entity => isMessageVisible(entity)).map(message => message.data._id), {deleteAll: false}),
            options: {
                top: window.innerHeight - 150,
                left: window.innerWidth - 720
            }
        });
    };


Hooks.on('init', () => {

    game.settings.register('tabbed-chatlog', 'oocWebhook', {
        name: game.i18n.localize("TC.SETTINGS.OocWebhookName"),
        hint: game.i18n.localize("TC.SETTINGS.OocWebhookHint"),
        scope: 'world',
        config: true,
        default: '',
        type: String,
    });

    game.settings.register('tabbed-chatlog', 'icBackupWebhook', {
        name: game.i18n.localize("TC.SETTINGS.IcFallbackWebhookName"),
        hint: game.i18n.localize("TC.SETTINGS.IcFallbackWebhookHint"),
        scope: 'world',
        config: true,
        default: '',
        type: String,
    });

    game.settings.register('tabbed-chatlog', 'icChatInOoc', {
        name: game.i18n.localize("TC.SETTINGS.IcChatInOocName"),
        hint: game.i18n.localize("TC.SETTINGS.IcChatInOocHint"),
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
    });

    game.settings.register('tabbed-chatlog', 'hideInStreamView', {
        name: game.i18n.localize("TC.SETTINGS.HideInStreamViewName"),
        hint: game.i18n.localize("TC.SETTINGS.HideInStreamViewHint"),
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
    });

    game.settings.register('tabbed-chatlog', 'perScene', {
        name: game.i18n.localize("TC.SETTINGS.PerSceneName"),
        hint: game.i18n.localize("TC.SETTINGS.PerSceneHint"),
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
    });

    game.settings.register('tabbed-chatlog', 'icWhispers', {
        name: game.i18n.localize("TC.SETTINGS.IcWhispersName"),
        hint: game.i18n.localize("TC.SETTINGS.IcWhispersHint"),
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });

    game.settings.register('tabbed-chatlog', 'autoNavigate', {
        name: game.i18n.localize("TC.SETTINGS.AutoNavigateName"),
        hint: game.i18n.localize("TC.SETTINGS.AutoNavigateHint"),
        scope: 'client',
        config: true,
        default: false,
        type: Boolean,
    });

    salonEnabled = game.data.modules.find(x => x.id == "salon")?.active;
});


//#region Turndown

var TurndownService = (function () {
    'use strict';

    function extend(destination) {
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
                if (source.hasOwnProperty(key)) destination[key] = source[key];
            }
        }
        return destination
    }

    function repeat(character, count) {
        return Array(count + 1).join(character)
    }

    var blockElements = [
        'address', 'article', 'aside', 'audio', 'blockquote', 'body', 'canvas',
        'center', 'dd', 'dir', 'div', 'dl', 'dt', 'fieldset', 'figcaption',
        'figure', 'footer', 'form', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'header', 'hgroup', 'hr', 'html', 'isindex', 'li', 'main', 'menu', 'nav',
        'noframes', 'noscript', 'ol', 'output', 'p', 'pre', 'section', 'table',
        'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul'
    ];

    function isBlock(node) {
        return blockElements.indexOf(node.nodeName.toLowerCase()) !== -1
    }

    var voidElements = [
        'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input',
        'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'
    ];

    function isVoid(node) {
        return voidElements.indexOf(node.nodeName.toLowerCase()) !== -1
    }

    var voidSelector = voidElements.join();

    function hasVoid(node) {
        return node.querySelector && node.querySelector(voidSelector)
    }

    var rules = {};

    rules.paragraph = {
        filter: 'p',

        replacement: function (content) {
            return '\n\n' + content + '\n\n'
        }
    };

    rules.lineBreak = {
        filter: 'br',

        replacement: function (content, node, options) {
            return options.br + '\n'
        }
    };

    rules.heading = {
        filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

        replacement: function (content, node, options) {
            var hLevel = Number(node.nodeName.charAt(1));

            if (options.headingStyle === 'setext' && hLevel < 3) {
                var underline = repeat((hLevel === 1 ? '=' : '-'), content.length);
                return (
                    '\n\n' + content + '\n' + underline + '\n\n'
                )
            } else {
                return '\n\n' + repeat('#', hLevel) + ' ' + content + '\n\n'
            }
        }
    };

    rules.blockquote = {
        filter: 'blockquote',

        replacement: function (content) {
            content = content.replace(/^\n+|\n+$/g, '');
            content = content.replace(/^/gm, '> ');
            return '\n\n' + content + '\n\n'
        }
    };

    rules.list = {
        filter: ['ul', 'ol'],

        replacement: function (content, node) {
            var parent = node.parentNode;
            if (parent.nodeName === 'LI' && parent.lastElementChild === node) {
                return '\n' + content
            } else {
                return '\n\n' + content + '\n\n'
            }
        }
    };

    rules.listItem = {
        filter: 'li',

        replacement: function (content, node, options) {
            content = content
                .replace(/^\n+/, '') // remove leading newlines
                .replace(/\n+$/, '\n') // replace trailing newlines with just a single one
                .replace(/\n/gm, '\n    '); // indent
            var prefix = options.bulletListMarker + '   ';
            var parent = node.parentNode;
            if (parent.nodeName === 'OL') {
                var start = parent.getAttribute('start');
                var index = Array.prototype.indexOf.call(parent.children, node);
                prefix = (start ? Number(start) + index : index + 1) + '.  ';
            }
            return (
                prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '')
            )
        }
    };

    rules.indentedCodeBlock = {
        filter: function (node, options) {
            return (
                options.codeBlockStyle === 'indented' &&
                node.nodeName === 'PRE' &&
                node.firstChild &&
                node.firstChild.nodeName === 'CODE'
            )
        },

        replacement: function (content, node, options) {
            return (
                '\n\n    ' +
                node.firstChild.textContent.replace(/\n/g, '\n    ') +
                '\n\n'
            )
        }
    };

    rules.fencedCodeBlock = {
        filter: function (node, options) {
            return (
                options.codeBlockStyle === 'fenced' &&
                node.nodeName === 'PRE' &&
                node.firstChild &&
                node.firstChild.nodeName === 'CODE'
            )
        },

        replacement: function (content, node, options) {
            var className = node.firstChild.className || '';
            var language = (className.match(/language-(\S+)/) || [null, ''])[1];
            var code = node.firstChild.textContent;

            var fenceChar = options.fence.charAt(0);
            var fenceSize = 3;
            var fenceInCodeRegex = new RegExp('^' + fenceChar + '{3,}', 'gm');

            var match;
            while ((match = fenceInCodeRegex.exec(code))) {
                if (match[0].length >= fenceSize) {
                    fenceSize = match[0].length + 1;
                }
            }

            var fence = repeat(fenceChar, fenceSize);

            return (
                '\n\n' + fence + language + '\n' +
                code.replace(/\n$/, '') +
                '\n' + fence + '\n\n'
            )
        }
    };

    rules.horizontalRule = {
        filter: 'hr',

        replacement: function (content, node, options) {
            return '\n\n' + options.hr + '\n\n'
        }
    };

    rules.inlineLink = {
        filter: function (node, options) {
            return (
                options.linkStyle === 'inlined' &&
                node.nodeName === 'A' &&
                node.getAttribute('href')
            )
        },

        replacement: function (content, node) {
            var href = node.getAttribute('href');
            var title = node.title ? ' "' + node.title + '"' : '';
            return '[' + content + '](' + href + title + ')'
        }
    };

    rules.referenceLink = {
        filter: function (node, options) {
            return (
                options.linkStyle === 'referenced' &&
                node.nodeName === 'A' &&
                node.getAttribute('href')
            )
        },

        replacement: function (content, node, options) {
            var href = node.getAttribute('href');
            var title = node.title ? ' "' + node.title + '"' : '';
            var replacement;
            var reference;

            switch (options.linkReferenceStyle) {
                case 'collapsed':
                    replacement = '[' + content + '][]';
                    reference = '[' + content + ']: ' + href + title;
                    break
                case 'shortcut':
                    replacement = '[' + content + ']';
                    reference = '[' + content + ']: ' + href + title;
                    break
                default:
                    var id = this.references.length + 1;
                    replacement = '[' + content + '][' + id + ']';
                    reference = '[' + id + ']: ' + href + title;
            }

            this.references.push(reference);
            return replacement
        },

        references: [],

        append: function (options) {
            var references = '';
            if (this.references.length) {
                references = '\n\n' + this.references.join('\n') + '\n\n';
                this.references = []; // Reset references
            }
            return references
        }
    };

    rules.emphasis = {
        filter: ['em', 'i'],

        replacement: function (content, node, options) {
            if (!content.trim()) return ''
            return options.emDelimiter + content + options.emDelimiter
        }
    };

    rules.strong = {
        filter: ['strong', 'b'],

        replacement: function (content, node, options) {
            if (!content.trim()) return ''
            return options.strongDelimiter + content + options.strongDelimiter
        }
    };

    rules.code = {
        filter: function (node) {
            var hasSiblings = node.previousSibling || node.nextSibling;
            var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;

            return node.nodeName === 'CODE' && !isCodeBlock
        },

        replacement: function (content) {
            if (!content.trim()) return ''

            var delimiter = '`';
            var leadingSpace = '';
            var trailingSpace = '';
            var matches = content.match(/`+/gm);
            if (matches) {
                if (/^`/.test(content)) leadingSpace = ' ';
                if (/`$/.test(content)) trailingSpace = ' ';
                while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + '`';
            }

            return delimiter + leadingSpace + content + trailingSpace + delimiter
        }
    };

    rules.image = {
        filter: 'img',

        replacement: function (content, node) {
            var alt = node.alt || '';
            var src = node.getAttribute('src') || '';
            var title = node.title || '';
            var titlePart = title ? ' "' + title + '"' : '';
            return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : ''
        }
    };

    /**
     * Manages a collection of rules used to convert HTML to Markdown
     */

    function Rules(options) {
        this.options = options;
        this._keep = [];
        this._remove = [];

        this.blankRule = {
            replacement: options.blankReplacement
        };

        this.keepReplacement = options.keepReplacement;

        this.defaultRule = {
            replacement: options.defaultReplacement
        };

        this.array = [];
        for (var key in options.rules) this.array.push(options.rules[key]);
    }

    Rules.prototype = {
        add: function (key, rule) {
            this.array.unshift(rule);
        },

        keep: function (filter) {
            this._keep.unshift({
                filter: filter,
                replacement: this.keepReplacement
            });
        },

        remove: function (filter) {
            this._remove.unshift({
                filter: filter,
                replacement: function () {
                    return ''
                }
            });
        },

        forNode: function (node) {
            if (node.isBlank) return this.blankRule
            var rule;

            if ((rule = findRule(this.array, node, this.options))) return rule
            if ((rule = findRule(this._keep, node, this.options))) return rule
            if ((rule = findRule(this._remove, node, this.options))) return rule

            return this.defaultRule
        },

        forEach: function (fn) {
            for (var i = 0; i < this.array.length; i++) fn(this.array[i], i);
        }
    };

    function findRule(rules, node, options) {
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            if (filterValue(rule, node, options)) return rule
        }
        return void 0
    }

    function filterValue(rule, node, options) {
        var filter = rule.filter;
        if (typeof filter === 'string') {
            if (filter === node.nodeName.toLowerCase()) return true
        } else if (Array.isArray(filter)) {
            if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true
        } else if (typeof filter === 'function') {
            if (filter.call(rule, node, options)) return true
        } else {
            throw new TypeError('`filter` needs to be a string, array, or function')
        }
    }

    /**
     * The collapseWhitespace function is adapted from collapse-whitespace
     * by Luc Thevenard.
     *
     * The MIT License (MIT)
     *
     * Copyright (c) 2014 Luc Thevenard <lucthevenard@gmail.com>
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */

    /**
     * collapseWhitespace(options) removes extraneous whitespace from an the given element.
     *
     * @param {Object} options
     */
    function collapseWhitespace(options) {
        var element = options.element;
        var isBlock = options.isBlock;
        var isVoid = options.isVoid;
        var isPre = options.isPre || function (node) {
            return node.nodeName === 'PRE'
        };

        if (!element.firstChild || isPre(element)) return

        var prevText = null;
        var prevVoid = false;

        var prev = null;
        var node = next(prev, element, isPre);

        while (node !== element) {
            if (node.nodeType === 3 || node.nodeType === 4) { // Node.TEXT_NODE or Node.CDATA_SECTION_NODE
                var text = node.data.replace(/[ \r\n\t]+/g, ' ');

                if ((!prevText || / $/.test(prevText.data)) &&
                    !prevVoid && text[0] === ' ') {
                    text = text.substr(1);
                }

                // `text` might be empty at this point.
                if (!text) {
                    node = remove(node);
                    continue
                }

                node.data = text;

                prevText = node;
            } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
                if (isBlock(node) || node.nodeName === 'BR') {
                    if (prevText) {
                        prevText.data = prevText.data.replace(/ $/, '');
                    }

                    prevText = null;
                    prevVoid = false;
                } else if (isVoid(node)) {
                    // Avoid trimming space around non-block, non-BR void elements.
                    prevText = null;
                    prevVoid = true;
                }
            } else {
                node = remove(node);
                continue
            }

            var nextNode = next(prev, node, isPre);
            prev = node;
            node = nextNode;
        }

        if (prevText) {
            prevText.data = prevText.data.replace(/ $/, '');
            if (!prevText.data) {
                remove(prevText);
            }
        }
    }

    /**
     * remove(node) removes the given node from the DOM and returns the
     * next node in the sequence.
     *
     * @param {Node} node
     * @return {Node} node
     */
    function remove(node) {
        var next = node.nextSibling || node.parentNode;

        node.parentNode.removeChild(node);

        return next
    }

    /**
     * next(prev, current, isPre) returns the next node in the sequence, given the
     * current and previous nodes.
     *
     * @param {Node} prev
     * @param {Node} current
     * @param {Function} isPre
     * @return {Node}
     */
    function next(prev, current, isPre) {
        if ((prev && prev.parentNode === current) || isPre(current)) {
            return current.nextSibling || current.parentNode
        }

        return current.firstChild || current.nextSibling || current.parentNode
    }

    /*
     * Set up window for Node.js
     */

    var root = (typeof window !== 'undefined' ? window : {});

    /*
     * Parsing HTML strings
     */

    function canParseHTMLNatively() {
        var Parser = root.DOMParser;
        var canParse = false;

        // Adapted from https://gist.github.com/1129031
        // Firefox/Opera/IE throw errors on unsupported types
        try {
            // WebKit returns null on unsupported types
            if (new Parser().parseFromString('', 'text/html')) {
                canParse = true;
            }
        } catch (e) {
        }

        return canParse
    }

    function createHTMLParser() {
        var Parser = function () {
        };

        {
            if (shouldUseActiveX()) {
                Parser.prototype.parseFromString = function (string) {
                    var doc = new window.ActiveXObject('htmlfile');
                    doc.designMode = 'on'; // disable on-page scripts
                    doc.open();
                    doc.write(string);
                    doc.close();
                    return doc
                };
            } else {
                Parser.prototype.parseFromString = function (string) {
                    var doc = document.implementation.createHTMLDocument('');
                    doc.open();
                    doc.write(string);
                    doc.close();
                    return doc
                };
            }
        }
        return Parser
    }

    function shouldUseActiveX() {
        var useActiveX = false;
        try {
            document.implementation.createHTMLDocument('').open();
        } catch (e) {
            if (window.ActiveXObject) useActiveX = true;
        }
        return useActiveX
    }

    var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();

    function RootNode(input) {
        var root;
        if (typeof input === 'string') {
            var doc = htmlParser().parseFromString(
                // DOM parsers arrange elements in the <head> and <body>.
                // Wrapping in a custom element ensures elements are reliably arranged in
                // a single element.
                '<x-turndown id="turndown-root">' + input + '</x-turndown>',
                'text/html'
            );
            root = doc.getElementById('turndown-root');
        } else {
            root = input.cloneNode(true);
        }
        collapseWhitespace({
            element: root,
            isBlock: isBlock,
            isVoid: isVoid
        });

        return root
    }

    var _htmlParser;

    function htmlParser() {
        _htmlParser = _htmlParser || new HTMLParser();
        return _htmlParser
    }

    function Node(node) {
        node.isBlock = isBlock(node);
        node.isCode = node.nodeName.toLowerCase() === 'code' || node.parentNode.isCode;
        node.isBlank = isBlank(node);
        node.flankingWhitespace = flankingWhitespace(node);
        return node
    }

    function isBlank(node) {
        return (
            ['A', 'TH', 'TD', 'IFRAME', 'SCRIPT', 'AUDIO', 'VIDEO'].indexOf(node.nodeName) === -1 &&
            /^\s*$/i.test(node.textContent) &&
            !isVoid(node) &&
            !hasVoid(node)
        )
    }

    function flankingWhitespace(node) {
        var leading = '';
        var trailing = '';

        if (!node.isBlock) {
            var hasLeading = /^\s/.test(node.textContent);
            var hasTrailing = /\s$/.test(node.textContent);
            var blankWithSpaces = node.isBlank && hasLeading && hasTrailing;

            if (hasLeading && !isFlankedByWhitespace('left', node)) {
                leading = ' ';
            }

            if (!blankWithSpaces && hasTrailing && !isFlankedByWhitespace('right', node)) {
                trailing = ' ';
            }
        }

        return {leading: leading, trailing: trailing}
    }

    function isFlankedByWhitespace(side, node) {
        var sibling;
        var regExp;
        var isFlanked;

        if (side === 'left') {
            sibling = node.previousSibling;
            regExp = / $/;
        } else {
            sibling = node.nextSibling;
            regExp = /^ /;
        }

        if (sibling) {
            if (sibling.nodeType === 3) {
                isFlanked = regExp.test(sibling.nodeValue);
            } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
                isFlanked = regExp.test(sibling.textContent);
            }
        }
        return isFlanked
    }

    var reduce = Array.prototype.reduce;
    var leadingNewLinesRegExp = /^\n*/;
    var trailingNewLinesRegExp = /\n*$/;
    var escapes = [
        [/\\/g, '\\\\'],
        [/\*/g, '\\*'],
        [/^-/g, '\\-'],
        [/^\+ /g, '\\+ '],
        [/^(=+)/g, '\\$1'],
        [/^(#{1,6}) /g, '\\$1 '],
        [/`/g, '\\`'],
        [/^~~~/g, '\\~~~'],
        [/\[/g, '\\['],
        [/\]/g, '\\]'],
        [/^>/g, '\\>'],
        [/_/g, '\\_'],
        [/^(\d+)\. /g, '$1\\. ']
    ];

    function TurndownService(options) {
        if (!(this instanceof TurndownService)) return new TurndownService(options)

        var defaults = {
            rules: rules,
            headingStyle: 'setext',
            hr: '* * *',
            bulletListMarker: '*',
            codeBlockStyle: 'indented',
            fence: '```',
            emDelimiter: '_',
            strongDelimiter: '**',
            linkStyle: 'inlined',
            linkReferenceStyle: 'full',
            br: '  ',
            blankReplacement: function (content, node) {
                return node.isBlock ? '\n\n' : ''
            },
            keepReplacement: function (content, node) {
                return node.isBlock ? '\n\n' + node.outerHTML + '\n\n' : node.outerHTML
            },
            defaultReplacement: function (content, node) {
                return node.isBlock ? '\n\n' + content + '\n\n' : content
            }
        };
        this.options = extend({}, defaults, options);
        this.rules = new Rules(this.options);
    }

    TurndownService.prototype = {
        /**
         * The entry point for converting a string or DOM node to Markdown
         * @public
         * @param {String|HTMLElement} input The string or DOM node to convert
         * @returns A Markdown representation of the input
         * @type String
         */

        turndown: function (input) {
            if (!canConvert(input)) {
                throw new TypeError(
                    input + ' is not a string, or an element/document/fragment node.'
                )
            }

            if (input === '') return ''

            var output = process.call(this, new RootNode(input));
            return postProcess.call(this, output)
        },

        /**
         * Add one or more plugins
         * @public
         * @param {Function|Array} plugin The plugin or array of plugins to add
         * @returns The Turndown instance for chaining
         * @type Object
         */

        use: function (plugin) {
            if (Array.isArray(plugin)) {
                for (var i = 0; i < plugin.length; i++) this.use(plugin[i]);
            } else if (typeof plugin === 'function') {
                plugin(this);
            } else {
                throw new TypeError('plugin must be a Function or an Array of Functions')
            }
            return this
        },

        /**
         * Adds a rule
         * @public
         * @param {String} key The unique key of the rule
         * @param {Object} rule The rule
         * @returns The Turndown instance for chaining
         * @type Object
         */

        addRule: function (key, rule) {
            this.rules.add(key, rule);
            return this
        },

        /**
         * Keep a node (as HTML) that matches the filter
         * @public
         * @param {String|Array|Function} filter The unique key of the rule
         * @returns The Turndown instance for chaining
         * @type Object
         */

        keep: function (filter) {
            this.rules.keep(filter);
            return this
        },

        /**
         * Remove a node that matches the filter
         * @public
         * @param {String|Array|Function} filter The unique key of the rule
         * @returns The Turndown instance for chaining
         * @type Object
         */

        remove: function (filter) {
            this.rules.remove(filter);
            return this
        },

        /**
         * Escapes Markdown syntax
         * @public
         * @param {String} string The string to escape
         * @returns A string with Markdown syntax escaped
         * @type String
         */

        escape: function (string) {
            return escapes.reduce(function (accumulator, escape) {
                return accumulator.replace(escape[0], escape[1])
            }, string)
        }
    };

    /**
     * Reduces a DOM node down to its Markdown string equivalent
     * @private
     * @param {HTMLElement} parentNode The node to convert
     * @returns A Markdown representation of the node
     * @type String
     */

    function process(parentNode) {
        var self = this;
        return reduce.call(parentNode.childNodes, function (output, node) {
            node = new Node(node);

            var replacement = '';
            if (node.nodeType === 3) {
                replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue);
            } else if (node.nodeType === 1) {
                replacement = replacementForNode.call(self, node);
            }

            return join(output, replacement)
        }, '')
    }

    /**
     * Appends strings as each rule requires and trims the output
     * @private
     * @param {String} output The conversion output
     * @returns A trimmed version of the ouput
     * @type String
     */

    function postProcess(output) {
        var self = this;
        this.rules.forEach(function (rule) {
            if (typeof rule.append === 'function') {
                output = join(output, rule.append(self.options));
            }
        });

        return output.replace(/^[\t\r\n]+/, '').replace(/[\t\r\n\s]+$/, '')
    }

    /**
     * Converts an element node to its Markdown equivalent
     * @private
     * @param {HTMLElement} node The node to convert
     * @returns A Markdown representation of the node
     * @type String
     */

    function replacementForNode(node) {
        var rule = this.rules.forNode(node);
        var content = process.call(this, node);
        var whitespace = node.flankingWhitespace;
        if (whitespace.leading || whitespace.trailing) content = content.trim();
        return (
            whitespace.leading +
            rule.replacement(content, node, this.options) +
            whitespace.trailing
        )
    }

    /**
     * Determines the new lines between the current output and the replacement
     * @private
     * @param {String} output The current conversion output
     * @param {String} replacement The string to append to the output
     * @returns The whitespace to separate the current output and the replacement
     * @type String
     */

    function separatingNewlines(output, replacement) {
        var newlines = [
            output.match(trailingNewLinesRegExp)[0],
            replacement.match(leadingNewLinesRegExp)[0]
        ].sort();
        var maxNewlines = newlines[newlines.length - 1];
        return maxNewlines.length < 2 ? maxNewlines : '\n\n'
    }

    function join(string1, string2) {
        var separator = separatingNewlines(string1, string2);

        // Remove trailing/leading newlines and replace with separator
        string1 = string1.replace(trailingNewLinesRegExp, '');
        string2 = string2.replace(leadingNewLinesRegExp, '');

        return string1 + separator + string2
    }

    /**
     * Determines whether an input can be converted
     * @private
     * @param {String|HTMLElement} input Describe this parameter
     * @returns Describe what it returns
     * @type String|Object|Array|Boolean|Number
     */

    function canConvert(input) {
        return (
            input != null && (
                typeof input === 'string' ||
                (input.nodeType && (
                    input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11
                ))
            )
        )
    }

    return TurndownService;

}());


//#endregion
