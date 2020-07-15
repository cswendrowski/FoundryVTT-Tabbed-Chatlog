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

Hooks.on("renderChatLog", async function(chatLog, html, user) {
  console.log("tabbed chatlog");
  console.log(chatLog);
  console.log(html);
  console.log(user);

  var toPrepend = '<nav class="tabbedchatlog tabs">';
  toPrepend += '<a class="item ic" data-tab="ic">In Character</a><i id="icNotification" class="notification-pip fas fa-exclamation-circle" style="display: none;"></i>'
  toPrepend += '<a class="item rolls" data-tab="rolls">Rolls</a><i id="rollsNotification" class="notification-pip fas fa-exclamation-circle" style="display: none;"></i>';
  toPrepend += '<a class="item ooc" data-tab="ooc">OOC</a></nav><i id="oocNotification" class="notification-pip fas fa-exclamation-circle" style="display: none;"></i>';
  html.prepend(toPrepend);

  var me = this;
  const tabs = new TabsV2({ 
    navSelector: ".tabs",
    contentSelector: ".content", 
    initial: "tab1", 
    callback: function(event, html, tab) { 
      console.log("Tab callback");
      console.log(tab);
      currentTab = tab;

      if (tab == "rolls") {
        $(".type0").removeClass("hardHide");
        $(".type0").show();
        $(".type1").hide();
        $(".type2").hide();
        $(".type3").hide();
        $(".type4").hide();
        $(".type5").removeClass("hardHide");
        $(".type5").show();

        $("#rollsNotification").hide();
      }
      else if (tab == "ic") {
        $(".type0").hide();
        $(".type1").hide();
        $(".type2.scene" + game.user.viewedScene).show();
        $(".type3.scene" + game.user.viewedScene).show();
        $(".type4").hide();
        $(".type5").hide();

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
        $(".type5").hide();

        $("#oocNotification").hide();
      }
      else {
        console.log("Unknown tab " + tab + "!");
      }

      $("#chat-log").scrollTop(9999999);
    } 
  });
  console.log(html[0]);
  tabs.bind(html[0]);

  console.log(tabs);
});

Hooks.on("renderChatMessage", (chatMessage, html, data) => {
  console.log(chatMessage);
  console.log(html);
  console.log(data)

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

  if (currentTab == "rolls") {
    if ((chatMessage.data.type == 0 || data.message.type == 5) && sceneMatches)
    {
      html.css("display", "list-item");
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

  if (chatMessage.data.speaker.scene) {
    if (chatMessage.data.speaker.scene != game.user.viewedScene) {
      sceneMatches = false;
    }
  }

  if (chatMessage.data.type == 0 || chatMessage.data.type == 5) {
    if (currentTab != "rolls" && sceneMatches) {
      $("#rollsNotification").show();
    }
  }
  else if (chatMessage.data.type == 2 || chatMessage.data.type == 3) {
    if (currentTab != "ic" && sceneMatches) { 
      $("#icNotification").show();
    }
  }
  else {
    if (currentTab != "ooc") { 
      $("#oocNotification").show();
    }
  }
});

Hooks.on("renderSceneNavigation", (sceneNav, html, data) => {
  console.log(sceneNav);
  console.log(data);
  var viewedScene = sceneNav.scenes.find(x => x.isView);
  console.log("Navigated to scene " + viewedScene.id);
  
  $(".scenespecific").hide();
  if (currentTab == "rolls") {
    $(".type0.scene" + viewedScene.id).show();
    $(".type5.scene" + viewedScene.id).show();
  }
  else if (currentTab == "ic") {
    $(".type2.scene" + viewedScene.id).show();
    $(".type3.scene" + viewedScene.id).show();
  }
});
