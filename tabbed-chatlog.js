(() => { })();

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


Hooks.on("renderChatLog", async function(chatLog, html, user) {

  var toPrepend = '<nav class="tabbedchatlog tabs">';
  toPrepend += `<a class="item ic" data-tab="ic">${game.i18n.localize("TC.TABS.IC")}</a><i id="icNotification" class="notification-pip fas fa-exclamation-circle" style="display: none;"></i>`;
  toPrepend += `<a class="item rolls" data-tab="rolls">${game.i18n.localize("TC.TABS.Rolls")}</a><i id="rollsNotification" class="notification-pip fas fa-exclamation-circle" style="display: none;"></i>`;
  toPrepend += `<a class="item ooc" data-tab="ooc">${game.i18n.localize("TC.TABS.OOC")}</a></nav><i id="oocNotification" class="notification-pip fas fa-exclamation-circle" style="display: none;"></i>`;
  html.prepend(toPrepend);

  var me = this;
  const tabs = new TabsV2({ 
    navSelector: ".tabs",
    contentSelector: ".content", 
    initial: "tab1", 
    callback: function(event, html, tab) { 
      currentTab = tab;

      if (tab == "rolls") {
        $(".type0").removeClass("hardHide");
        $(".type0").show();
        $(".type1").hide();
        $(".type2").hide();
        $(".type3").hide();
        $(".type4").hide();
        $(".type5").removeClass("hardHide");
        $(".type5").not(".gm-roll-hidden").show();

        $("#rollsNotification").hide();
      }
      else if (tab == "ic") {
        $(".type0").hide();
        $(".type1").hide();
        $(".type2.scene" + game.user.viewedScene).removeClass("hardHide");
        $(".type2.scene" + game.user.viewedScene).show();
        $(".type2").not(".scenespecific").show();
        $(".type3.scene" + game.user.viewedScene).removeClass("hardHide");
        $(".type3.scene" + game.user.viewedScene).show();
        $(".type3").not(".scenespecific").show();
        $(".type4").hide();

        if (!salonEnabled) {
          $(".type5").hide();
        }

        $("#icNotification").hide();
      }
      else if (tab == "ooc") {
        $(".type0").hide();
        $(".type1").removeClass("hardHide");
        $(".type1").show();
        $(".type2").hide();
        $(".type3").hide();
        $(".type4").removeClass("hardHide");
        $(".type4").show();
        if (!salonEnabled) {
          $(".type5").hide();
        }

        $("#oocNotification").hide();
      }
      else {
        console.log("Unknown tab " + tab + "!");
      }

      $("#chat-log").scrollTop(9999999);
    } 
  });
  tabs.bind(html[0]);
});

Hooks.on("renderChatMessage", (chatMessage, html, data) => {
  html.addClass("type" + data.message.type);

  var sceneMatches = true;

  if (data.message.type == 0 || data.message.type == 2 || data.message.type == 3 || data.message.type == 5) {
    if (data.message.speaker.scene != undefined) {
      html.addClass("scenespecific");
      html.addClass("scene" + data.message.speaker.scene);
      if (data.message.speaker.scene != game.user.viewedScene) {
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

  if (currentTab == "rolls") {
    if (chatMessage.data.type == 0 && sceneMatches)
    {
      html.css("display", "list-item");
    }
    else if (data.message.type == 5 && sceneMatches) {
      if (!html.hasClass('gm-roll-hidden')) {
        html.css("display", "list-item");
      }
    }
    else {
      html.css("display", "none");
    }
  }
  else if (currentTab == "ic") {
    if ((data.message.type == 2 || data.message.type == 3) && sceneMatches)
    {
      html.css("display", "list-item");
    }
    else {
      html.css("cssText", "display: none !important;");
      html.addClass("hardHide");
    }
  }
  else if (currentTab == "ooc") {
    if (data.message.type == 1 || data.message.type == 4)
    {
      html.css("display", "list-item");
    }
    else {
      html.css("display", "none");
    }
  }
});

Hooks.on("createChatMessage", (chatMessage, content) => {
  var sceneMatches = true;

  if (chatMessage.data.speaker.scene)
  {
    if (chatMessage.data.speaker.scene != game.user.viewedScene) {
      sceneMatches = false;
    }
  }

  if (chatMessage.data.type == 0) {
    if (currentTab != "rolls" && sceneMatches) {
      $("#rollsNotification").show();
    }
  }
  else if (chatMessage.data.type == 5) {
    if (currentTab != "rolls" && sceneMatches && chatMessage.data.whisper.length == 0) {
      $("#rollsNotification").show();
    }
  }
  else if (chatMessage.data.type == 2 || chatMessage.data.type == 3)
  {
    if (currentTab != "ic" && sceneMatches)
    { 
      $("#icNotification").show();
    }
  }
  else
  {
    if (currentTab != "ooc") { 
      $("#oocNotification").show();
    }
  }
});

Hooks.on("preCreateChatMessage", (chatMessage, content) => {
  if (chatMessage.type == 0 || chatMessage.type == 5) {

  }
  else if (chatMessage.type == 2 || chatMessage.type == 3)
  {
    try
    {
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
      if (actor) {
          img = generatePortraitImageElement(actor)
      }
      else {
          img = game.users.get(chatMessage.user).avatar;
      }

      img = game.data.addresses.remote + "/" + img;

      if (!chatMessage.whisper?.length) {
        sendToDiscord(webhook, {
          content: chatMessage.content,
          username: actor.name,
          avatar_url: img
        });
      }
    }
    catch (error) {
      console.log(error);
    }
  }
  else
  {
    try
    {
      let webhook = game.settings.get("tabbed-chatlog", "oocWebhook");

      if (webhook == undefined || webhook == "") {
        return;
      }

      let img = game.users.get(chatMessage.user).avatar;
      img = game.data.addresses.remote + "/" + img;

      if (!chatMessage.whisper?.length) {
        sendToDiscord(webhook, {
          content: chatMessage.content,
          username: game.users.get(chatMessage.user).name,
          avatar_url: img
        });
      }
    }
    catch (error) {
      console.log(error);
    }
  }
});

function sendToDiscord(webhook, body) {
  $.ajax({
    type: 'POST',
    url: webhook,
    data: JSON.stringify(body),
    success: function(data) {},
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
  var viewedScene = sceneNav.scenes.find(x => x.isView);
 
  $(".scenespecific").hide();
  if (currentTab == "rolls") {
    $(".type0.scene" + game.user.viewedScene).removeClass("hardHide");
    $(".type0.scene" + viewedScene.id).show();
    $(".type5.scene" + game.user.viewedScene).removeClass("hardHide");
    $(".type5.scene" + viewedScene.id).not(".gm-roll-hidden").show();
  }
  else if (currentTab == "ic") {
    $(".type2.scene" + game.user.viewedScene).removeClass("hardHide");
    $(".type2.scene" + viewedScene.id).show();
    $(".type3.scene" + game.user.viewedScene).removeClass("hardHide");
    $(".type3.scene" + viewedScene.id).show();
  }
});


Hooks.on("renderSceneConfig", (app, html, data) => {
  let loadedWebhookData = undefined;

    if(app.object.data.flags["tabbed-chatlog"])
    {
      if (app.object.data.flags["tabbed-chatlog"].webhook)
      {
        loadedWebhookData = app.object.getFlag('tabbed-chatlog', 'webhook');
      }
      else
      {
        app.object.setFlag('tabbed-chatlog', 'webhook', "");
        loadedWebhookData = "";
      }
    }
    else
    {
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
  app.object.setFlag('tabbed-chatlog', 'webhook', html.find("input[name ='scenewebhook']")[0].value);
});

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

  salonEnabled = game.data.modules.find(x => x.id == "salon")?.active;
});
