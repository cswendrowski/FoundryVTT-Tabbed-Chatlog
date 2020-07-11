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

  //html.prepend('<section class="tabbedchatlog content"><div class="tab" data-tab="tab1">Content 1</div><div class="tab" data-tab="tab2">Content 2</div></section>');
  html.prepend('<nav class="tabbedchatlog tabs"><a class="item ic" data-tab="ic">In Character</a><a class="item rolls" data-tab="rolls">Rolls</a><a class="item ooc" data-tab="ooc">OOC</a></nav>');

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
        $(".type0").show();
        $(".type1").hide();
        $(".type2").hide();
        $(".type3").hide();
        $(".type4").hide();
        $(".type5").show();
      }
      else if (tab == "ic") {
        $(".type0").hide();
        $(".type1").hide();
        $(".type2.scene" + game.user.viewedScene).show();
        $(".type3.scene" + game.user.viewedScene).show();
        $(".type4").hide();
        $(".type5").hide();

        console.log("Showing messages for " + game.user.viewedScene);
      }
      else if (tab == "ooc") {
        $(".type0").hide();
        $(".type1").show();
        $(".type2").hide();
        $(".type3").hide();
        $(".type4").hide();
        $(".type5").hide();
      }
      else {
        console.log("Unknown tab " + tab + "!");
      }
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

  if (data.message.type == 0 || data.message.type == 2 || data.message.type == 3 || data.message.type == 5) {
    if (data.message.speaker.scene != undefined) {
      html.addClass("scenespecific");
      html.addClass("scene" + data.message.speaker.scene);
    }
  }

  if (currentTab == "ooc") {
    html.css("display", "list-item");
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
