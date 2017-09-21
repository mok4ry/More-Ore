(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

// Helper Shit

var s = function s(el) {
  return document.querySelector(el);
};

var beautify = function beautify(num) {

  if (num < 1000000) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); //found on https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
  } else {
    if (num >= 1000000 && num < 1000000000) {
      return (num / 1000000).toFixed(3) + ' Million';
    }
    if (num >= 1000000000 && num < 1000000000000) {
      return (num / 1000000000).toFixed(3) + ' Billion';
    }
    if (num >= 1000000000000 && num < 1000000000000000) {
      return (num / 1000000000000).toFixed(3) + ' Trillion';
    }
    if (num >= 1000000000000000 && num < 1000000000000000000) {
      return (num / 1000000000000000).toFixed(3) + ' Quadrillion';
    }
    if (num >= 1000000000000000000 && num < 1000000000000000000000) {
      return (num / 1000000000000000000).toFixed(3) + ' Quintillion';
    }
    if (num >= 1000000000000000000000 && num < 1000000000000000000000000) {
      return (num / 1000000000000000000000).toFixed(3) + ' Sextillion';
    }
  }
};

// Game

var Game = {};

window.Game = Game;

Game.launch = function () {

  Game.state = {
    ores: 0,
    oreHp: 50,
    oreCurrentHp: 50,
    oresPerSecond: 0,
    opsMultiplier: 0,
    opcMultiplier: 0,
    oreClickMultiplier: 5,
    player: {
      lvl: 1,
      str: 0,
      dex: 0,
      luk: 0,
      int: 0,
      cha: 0,
      currentXp: 0,
      xpNeeded: 100,
      availableSp: 0,
      pickaxe: {
        name: 'Beginners Wood Pickaxe',
        rarity: 'Common',
        itemLevel: 1,
        material: 'Wood',
        damage: 1
      },
      accesory: {}
    },
    tabs: [{
      name: 'store',
      locked: false
    }],
    stats: {
      totalOresMined: 0,
      totalOresSpent: 0,
      oreClicks: 0,
      oreCritClicks: 0,
      rocksDestroyed: 0,
      itemsPickedUp: 0,
      timePlayed: 0
    }
  };

  Game.wipe = function () {
    localStorage.clear();
    location.reload();
  };

  Game.save = function () {
    localStorage.setItem('state', JSON.stringify(Game.state));
    for (var i in Game.items) {
      localStorage.setItem('item-' + i, JSON.stringify(Game.items[i]));
    }
  };

  Game.load = function () {
    if (localStorage.getItem('state') !== null) {
      Game.state = JSON.parse(localStorage.getItem('state'));

      for (var i in Game.items) {
        Game.items[i] = JSON.parse(localStorage.getItem('item-' + i));
      }

      generateStoreItems();
    }
  };

  var playSound = function playSound(snd) {
    var sfx = new Audio('./assets/' + snd + '.wav');
    sfx.volume = 0.1;
    sfx.play();
  };

  var earn = function earn(amt) {
    Game.state.ores += amt;
    Game.state.stats.totalOresMined += amt;
    buildInventory();
  };

  var earnOPS = function earnOPS() {
    var ops = calculateOPS();
    earn(ops / 30);
    updatePercentage(ops / 30);
  };

  var spend = function spend(amt) {
    Game.state.ores -= amt;
    Game.state.stats.totalOresSpent += amt;
  };

  var calculateOPC = function calculateOPC(type) {
    var opc = 0;
    var str = Game.state.player.str;
    if (Game.state.player.pickaxe.prefixStat) {
      if (Game.state.player.pickaxe.prefixStat == 'Strength') {
        str += Game.state.player.pickaxe.prefixStatVal;
      }
    }
    opc += Game.state.player.pickaxe.damage;
    // opc += (Game.state.player.pickaxe.damage * str) * .1
    opc += Math.pow(1.25, str);

    opc += opc * Game.state.opcMultiplier;

    if (type == 'crit') {
      opc *= Game.state.oreClickMultiplier;
    }

    return opc;
  };

  var calculateOPS = function calculateOPS() {
    var ops = 0;

    for (var i in Game.items) {
      if (Game.items[i].type == 'item') {
        ops += Game.items[i].production * Game.items[i].owned;
      }
    }

    ops += ops * Game.state.opsMultiplier;

    Game.state.oresPerSecond = ops;
    return ops;
  };

  var dropItem = function dropItem() {
    var randomSign = Math.round(Math.random()) * 2 - 1;
    var randomNumber = (Math.floor(Math.random() * 200) + 1) * randomSign;
    var randomY = Math.floor(Math.random() * 50) + 1;
    var thisItemClicked = false;
    var amountOfRocksDestroyed = Game.state.stats.rocksDestroyed;
    var iLvl = amountOfRocksDestroyed;

    if (Math.random() < .3 || amountOfRocksDestroyed <= 1) {
      // 30% chance
      var itemContainer = document.createElement('div');
      itemContainer.classList.add('item-container');
      itemContainer.innerHTML = '\n        <div class="item-pouch-glow"></div>\n        <div class="item-pouch-glow2"></div>\n        <div class="item-pouch-glow3"></div>\n      ';
      var orePos = s('.ore').getBoundingClientRect();
      itemContainer.style.position = 'absolute';
      itemContainer.style.top = orePos.bottom + randomY + 'px';
      itemContainer.style.left = (orePos.left + orePos.right) / 2 + randomNumber + 'px';

      var item = document.createElement('div');
      item.classList.add('item-drop');
      item.style.position = 'relative';
      item.id = 'item-' + amountOfRocksDestroyed;

      itemContainer.appendChild(item);

      item.addEventListener('click', function () {
        s('.item-pouch-glow').style.display = 'none';
        s('.item-pouch-glow2').style.display = 'none';
        s('.item-pouch-glow3').style.display = 'none';
        item.style.pointerEvents = 'none';
        s('.item-drop').classList.add('item-pickup-animation');
        setTimeout(function () {
          itemContainer.parentNode.removeChild(itemContainer);
          pickUpItem(iLvl);
        }, 800);
      });

      s('body').appendChild(itemContainer);
    }
  };

  var generateRandomItem = function generateRandomItem(iLvl) {

    var rarity = [{
      name: 'Common',
      mult: 1
    }, {
      name: 'Uncommon',
      mult: 1.5
    }, {
      name: 'Unique',
      mult: 2
    }, {
      name: 'Rare',
      mult: 3
    }, {
      name: 'Legendary',
      mult: 5
    }];
    var prefixes = [{
      name: 'Lucky',
      stat: 'Luck',
      mult: 1
    }, {
      name: 'Unlucky',
      stat: 'Luck',
      mult: -1
    }, {
      name: 'Fortuitous',
      stat: 'Luck',
      mult: 2
    }, {
      name: 'Poor',
      stat: 'Luck',
      mult: -1
    }, {
      name: 'Strong',
      stat: 'Strength',
      mult: 1
    }, {
      name: 'Weak',
      stat: 'Strength',
      mult: -1
    }, {
      name: 'Big',
      stat: 'Strength',
      mult: 1
    }, {
      name: 'Small',
      stat: 'Strength',
      mult: -1
    }, {
      name: 'Baby',
      stat: 'Strength',
      mult: -2
    }, {
      name: 'Gigantic',
      stat: 'Strength',
      mult: 2
    }, {
      name: 'Durable',
      stat: 'Strength',
      mult: 1
    }, {
      name: 'Frail',
      stat: 'Strength',
      mult: -1.5
    }, {
      name: 'Hard',
      stat: 'Strength',
      mult: 1
    }, {
      name: 'Weak',
      stat: 'Strength',
      mult: -1
    }, {
      name: 'Broken',
      stat: 'Strength',
      mult: -2
    }, {
      name: 'Shoddy',
      stat: 'Strength',
      mult: -1
    }];
    var materials = [{
      name: 'Wood',
      mult: .5
    }, {
      name: 'Stone',
      mult: 1.5
    }, {
      name: 'Iron',
      mult: 3
    }, {
      name: 'Steel',
      mult: 5
    }, {
      name: 'Diamond',
      mult: 10
    }];
    var suffixes = [{
      name: 'of the Giant',
      stat: 'strength',
      mult: 10
    }, {
      name: 'of the Leprechaun',
      stat: 'luck',
      mult: 10
    }];

    var range = Math.ceil(Math.random() * iLvl / 2 + iLvl / 2); // Picks a random whole number from 1 to iLvl

    var chooseRarity = function chooseRarity() {
      var selectedRarity = void 0;
      var randomNum = Math.random();
      if (randomNum >= 0) {
        selectedRarity = rarity[0];
      }
      if (randomNum >= .5) {
        selectedRarity = rarity[1];
      }
      if (randomNum >= .7) {
        selectedRarity = rarity[2];
      }
      if (randomNum >= .9) {
        selectedRarity = rarity[3];
      }
      if (randomNum >= .95) {
        selectedRarity = rarity[4];
      }
      return selectedRarity;
    };
    var chooseMaterial = function chooseMaterial() {
      var selectedMaterial = void 0;
      var randomNum = Math.random();
      if (randomNum >= 0) {
        selectedMaterial = materials[0];
      }
      if (randomNum >= .4) {
        selectedMaterial = materials[1];
      }
      if (randomNum >= .7) {
        selectedMaterial = materials[2];
      }
      if (randomNum >= .9) {
        selectedMaterial = materials[3];
      }
      if (randomNum >= .95) {
        selectedMaterial = materials[4];
      }
      return selectedMaterial;
    };

    var selectedRarity = chooseRarity();
    var selectedMaterial = chooseMaterial();
    var totalMult = selectedRarity.mult + selectedMaterial.mult;
    var itemName = void 0;
    var prefixName = void 0;
    var prefixVal = void 0;
    var prefixStat = void 0;
    var suffixName = void 0;

    if (selectedRarity.name == 'Legendary' || selectedRarity.name == 'Rare') {
      var selectedSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      totalMult += selectedSuffix.mult;
      suffixName = selectedSuffix.name;
    }
    if (Math.random() >= .6) {
      // 40% chance for a prefix
      var selectedPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      prefixVal = (range + totalMult) * selectedPrefix.mult;
      prefixStat = selectedPrefix.stat;
      prefixName = selectedPrefix.name;
    }
    if (prefixName) {
      itemName = prefixName + ' ' + selectedMaterial.name + ' Pickaxe';
    } else {
      itemName = selectedMaterial.name + ' Pickaxe';
    }
    if (suffixName) {
      itemName += ' ' + suffixName;
    }

    var calculateDmg = iLvl * totalMult;

    var newItem = {
      name: itemName,
      rarity: selectedRarity.name,
      material: selectedMaterial.name,
      itemLevel: iLvl,
      damage: calculateDmg
    };

    if (prefixName) {
      newItem['hasPrefix'] = true;
      newItem['prefixStat'] = prefixStat;
      newItem['prefixStatVal'] = prefixVal;
    }

    return newItem;
  };

  var pickUpItem = function pickUpItem(iLvl) {
    Game.state.stats.itemsPickedUp++;
    Game.newItem = generateRandomItem(iLvl);
    var itemModal = document.createElement('div');
    itemModal.classList.add('item-modal-container');

    var str = '\n      <div class="item-modal">\n        <div class="item-modal-top">\n          <h1>New Item!</h1>\n        </div>\n        <div class="item-modal-middle">\n          <div class="item-modal-middle-left">\n            <p>You Found</p>\n            <h2 class=\'' + Game.newItem.rarity + '\' style=\'font-size: xx-large\'>' + Game.newItem.name + '</h2>\n            <div class="item-modal-img">\n              <div class="pickaxe-aura aura-' + Game.newItem.rarity + '"></div>\n              <div class="pickaxe-top ' + Game.newItem.material + '"></div>\n              <div class="pickaxe-bottom"></div>\n            </div>\n            <div class="item-stats">\n              <p style=\'font-style: italic; font-size: small\'>' + Game.newItem.rarity + '</p>\n              <br/>\n              <p>Item Level: ' + Game.newItem.itemLevel + '</p>\n              <p>Damage: ' + beautify(Game.newItem.damage) + '</p>\n              ';
    if (Game.newItem.hasPrefix == true) {
      str += '\n                  <p>' + Game.newItem.prefixStat + ': ' + Math.floor(Game.newItem.prefixStatVal) + '</p>\n                ';
    }
    str += '\n            </div>\n          </div>\n          <div class="item-modal-middle-right">\n            <p>Currently Equipped</p>\n            <h2 class=\'' + Game.state.player.pickaxe.rarity + '\' style=\'font-size: xx-large\'>' + Game.state.player.pickaxe.name + '</h2>\n            <div class="item-modal-img">\n              <div class="pickaxe-aura aura-' + Game.state.player.pickaxe.rarity + '"></div>\n              <div class="pickaxe-top ' + Game.state.player.pickaxe.material + '"></div>\n              <div class="pickaxe-bottom"></div>\n            </div>\n            <div class="item-stats">\n              <p style=\'font-style: italic; font-size: small\'>' + Game.state.player.pickaxe.rarity + '</p>\n              <br/>\n              <p>Item Level: ' + Game.state.player.pickaxe.itemLevel + '</p>\n              <p>Damage: ' + beautify(Game.state.player.pickaxe.damage) + '</p>\n              ';
    if (Game.state.player.pickaxe.hasPrefix == true) {
      str += '\n                  <p>' + Game.state.player.pickaxe.prefixStat + ': ' + Math.floor(Game.state.player.pickaxe.prefixStatVal) + '</p>\n                ';
    }
    str += '\n            </div>\n          </div>\n        </div>\n        <div class="item-modal-bottom">\n          <button style=\'margin-right: 10px;\' onclick=Game.itemModalClick(\'equip\')>Equip</button>\n          <button style=\'margin-left: 10px;\' onclick=Game.itemModalClick()>Discard</button>\n        </div>\n      </div>\n    ';

    itemModal.innerHTML = str;
    s('body').appendChild(itemModal);
  };

  Game.itemModalClick = function (str) {

    if (str == 'equip') {
      Game.state.player.pickaxe = Game.newItem;
    }
    var itemContainer = s('.item-modal-container');
    itemContainer.parentNode.removeChild(itemContainer);
  };

  var buildInventory = function buildInventory() {
    var str = '';
    str += 'Ores: ' + beautify(Game.state.ores.toFixed(1));
    if (Game.state.oresPerSecond > 0) {
      str += ' (' + beautify(Game.state.oresPerSecond.toFixed(1)) + '/s)';
    }
    s('.ores').innerHTML = str;
    s('.level').innerHTML = 'Level: ' + Game.state.player.lvl + ' (' + Game.state.player.currentXp + '/' + Game.state.player.xpNeeded + ')';
  };

  var buildStore = function buildStore() {
    var str = '';
    str += '\n      <div class="upgrades-container">\n    ';
    var hasContent = 0;
    for (var i in Game.items) {
      var item = Game.items[i];
      if (item.type == 'upgrade') {
        if (item.hidden == 0) {
          hasContent = 1;
          str += '\n            <div class="upgrade-item-container" style=\'background-color: #b56535\'>\n              <div class="upgrade-item" onmouseover="Game.showTooltip(\'' + i + '\')" onmouseout="Game.hideTooltip()" onclick=\'Game.items["' + i + '"].buy()\' style=\'background: url(./assets/' + item.pic + '); background-size: 100%;\'></div>\n            </div>\n          ';
        }
      }
    }
    if (hasContent == 0) str += '<h3 style="text-align: center; width: 100%; opacity: .5">no upgrades available</h3>';
    str += '</div><div class="horizontal-separator" style=\'height: 8px;\'></div>';

    for (var _i in Game.items) {
      var _item = Game.items[_i];
      if (_item.type == 'item') {
        if (_item.hidden == 0) {
          str += '\n            <div class="button" onclick="Game.items[\'' + _i + '\'].buy()" onmouseover="Game.showTooltip(\'' + _i + '\', this)" onmouseout="Game.hideTooltip()">\n              <div class="button-top">\n                <div class="button-left">\n                  <img src="./assets/' + _item.pic + '" style=\'filter: brightness(100%); image-rendering: pixelated\'/>\n                </div>\n                <div class="button-middle">\n                  <h3 style=\'font-size: x-large\'>' + _item.name + '</h3>\n                  <p>cost: ' + beautify(_item.price.toFixed(0)) + ' ores</p>\n                </div>\n                <div class="button-right">\n                  <p style=\'font-size: xx-large\'>' + _item.owned + '</p>\n                </div>\n              </div>\n            </div>\n          ';
        }
        if (_item.hidden == 1) {
          str += '\n            <div class="button" style=\'cursor: not-allowed; box-shadow: 0 4px black; opacity: .7; filter: brightness(60%)\'>\n              <div class="button-top">\n                <div class="button-left">\n                  <img src="./assets/' + _item.pic + '" style=\'filter: brightness(0%)\'/>\n                </div>\n                <div class="button-middle">\n                  <h3 style=\'font-size: larger\'>???</h3>\n                  <p>cost: ??? ores</p>\n                </div>\n                <div class="button-right">\n                </div>\n              </div>\n            </div>\n          ';
        }
      }
    }
    s('.tab-content').innerHTML = str;
    loadAd();
  };

  Game.statsVisable = false;

  Game.buildStats = function () {
    var str = '';
    var inventoryPos = s('.inventory-section');
    var leftSeparatorPos = s('#left-separator');

    var statsContainer = s('.stats-container');
    statsContainer.style.top = inventoryPos.getBoundingClientRect().bottom + 10 + 'px';
    statsContainer.style.left = leftSeparatorPos.getBoundingClientRect().right + 'px';

    if (Game.statsVisable == true) {
      str += '\n        <div class="stats-container-header" onclick=\'Game.toggleStats();\'>\n          <h4>stats</h4>\n          <p class=\'caret\' style=\'font-size: 8px; float: right; margin-right: 5px; transform: rotate(180deg)\'>&#9660;</p>\n        </div>\n      ';
    } else {
      str += '\n        <div class="stats-container-header" onclick=\'Game.toggleStats()\'>\n          <h4>stats</h4>\n          <p class=\'caret\' style=\'font-size: 8px; float: right; margin-right: 5px\';>&#9660;</p>\n        </div>\n      ';
    }

    if (Game.statsVisable == true) {
      str += '<div class="stats-container-content-wrapper" style="height: 400px;">';
    } else {
      str += '<div class="stats-container-content-wrapper">';
    }

    str += '\n\n        <div class="stats-container-content">\n\n          <div class="stat-level-container">\n            <h1 style=\'flex-grow: 1\'>Level:</h1>\n            <h1 class=\'stat-player-lvl\'>' + Game.state.player.lvl + '</h1>\n          </div>\n\n          <hr/>\n\n          <div class="single-stat">\n            <p style=\'flex-grow: 1\' onmouseover=\'Game.showTooltip(null, null, "stat", "str")\' onmouseout=\'Game.hideTooltip()\'>Strength:</p>\n            <p class=\'stat-str\'>' + Game.state.player.str + '</p>\n            ';
    if (Game.state.player.availableSp > 0) {
      str += '<button onclick=\'Game.addStat("str")\' onmouseover=\'Game.showTooltip(null, null, "stat", "str")\' onmouseout=\'Game.hideTooltip()\'>+</button>';
    }

    str += '\n          </div>\n\n          <div class="single-stat">\n            <p style=\'flex-grow: 1\' onmouseover=\'Game.showTooltip(null, null, "stat", "dex")\' onmouseout=\'Game.hideTooltip()\'>Dexterity:</p>\n            <p class=\'stat-dex\'>' + Game.state.player.dex + '</p>\n            ';
    if (Game.state.player.availableSp > 0) {
      str += '<button onclick=\'Game.addStat("dex")\' onmouseover=\'Game.showTooltip(null, null, "stat", "dex")\' onmouseout=\'Game.hideTooltip()\'>+</button>';
    }

    str += '\n          </div>\n\n          <div class="single-stat">\n            <p style=\'flex-grow: 1\' onmouseover=\'Game.showTooltip(null, null, "stat", "int")\' onmouseout=\'Game.hideTooltip()\'>Intelligence:</p>\n            <p class=\'stat-int\'>' + Game.state.player.int + '</p>\n            ';
    if (Game.state.player.availableSp > 0) {
      str += '<button onclick=\'Game.addStat("int")\' onmouseover=\'Game.showTooltip(null, null, "stat", "int")\' onmouseout=\'Game.hideTooltip()\'>+</button>';
    }

    str += '\n          </div>\n\n          <div class="single-stat">\n            <p style=\'flex-grow: 1\' onmouseover=\'Game.showTooltip(null, null, "stat", "luk")\' onmouseout=\'Game.hideTooltip()\'>Luck:</p>\n            <p class=\'stat-luk\'>' + Game.state.player.luk + '</p>\n            ';
    if (Game.state.player.availableSp > 0) {
      str += '<button onclick=\'Game.addStat("luk")\' onmouseover=\'Game.showTooltip(null, null, "stat", "luk")\' onmouseout=\'Game.hideTooltip()\'>+</button>';
    }

    str += '\n          </div>\n\n          <div class="single-stat">\n            <p style=\'flex-grow: 1\' onmouseover=\'Game.showTooltip(null, null, "stat", "cha")\' onmouseout=\'Game.hideTooltip()\'>Charisma:</p>\n            <p class=\'stat-cha\'>' + Game.state.player.cha + '</p>\n            ';
    if (Game.state.player.availableSp > 0) {
      str += '<button onclick=\'Game.addStat("cha")\' onmouseover=\'Game.showTooltip(null, null, "stat", "cha")\' onmouseout=\'Game.hideTooltip()\'>+</button>';
    }

    str += '\n          </div>\n\n          <br/>\n\n          <p style=\'text-align: center; font-size: small\'>Available SP: ' + Game.state.player.availableSp + '</p>\n\n          <hr/>\n          <br/>\n\n          <div style=\'width: 100%; border: 1px solid white; cursor: pointer; display: flex; flex-flow: row-nowrap; align-items: center; justify-content: center;\'>\n            <img src="./assets/lock.svg" alt="" height="30px" style=\'filter: invert(100%)\'/>\n            <p style=\'flex-grow: 1\'>Classes lv. 10</p>\n          </div>\n\n          <br/>\n          <hr/>\n          <p>Miscellaneous</p>\n          <p>Ore Clicks: ' + Game.state.stats.oreClicks + '</p>\n          <p>Ore Crit Clicks: ' + Game.state.stats.oreCritClicks + '</p>\n          <p>Rocks Destroyed: ' + Game.state.stats.rocksDestroyed + '</p>\n          <p>Items Picked Up: ' + Game.state.stats.itemsPickedUp + '</p>\n        </div>\n      </div>\n    ';

    statsContainer.innerHTML = str;
  };

  Game.toggleStats = function () {
    if (s('.stats-container-content-wrapper').style.height == 0 || s('.stats-container-content-wrapper').style.height == '0px') {
      s('.stats-container-content-wrapper').style.height = '400px';
      s('.caret').style.transform = 'rotate(180deg)';
      Game.statsVisable = true;
    } else {
      s('.stats-container-content-wrapper').style.height = 0;
      s('.caret').style.transform = 'rotate(0deg)';
      Game.statsVisable = false;
    }
  };

  Game.showTooltip = function (itemName, anchorPoint, type, stat) {
    var item = void 0;
    if (itemName) {
      item = Game.items[itemName];
    }
    var tooltip = s('.tooltip');
    var anchor = s('#main-separator').getBoundingClientRect();

    tooltip.classList.add('tooltip-container');
    tooltip.style.display = 'block';
    tooltip.style.width = '300px';
    tooltip.style.background = '#222';
    tooltip.style.border = '1px solid white';
    tooltip.style.color = 'white';
    tooltip.style.position = 'absolute';
    tooltip.style.left = anchor.left - tooltip.getBoundingClientRect().width + 'px';

    if (document.querySelector('#anchor-point')) {
      tooltip.style.top = s('#anchor-point').getBoundingClientRect().bottom + 'px';
    } else {
      tooltip.style.top = s('.stat-sheet').getBoundingClientRect().top + 'px';
    }

    if (anchorPoint) {
      tooltip.style.top = anchorPoint.getBoundingClientRect().top + 'px';
    }

    if (type == 'stat') {
      anchor = s('.stats-container-content-wrapper').getBoundingClientRect();
      tooltip.style.width = 'auto';
      tooltip.style.left = anchor.right + 'px';
      tooltip.style.top = event.clientY + 'px';

      if (stat == 'str') {
        tooltip.innerHTML = '\n          <h3>Strength</h3>\n          <hr/>\n          <p>Increases your OpC</p>\n        ';
      }
      if (stat == 'dex') {
        tooltip.innerHTML = '\n          <h3>Dexterity</h3>\n          <hr/>\n          <p>Increases your OpC slightly</p>\n          <p>Chance for critical strikes</p>\n        ';
      }
      if (stat == 'int') {
        tooltip.innerHTML = '\n          <h3>Intelligence</h3>\n          <hr/>\n          <p>Increases item output slightly</p>\n          <p>Chance for critical strikes</p>\n        ';
      }
      if (stat == 'luk') {
        tooltip.innerHTML = '\n          <h3>Luck</h3>\n          <hr/>\n          <p>Increases item rarity percentage</p>\n          <p>Increases item drop chance</p>\n        ';
      }
      if (stat == 'cha') {
        tooltip.innerHTML = '\n          <h3>Charisma</h3>\n          <hr/>\n          <p>Increases item output</p>\n          <p>Lowers shop prices</p>\n        ';
      }
    } else {
      tooltip.innerHTML = '\n      <div class="tooltip-top">\n        <img src="./assets/' + item.pic + '" height=\'40px\' alt="" />\n        <h3 style=\'flex-grow: 1\'>' + item.name + '</h3>\n        <p>' + beautify(item.price.toFixed(0)) + ' ores</p>\n      </div>\n      <div class="tooltip-bottom">\n        <hr />\n        <p>' + item.desc + '</p>\n\n        ';

      if (item.type == 'item') {
        if (item.owned > 0) {
          tooltip.innerHTML += '\n              <hr />\n              <p>Each ' + item.name + ' generates ' + beautify(item.production) + ' OpS</p>\n              <p><span class=\'bold\'>' + item.owned + '</span> ' + item.name + ' generating <span class=\'bold\'>' + beautify((item.production * item.owned).toFixed(1)) + '</span> ores per second</p>\n            ';
        }
      }

      tooltip.innerHTML += '\n\n      </div>\n    ';
    }
  };

  Game.hideTooltip = function () {
    s('.tooltip').style.display = 'none';
  };

  Game.addStat = function (stat) {
    if (Game.state.player.availableSp > 0) {
      Game.state.player.availableSp--;
      if (stat == 'str') Game.state.player.str++;
      if (stat == 'luk') Game.state.player.luk++;
      if (stat == 'dex') Game.state.player.dex++;
      if (stat == 'int') Game.state.player.int++;
      if (stat == 'cha') Game.state.player.cha++;
      Game.buildStats();
      if (Game.state.player.availableSp == 0) {
        Game.hideTooltip();
      }
    }
  };

  var unlockUpgrades = function unlockUpgrades(name) {
    var upgrade = Game.items[name];
    if (upgrade.owned <= 0) {
      if (upgrade.hidden != 0) {
        upgrade.hidden = 0;
        buildStore();
      }
    }
  };

  var adsLoaded = false;
  var loadAd = function loadAd() {
    if (adsLoaded == false) {
      adsLoaded = true;
      for (var i = 0; i < 3; i++) {
        var script = document.createElement('script');
        script.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        var ins = document.createElement('ins');
        ins.classList.add('adsbygoogle');
        ins.style.display = 'block';
        ins.setAttribute('data-ad-client', 'ca-pub-4584563958870163');
        ins.setAttribute('data-ad-slot', '6565116738');

        var div = s('#ads-im-sorry-please-dont-hate-me');
        div.appendChild(script);
        div.appendChild(ins);

        if (s('ins').style.display == 'block') {
          ins.setAttribute('data-ad-format', 'rectangle, horizontal');
          (adsbygoogle = window.adsbygoogle || []).push({});
        }
        s('.tab-content-container').appendChild(div);
      }
    }
  };

  var buyFunction = function buyFunction(item) {
    // ITEMS
    if (item.name == 'Magnifying Glass') {
      oreClickArea();
      item.hidden = 2;
      unlockUpgrades('CleanMagnifyingGlass');
    }
    if (item.name == 'School') {
      if (item.owned == 1) {
        Game.items['Farm'].hidden = 0;
        Game.items['Quarry'].hidden = 1;
        Game.items['Church'].hidden = 1;
      }
    }
    if (item.name == 'Farm') {
      if (item.owned == 1) {
        Game.items['Quarry'].hidden = 0;
        Game.items['Church'].hidden = 1;
        Game.items['Factory'].hidden = 1;
      }
    }
    if (item.name == 'Quarry') {
      if (item.owned == 1) {
        Game.items['Church'].hidden = 0;
        Game.items['Factory'].hidden = 1;
        Game.items['Crypt'].hidden = 1;
      }
    }
    if (item.name == 'Church') {
      if (item.owned == 1) {
        Game.items['Factory'].hidden = 0;
        Game.items['Crypt'].hidden = 1;
        Game.items['Hospital'].hidden = 1;
      }
    }
    if (item.name == 'Factory') {
      if (item.owned == 1) {
        Game.items['Crypt'].hidden = 0;
        Game.items['Hospital'].hidden = 1;
        Game.items['Citadel'].hidden = 1;
      }
    }
    if (item.name == 'Crypt') {
      if (item.owned == 1) {
        Game.items['Hospital'].hidden = 0;
        Game.items['Citadel'].hidden = 1;
        Game.items['XenoSpaceship'].hidden = 1;
      }
    }
    if (item.name == 'Hospital') {
      if (item.owned == 1) {
        Game.items['Citadel'].hidden = 0;
        Game.items['XenoSpaceship'].hidden = 1;
        Game.items['SkyCastle'].hidden = 1;
      }
    }
    if (item.name == 'Citadel') {
      if (item.owned == 1) {
        Game.items['XenoSpaceship'].hidden = 0;
        Game.items['SkyCastle'].hidden = 1;
        Game.items['EonPortal'].hidden = 1;
      }
    }
    if (item.name == 'Xeno Spaceship') {
      if (item.owned == 1) {
        Game.items['SkyCastle'].hidden = 0;
        Game.items['EonPortal'].hidden = 1;
        Game.items['SacredMines'].hidden = 1;
      }
    }
    if (item.name == 'Sky Castle') {
      if (item.owned == 1) {
        Game.items['EonPortal'].hidden = 0;
        Game.items['SacredMines'].hidden = 1;
        Game.items['O.A.R.D.I.S.'].hidden = 1;
      }
    }
    if (item.name == 'Eon Portal') {
      if (item.owned == 1) {
        Game.items['SacredMines'].hidden = 0;
        Game.items['O.A.R.D.I.S.'].hidden = 1;
      }
    }
    if (item.name == 'Sacred Mines') {
      if (item.owned == 1) {
        Game.items['O.A.R.D.I.S.'].hidden = 0;
      }
    }

    // ITEM UPGRADES
    if (item.name == 'Clean Magnifying Glass') {
      item.hidden = 1;
      Game.state.oreClickMultiplier = 10;
    }

    // UPGRADES
    if (item.name == 'Work Boots') {
      item.hidden = 1;
      Game.state.opsMultiplier += .1;
      Game.state.opcMultiplier += .1;
    }
    if (item.name == 'Painkillers') {
      item.hidden = 1;
      Game.state.opcMultiplier += 2;
      Game.items['Steroids'].hidden = 0;
    }
    if (item.name == 'Steroids') {
      item.hidden = 1;
      Game.state.opcMultiplier += 2;
    }
  };

  var Item = function Item(obj, id) {
    var _this = this;

    // this.id = id
    this.name = obj.name;
    this.functionName = obj.name.replace(/ /g, '');
    this.type = obj.type;
    this.pic = obj.pic;
    this.production = obj.production || 0;
    this.desc = obj.desc;
    this.fillerQuote = obj.fillerQuote;
    this.basePrice = obj.basePrice;
    this.price = obj.price;
    this.hidden = obj.hidden;
    this.owned = obj.owned || 0;

    this.buy = function () {
      if (Game.state.ores >= _this.price) {
        spend(_this.price);
        _this.owned++;
        playSound('buysound');
        _this.price = _this.basePrice * Math.pow(1.15, _this.owned);
        buyFunction(_this);
        if (_this.type == 'upgrade') {
          Game.hideTooltip();
        }
        buildInventory();
        risingNumber(0, 'spendMoney');
        generateStoreItems();
        buildStore();
      }
    };

    Game.items[this.functionName] = this;
  };

  Game.items = [];
  // ITEMS
  Game.items['MagnifyingGlass'] = {
    name: 'Magnifying Glass',
    type: 'item',
    pic: 'magnifying-glass.png',
    desc: 'Allows you to spot weakpoints inside the rock',
    fillerQuote: 'wip',
    price: 1,
    basePrice: 1,
    hidden: 0
  };
  Game.items['School'] = {
    name: 'School',
    type: 'item',
    pic: 'wip.png',
    production: .3,
    desc: 'wip',
    fillerQuote: 'wip',
    price: 6,
    basePrice: 6,
    hidden: 0
  };
  Game.items['Farm'] = {
    name: 'Farm',
    type: 'item',
    pic: 'farmer.png',
    production: 1,
    desc: 'wip',
    fillerQuote: 'wip',
    price: 75,
    basePrice: 75,
    hidden: 1
  };
  Game.items['Quarry'] = {
    name: 'Quarry',
    type: 'item',
    pic: 'wip.png',
    production: 21,
    desc: 'wip',
    fillerQuote: 'wip',
    price: 1200,
    basePrice: 1200,
    hidden: 1
  };
  Game.items['Church'] = {
    name: 'Church',
    type: 'item',
    pic: 'wip.png',
    production: 300,
    desc: 'wip',
    fillerQuote: 'wip',
    price: 6660,
    basePrice: 6660,
    hidden: 2
  };
  Game.items['Factory'] = {
    name: 'Factory',
    type: 'item',
    pic: 'wip.png',
    production: 5500,
    desc: 'wip',
    fillerQuote: 'wip',
    price: 48000,
    basePrice: 48000,
    hidden: 2
  };
  Game.items['Crypt'] = {
    name: 'Crypt',
    type: 'item',
    pic: 'wip.png',
    production: 30000,
    desc: 'wip',
    fillerQuote: 'wip',
    price: 290000,
    basePrice: 290000,
    hidden: 2
  };
  Game.items['Hospital'] = {
    name: 'Hospital',
    type: 'item',
    pic: 'wip.png',
    production: 220000,
    desc: 'wip',
    fillerQuote: 'wip',
    price: 1000000,
    basePrice: 1000000,
    hidden: 2
  };
  Game.items['Citadel'] = {
    name: 'Citadel',
    type: 'item',
    pic: 'wip.png',
    production: 1666666,
    desc: 'wip',
    fillerQuote: 'wip',
    price: 66666666,
    basePrice: 66666666,
    hidden: 2
  };
  Game.items['XenoSpaceship'] = {
    name: 'Xeno Spaceship',
    type: 'item',
    pic: 'wip.png',
    production: 45678910,
    desc: 'wip',
    fillerQuote: 'wip',
    price: 758492047,
    basePrice: 758492047,
    hidden: 2
  };
  Game.items['SkyCastle'] = {
    name: 'Sky Castle',
    type: 'item',
    pic: 'wip.png',
    production: 777777777,
    desc: 'wip',
    fillerQuote: 'wip',
    price: 5500000000,
    basePrice: 5500000000,
    hidden: 2
  };
  Game.items['EonPortal'] = {
    name: 'Eon Portal',
    type: 'item',
    pic: 'wip.png',
    production: 8888800000,
    desc: 'wip',
    fillerQuote: 'wip',
    price: 79430000000,
    basePrice: 79430000000,
    hidden: 2
  };
  Game.items['SacredMines'] = {
    name: 'Sacred Mines',
    type: 'item',
    pic: 'wip.png',
    production: 40501030500,
    desc: 'wip',
    fillerQuote: 'wip',
    price: 300000000000,
    basePrice: 300000000000,
    hidden: 2
  };
  Game.items['O.A.R.D.I.S.'] = {
    name: 'O.A.R.D.I.S.',
    type: 'item',
    pic: 'wip.png',
    production: 110100110110,
    desc: 'wip',
    fillerQuote: 'wip',
    price: 9999999999999,
    basePrice: 9999999999999,
    hidden: 2

    // ITEM UPGRADES
  };Game.items['CleanMagnifyingGlass'] = {
    name: 'Clean Magnifying Glass',
    type: 'upgrade',
    pic: 'clean-magnifying-glass.png',
    desc: 'Increases critical hit multiplier to 10x',
    fillerQuote: 'wip',
    price: 100,
    hidden: 1

    // UPGRADES
  };Game.items['WorkBoots'] = {
    name: 'Work Boots',
    type: 'upgrade',
    pic: 'wip.png',
    desc: 'Increase all ore production by 1%',
    fillerQuote: 'wip',
    price: 500,
    hidden: 1
  };
  Game.items['Painkillers'] = {
    name: 'Painkillers',
    type: 'upgrade',
    pic: 'painkillers.png',
    desc: 'double your OpC',
    fillerQuote: 'wip',
    price: 15000,
    hidden: 1
  };
  Game.items['Steroids'] = {
    name: 'Steroids',
    type: 'upgrade',
    pic: 'steroids.png',
    desc: 'double your OpC',
    fillerQuote: 'wip',
    price: 1000000,
    hidden: 1
  };

  var generateStoreItems = function generateStoreItems() {
    for (var i in Game.items) {
      new Item(Game.items[i]);
    }
  };

  var soundPlayed1 = false;
  var soundPlayed2 = false;
  var soundPlayed3 = false;
  var soundPlayed4 = false;
  var soundPlayed5 = false;
  var whichPic = Math.floor(Math.random() * 4) + 1;
  var updatePercentage = function updatePercentage(amount) {
    if (Game.state.oreCurrentHp - amount > 0) {
      Game.state.oreCurrentHp -= amount;
      s('.ore-hp').innerHTML = (Game.state.oreCurrentHp / Game.state.oreHp * 100).toFixed(0) + '%';

      if (Game.state.oreCurrentHp / Game.state.oreHp > .8) {
        s('.ore').style.background = 'url("./assets/ore' + whichPic + '-1.png")';
        s('.ore').style.backgroundSize = 'cover';
      }
      if (Game.state.oreCurrentHp / Game.state.oreHp <= .8 && soundPlayed1 == false) {
        s('.ore').style.background = 'url("assets/ore' + whichPic + '-2.png")';
        s('.ore').style.backgroundSize = 'cover';
        playSound('explosion');
        soundPlayed1 = true;
      }
      if (Game.state.oreCurrentHp / Game.state.oreHp <= .6 && soundPlayed2 == false) {
        s('.ore').style.background = 'url("assets/ore' + whichPic + '-3.png")';
        s('.ore').style.backgroundSize = 'cover';
        playSound('explosion');
        soundPlayed2 = true;
      }
      if (Game.state.oreCurrentHp / Game.state.oreHp <= .4 && soundPlayed3 == false) {
        s('.ore').style.background = 'url("assets/ore' + whichPic + '-4.png")';
        s('.ore').style.backgroundSize = 'cover';
        playSound('explosion');
        soundPlayed3 = true;
      }
      if (Game.state.oreCurrentHp / Game.state.oreHp <= .2 && soundPlayed4 == false) {
        s('.ore').style.background = 'url("assets/ore' + whichPic + '-5.png")';
        s('.ore').style.backgroundSize = 'cover';
        playSound('explosion');
        soundPlayed4 = true;
      }
    } else {
      Game.state.stats.rocksDestroyed++;
      playSound('explosion2');
      Game.state.oreHp = Math.pow(Game.state.oreHp, 1.15);
      Game.state.oreCurrentHp = Game.state.oreHp;
      dropItem();
      s('.ore-hp').innerHTML = '100%';
      soundPlayed1 = false;
      soundPlayed2 = false;
      soundPlayed3 = false;
      soundPlayed4 = false;
      soundPlayed5 = false;
      whichPic = Math.floor(Math.random() * 4) + 1;
      s('.ore').style.background = 'url("./assets/ore' + whichPic + '-1.png")';
      s('.ore').style.backgroundSize = 'cover';
    }
  };

  var oreClickArea = function oreClickArea() {
    var randomNumber = function randomNumber() {
      return Math.floor(Math.random() * 80) + 1;
    };
    var orePos = s('.ore').getBoundingClientRect();
    var randomSign = Math.round(Math.random()) * 2 - 1;
    var centerX = (orePos.left + orePos.right) / 2;
    var centerY = (orePos.top + orePos.bottom) / 2;
    var randomX = centerX + randomNumber() * randomSign;
    var randomY = centerY + randomNumber() * randomSign;

    s('.ore-click-area').style.left = randomX + 'px';
    s('.ore-click-area').style.top = randomY + 'px';
    s('.ore-click-area').style.display = 'block';
  };

  var gainXp = function gainXp(amt) {
    var amount = 1;
    if (amt) {
      amount = 2;
    }
    if (Game.state.player.currentXp < Game.state.player.xpNeeded) {
      Game.state.player.currentXp += amount;
    } else {
      Game.state.player.currentXp = 0;
      Game.state.player.lvl++;
      Game.state.player.availableSp += 3;
      Game.buildStats();
      playSound('levelup');
      Game.state.player.xpNeeded = Math.ceil(Math.pow(Game.state.player.xpNeeded, 1.05));
      risingNumber(0, 'level');
    }
    buildInventory();
  };

  var risingNumber = function risingNumber(amount, type) {
    var mouseX = (s('.ore').getBoundingClientRect().left + s('.ore').getBoundingClientRect().right) / 2;
    var mouseY = (s('.ore').getBoundingClientRect().top + s('.ore').getBoundingClientRect().bottom) / 2;
    if (event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
    }
    var randomNumber = Math.floor(Math.random() * 20) + 1;
    var randomSign = Math.round(Math.random()) * 2 - 1;
    var randomMouseX = mouseX + randomNumber * randomSign;

    var risingNumber = document.createElement('div');
    risingNumber.classList.add('rising-number');
    risingNumber.innerHTML = '+' + beautify(amount.toFixed(1));
    risingNumber.style.left = randomMouseX + 'px';
    risingNumber.style.top = mouseY + 'px';

    risingNumber.style.position = 'absolute';
    risingNumber.style.fontSize = '15px';
    risingNumber.style.animation = 'risingNumber 2s ease-out';
    risingNumber.style.animationFillMode = 'forwards';
    risingNumber.style.pointerEvents = 'none';
    risingNumber.style.color = 'white';

    if (type == 'crit') {
      risingNumber.style.fontSize = 'xx-large';
    }

    if (type == 'level') {
      risingNumber.style.fontSize = 'xx-large';
      risingNumber.innerHTML = 'LEVEL UP';
    }

    if (type == 'spendMoney') {
      risingNumber.style.fontSize = 'xx-large';
      risingNumber.innerHTML = '-$';
      risingNumber.style.color = 'red';
    }

    s('.particles').appendChild(risingNumber);

    setTimeout(function () {
      risingNumber.parentNode.removeChild(risingNumber);
    }, 2000);
  };

  var drawRockParticles = function drawRockParticles() {
    var _loop = function _loop(i) {
      var div = document.createElement('div');
      div.classList.add('particle');
      div.style.background = 'lightgrey';
      var x = event.clientX;
      var y = event.clientY;
      div.style.left = x + 'px';
      div.style.top = y + 'px';

      var particleY = y;
      var particleX = x;

      var randomNumber = Math.random();
      var randomSign = Math.round(Math.random()) * 2 - 1;

      var particleUp = setInterval(function () {
        particleX += randomNumber * randomSign;
        particleY -= 1;
        div.style.top = particleY + 'px';
        div.style.left = particleX + 'px';
      }, 10);

      setTimeout(function () {
        clearInterval(particleUp);

        var particleDown = setInterval(function () {
          particleX += randomNumber * randomSign / 2;
          particleY += 1.5;
          div.style.top = particleY + 'px';
          div.style.left = particleX + 'px';
        }, 10);

        setTimeout(function () {
          clearInterval(particleDown);
          div.parentNode.removeChild(div);
        }, 1000);
      }, 100);

      s('body').appendChild(div);
    };

    for (var i = 0; i < 3; i++) {
      _loop(i);
    }
  };

  s('.ore').onclick = function () {
    var amt = calculateOPC();
    earn(amt);
    gainXp();
    risingNumber(amt);
    playSound('ore-hit');
    updatePercentage(amt);
    buildInventory();
    drawRockParticles();
    Game.state.stats.oreClicks++;
    if (Game.statsVisable) Game.buildStats();
    if (Game.state.stats.oreClicks >= 10) unlockUpgrades('WorkBoots');
    if (Game.state.stats.oreClicks >= 100) unlockUpgrades('Painkillers');
    if (document.querySelector('.click-me-container')) {
      var clickMeContainer = s('.click-me-container');
      clickMeContainer.parentNode.removeChild(clickMeContainer);
    }
  };

  s('.ore-click-area').onclick = function () {
    var amt = calculateOPC('crit');
    Game.state.stats.oreClicks++;
    Game.state.stats.oreCritClicks++;
    earn(amt);
    gainXp(3);
    risingNumber(amt, 'crit');
    playSound('ore-crit-hit');
    updatePercentage(amt);
    buildInventory();
    drawRockParticles();
    oreClickArea();
  };

  // INIT SHIT
  buildInventory();
  Game.buildStats();
  generateStoreItems();
  buildStore();
  Game.load();
  Game.buildStats();
  setInterval(function () {
    gainXp();
    Game.state.stats.timePlayed++;
  }, 1000);
  setInterval(function () {
    Game.save();
  }, 1000 * 30);
  updatePercentage(0);
  setInterval(function () {
    earnOPS();
  }, 1000 / 30);
  window.onresize = function () {
    if (Game.items['MagnifyingGlass'].owned > 0) {
      oreClickArea();
    }
  };
  if (Game.state.stats.oreClicks == 0) {
    var clickMeContainer = s('.click-me-container');
    var orePos = s('.ore').getBoundingClientRect();
    clickMeContainer.style.top = (orePos.top + orePos.bottom) / 2 + 'px';
    clickMeContainer.innerHTML = '\n      <div class="click-me-left">\n        <p style=\'text-align: center;\'>Click me!</p>\n      </div>\n      <div class="click-me-right"></div>\n    ';
    clickMeContainer.style.left = orePos.left - clickMeContainer.getBoundingClientRect().width + 'px';
    s('body').appendChild(clickMeContainer);
  }
  if (Game.items['MagnifyingGlass'].owned > 0) oreClickArea();
};

window.onload = function () {
  Game.launch();
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFFQSxJQUFJLElBQUssU0FBTCxDQUFLLENBQUMsRUFBRCxFQUFRO0FBQUMsU0FBTyxTQUFTLGFBQVQsQ0FBdUIsRUFBdkIsQ0FBUDtBQUFrQyxDQUFwRDs7QUFFQSxJQUFJLFdBQVcsU0FBWCxRQUFXLENBQUMsR0FBRCxFQUFTOztBQUV0QixNQUFJLE1BQU0sT0FBVixFQUFtQjtBQUNqQixXQUFPLElBQUksUUFBSixHQUFlLE9BQWYsQ0FBdUIsdUJBQXZCLEVBQWdELEdBQWhELENBQVAsQ0FEaUIsQ0FDNEM7QUFDOUQsR0FGRCxNQUVPO0FBQ0wsUUFBSSxPQUFPLE9BQVAsSUFBa0IsTUFBTSxVQUE1QixFQUF3QztBQUN0QyxhQUFPLENBQUMsTUFBSSxPQUFMLEVBQWMsT0FBZCxDQUFzQixDQUF0QixJQUEyQixVQUFsQztBQUNEO0FBQ0QsUUFBSSxPQUFPLFVBQVAsSUFBcUIsTUFBTSxhQUEvQixFQUE4QztBQUM1QyxhQUFPLENBQUMsTUFBSSxVQUFMLEVBQWlCLE9BQWpCLENBQXlCLENBQXpCLElBQThCLFVBQXJDO0FBQ0Q7QUFDRCxRQUFJLE9BQU8sYUFBUCxJQUF3QixNQUFNLGdCQUFsQyxFQUFvRDtBQUNsRCxhQUFPLENBQUMsTUFBSSxhQUFMLEVBQW9CLE9BQXBCLENBQTRCLENBQTVCLElBQWlDLFdBQXhDO0FBQ0Q7QUFDRCxRQUFJLE9BQU8sZ0JBQVAsSUFBMkIsTUFBTSxtQkFBckMsRUFBMEQ7QUFDeEQsYUFBTyxDQUFDLE1BQUksZ0JBQUwsRUFBdUIsT0FBdkIsQ0FBK0IsQ0FBL0IsSUFBb0MsY0FBM0M7QUFDRDtBQUNELFFBQUksT0FBTyxtQkFBUCxJQUE4QixNQUFNLHNCQUF4QyxFQUFnRTtBQUM5RCxhQUFPLENBQUMsTUFBSSxtQkFBTCxFQUEwQixPQUExQixDQUFrQyxDQUFsQyxJQUF1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VUFBakI7QUFDRCxHQUhELEVBR0csSUFISDtBQUlBLGNBQVksWUFBTTtBQUNoQixTQUFLLElBQUw7QUFDRCxHQUZELEVBRUcsT0FBTyxFQUZWO0FBR0EsbUJBQWlCLENBQWpCO0FBQ0EsY0FBWSxZQUFNO0FBQ2hCO0FBQ0QsR0FGRCxFQUVHLE9BQU8sRUFGVjtBQUdBLFNBQU8sUUFBUCxHQUFrQixZQUFNO0FBQ3RCLFFBQUksS0FBSyxLQUFMLENBQVcsaUJBQVgsRUFBOEIsS0FBOUIsR0FBc0MsQ0FBMUMsRUFBNkM7QUFDM0M7QUFDRDtBQUNGLEdBSkQ7QUFLQSxNQUFJLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsU0FBakIsSUFBOEIsQ0FBbEMsRUFBcUM7QUFDbkMsUUFBSSxtQkFBbUIsRUFBRSxxQkFBRixDQUF2QjtBQUNBLFFBQUksU0FBUyxFQUFFLE1BQUYsRUFBVSxxQkFBVixFQUFiO0FBQ0EscUJBQWlCLEtBQWpCLENBQXVCLEdBQXZCLEdBQTZCLENBQUMsT0FBTyxHQUFQLEdBQWEsT0FBTyxNQUFyQixJQUE2QixDQUE3QixHQUFpQyxJQUE5RDtBQUNBLHFCQUFpQixTQUFqQjtBQU1BLHFCQUFpQixLQUFqQixDQUF1QixJQUF2QixHQUE4QixPQUFPLElBQVAsR0FBYyxpQkFBaUIscUJBQWpCLEdBQXlDLEtBQXZELEdBQStELElBQTdGO0FBQ0EsTUFBRSxNQUFGLEVBQVUsV0FBVixDQUFzQixnQkFBdEI7QUFDRDtBQUNELE1BQUksS0FBSyxLQUFMLENBQVcsaUJBQVgsRUFBOEIsS0FBOUIsR0FBc0MsQ0FBMUMsRUFBNkM7QUFDOUMsQ0E1NUNEOztBQTg1Q0EsT0FBTyxNQUFQLEdBQWdCLFlBQU07QUFDcEIsT0FBSyxNQUFMO0FBQ0QsQ0FGRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBIZWxwZXIgU2hpdFxuXG5sZXQgcyA9ICgoZWwpID0+IHtyZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbCl9KVxuXG5sZXQgYmVhdXRpZnkgPSAobnVtKSA9PiB7XG5cbiAgaWYgKG51bSA8IDEwMDAwMDApIHtcbiAgICByZXR1cm4gbnVtLnRvU3RyaW5nKCkucmVwbGFjZSgvXFxCKD89KFxcZHszfSkrKD8hXFxkKSkvZywgXCIsXCIpOyAvL2ZvdW5kIG9uIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI5MDExMDIvaG93LXRvLXByaW50LWEtbnVtYmVyLXdpdGgtY29tbWFzLWFzLXRob3VzYW5kcy1zZXBhcmF0b3JzLWluLWphdmFzY3JpcHRcbiAgfSBlbHNlIHtcbiAgICBpZiAobnVtID49IDEwMDAwMDAgJiYgbnVtIDwgMTAwMDAwMDAwMCkge1xuICAgICAgcmV0dXJuIChudW0vMTAwMDAwMCkudG9GaXhlZCgzKSArICcgTWlsbGlvbidcbiAgICB9XG4gICAgaWYgKG51bSA+PSAxMDAwMDAwMDAwICYmIG51bSA8IDEwMDAwMDAwMDAwMDApIHtcbiAgICAgIHJldHVybiAobnVtLzEwMDAwMDAwMDApLnRvRml4ZWQoMykgKyAnIEJpbGxpb24nXG4gICAgfVxuICAgIGlmIChudW0gPj0gMTAwMDAwMDAwMDAwMCAmJiBudW0gPCAxMDAwMDAwMDAwMDAwMDAwKSB7XG4gICAgICByZXR1cm4gKG51bS8xMDAwMDAwMDAwMDAwKS50b0ZpeGVkKDMpICsgJyBUcmlsbGlvbidcbiAgICB9XG4gICAgaWYgKG51bSA+PSAxMDAwMDAwMDAwMDAwMDAwICYmIG51bSA8IDEwMDAwMDAwMDAwMDAwMDAwMDApIHtcbiAgICAgIHJldHVybiAobnVtLzEwMDAwMDAwMDAwMDAwMDApLnRvRml4ZWQoMykgKyAnIFF1YWRyaWxsaW9uJ1xuICAgIH1cbiAgICBpZiAobnVtID49IDEwMDAwMDAwMDAwMDAwMDAwMDAgJiYgbnVtIDwgMTAwMDAwMDAwMDAwMDAwMDAwMDAwMCkge1xuICAgICAgcmV0dXJuIChudW0vMTAwMDAwMDAwMDAwMDAwMDAwMCkudG9GaXhlZCgzKSArICcgUXVpbnRpbGxpb24nXG4gICAgfVxuICAgIGlmIChudW0gPj0gMTAwMDAwMDAwMDAwMDAwMDAwMDAwMCAmJiBudW0gPCAxMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwKSB7XG4gICAgICByZXR1cm4gKG51bS8xMDAwMDAwMDAwMDAwMDAwMDAwMDAwKS50b0ZpeGVkKDMpICsgJyBTZXh0aWxsaW9uJ1xuICAgIH1cbiAgfVxufVxuXG4vLyBHYW1lXG5cbmxldCBHYW1lID0ge31cblxud2luZG93LkdhbWUgPSBHYW1lO1xuXG5HYW1lLmxhdW5jaCA9ICgpID0+IHtcblxuICBHYW1lLnN0YXRlID0ge1xuICAgIG9yZXM6IDAsXG4gICAgb3JlSHA6IDUwLFxuICAgIG9yZUN1cnJlbnRIcDogNTAsXG4gICAgb3Jlc1BlclNlY29uZDogMCxcbiAgICBvcHNNdWx0aXBsaWVyOiAwLFxuICAgIG9wY011bHRpcGxpZXI6IDAsXG4gICAgb3JlQ2xpY2tNdWx0aXBsaWVyOiA1LFxuICAgIHBsYXllcjoge1xuICAgICAgbHZsOiAxLFxuICAgICAgc3RyOiAwLFxuICAgICAgZGV4OiAwLFxuICAgICAgbHVrOiAwLFxuICAgICAgaW50OiAwLFxuICAgICAgY2hhOiAwLFxuICAgICAgY3VycmVudFhwOiAwLFxuICAgICAgeHBOZWVkZWQ6IDEwMCxcbiAgICAgIGF2YWlsYWJsZVNwOiAwLFxuICAgICAgcGlja2F4ZToge1xuICAgICAgICBuYW1lOiAnQmVnaW5uZXJzIFdvb2QgUGlja2F4ZScsXG4gICAgICAgIHJhcml0eTogJ0NvbW1vbicsXG4gICAgICAgIGl0ZW1MZXZlbDogMSxcbiAgICAgICAgbWF0ZXJpYWw6ICdXb29kJyxcbiAgICAgICAgZGFtYWdlOiAxXG4gICAgICB9LFxuICAgICAgYWNjZXNvcnk6IHt9XG4gICAgfSxcbiAgICB0YWJzOiBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdzdG9yZScsXG4gICAgICAgIGxvY2tlZDogZmFsc2VcbiAgICAgIH0sXG4gICAgICAvLyB7XG4gICAgICAvLyAgIG5hbWU6ICdzdGF0cycsXG4gICAgICAvLyAgIGxvY2tlZDogZmFsc2VcbiAgICAgIC8vIH1cbiAgICBdLFxuICAgIHN0YXRzOiB7XG4gICAgICB0b3RhbE9yZXNNaW5lZDogMCxcbiAgICAgIHRvdGFsT3Jlc1NwZW50OiAwLFxuICAgICAgb3JlQ2xpY2tzOiAwLFxuICAgICAgb3JlQ3JpdENsaWNrczogMCxcbiAgICAgIHJvY2tzRGVzdHJveWVkOiAwLFxuICAgICAgaXRlbXNQaWNrZWRVcDogMCxcbiAgICAgIHRpbWVQbGF5ZWQ6IDBcbiAgICB9LFxuICB9XG5cbiAgR2FtZS53aXBlID0gKCkgPT4ge1xuICAgIGxvY2FsU3RvcmFnZS5jbGVhcigpXG4gICAgbG9jYXRpb24ucmVsb2FkKClcbiAgfVxuXG4gIEdhbWUuc2F2ZSA9ICgpID0+IHtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnc3RhdGUnLCBKU09OLnN0cmluZ2lmeShHYW1lLnN0YXRlKSlcbiAgICBmb3IgKGxldCBpIGluIEdhbWUuaXRlbXMpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGBpdGVtLSR7aX1gLCBKU09OLnN0cmluZ2lmeShHYW1lLml0ZW1zW2ldKSlcbiAgICB9XG4gIH1cblxuICBHYW1lLmxvYWQgPSAoKSA9PiB7XG4gICAgaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzdGF0ZScpICE9PSBudWxsKSB7XG4gICAgICBHYW1lLnN0YXRlID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc3RhdGUnKSlcblxuICAgICAgZm9yIChsZXQgaSBpbiBHYW1lLml0ZW1zKSB7XG4gICAgICAgIEdhbWUuaXRlbXNbaV0gPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGBpdGVtLSR7aX1gKSlcbiAgICAgIH1cblxuICAgICAgZ2VuZXJhdGVTdG9yZUl0ZW1zKClcbiAgICB9XG4gIH1cblxuICBsZXQgcGxheVNvdW5kID0gKHNuZCkgPT4ge1xuICAgIGxldCBzZnggPSBuZXcgQXVkaW8oYC4vYXNzZXRzLyR7c25kfS53YXZgKVxuICAgIHNmeC52b2x1bWUgPSAwLjFcbiAgICBzZngucGxheSgpXG4gIH1cblxuICBsZXQgZWFybiA9IChhbXQpID0+IHtcbiAgICBHYW1lLnN0YXRlLm9yZXMgKz0gYW10XG4gICAgR2FtZS5zdGF0ZS5zdGF0cy50b3RhbE9yZXNNaW5lZCArPSBhbXRcbiAgICBidWlsZEludmVudG9yeSgpXG4gIH1cblxuICBsZXQgZWFybk9QUyA9ICgpID0+IHtcbiAgICBsZXQgb3BzID0gY2FsY3VsYXRlT1BTKClcbiAgICBlYXJuKG9wcy8zMClcbiAgICB1cGRhdGVQZXJjZW50YWdlKG9wcy8zMClcbiAgfVxuXG4gIGxldCBzcGVuZCA9IChhbXQpID0+IHtcbiAgICBHYW1lLnN0YXRlLm9yZXMgLT0gYW10XG4gICAgR2FtZS5zdGF0ZS5zdGF0cy50b3RhbE9yZXNTcGVudCArPSBhbXRcbiAgfVxuXG4gIGxldCBjYWxjdWxhdGVPUEMgPSAodHlwZSkgPT4ge1xuICAgIGxldCBvcGMgPSAwXG4gICAgbGV0IHN0ciA9IEdhbWUuc3RhdGUucGxheWVyLnN0clxuICAgIGlmIChHYW1lLnN0YXRlLnBsYXllci5waWNrYXhlLnByZWZpeFN0YXQpIHtcbiAgICAgIGlmIChHYW1lLnN0YXRlLnBsYXllci5waWNrYXhlLnByZWZpeFN0YXQgPT0gJ1N0cmVuZ3RoJykge1xuICAgICAgICBzdHIgKz0gR2FtZS5zdGF0ZS5wbGF5ZXIucGlja2F4ZS5wcmVmaXhTdGF0VmFsXG4gICAgICB9XG4gICAgfVxuICAgIG9wYyArPSBHYW1lLnN0YXRlLnBsYXllci5waWNrYXhlLmRhbWFnZVxuICAgIC8vIG9wYyArPSAoR2FtZS5zdGF0ZS5wbGF5ZXIucGlja2F4ZS5kYW1hZ2UgKiBzdHIpICogLjFcbiAgICBvcGMgKz0gTWF0aC5wb3coMS4yNSwgc3RyKVxuXG4gICAgb3BjICs9IChvcGMgKiBHYW1lLnN0YXRlLm9wY011bHRpcGxpZXIpXG5cbiAgICBpZiAodHlwZSA9PSAnY3JpdCcpIHtcbiAgICAgIG9wYyAqPSBHYW1lLnN0YXRlLm9yZUNsaWNrTXVsdGlwbGllclxuICAgIH1cblxuICAgIHJldHVybiBvcGNcbiAgfVxuXG4gIGxldCBjYWxjdWxhdGVPUFMgPSAoKSA9PiB7XG4gICAgbGV0IG9wcyA9IDBcblxuICAgIGZvciAobGV0IGkgaW4gR2FtZS5pdGVtcykge1xuICAgICAgaWYgKEdhbWUuaXRlbXNbaV0udHlwZSA9PSAnaXRlbScpIHtcbiAgICAgICAgb3BzICs9IEdhbWUuaXRlbXNbaV0ucHJvZHVjdGlvbiAqIEdhbWUuaXRlbXNbaV0ub3duZWRcbiAgICAgIH1cbiAgICB9XG5cbiAgICBvcHMgKz0gKG9wcyAqIEdhbWUuc3RhdGUub3BzTXVsdGlwbGllcilcblxuICAgIEdhbWUuc3RhdGUub3Jlc1BlclNlY29uZCA9IG9wc1xuICAgIHJldHVybiBvcHNcbiAgfVxuXG4gIGxldCBkcm9wSXRlbSA9ICgpID0+IHtcbiAgICBsZXQgcmFuZG9tU2lnbiA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSkgKiAyIC0gMVxuICAgIGxldCByYW5kb21OdW1iZXIgPSAoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMjAwKSArIDEpICogcmFuZG9tU2lnblxuICAgIGxldCByYW5kb21ZID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogNTApICsgMVxuICAgIGxldCB0aGlzSXRlbUNsaWNrZWQgPSBmYWxzZVxuICAgIGxldCBhbW91bnRPZlJvY2tzRGVzdHJveWVkID0gR2FtZS5zdGF0ZS5zdGF0cy5yb2Nrc0Rlc3Ryb3llZFxuICAgIGxldCBpTHZsID0gYW1vdW50T2ZSb2Nrc0Rlc3Ryb3llZFxuXG4gICAgaWYgKE1hdGgucmFuZG9tKCkgPCAuMyB8fCBhbW91bnRPZlJvY2tzRGVzdHJveWVkIDw9IDEpIHsgLy8gMzAlIGNoYW5jZVxuICAgICAgbGV0IGl0ZW1Db250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgaXRlbUNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdpdGVtLWNvbnRhaW5lcicpXG4gICAgICBpdGVtQ29udGFpbmVyLmlubmVySFRNTCA9IGBcbiAgICAgICAgPGRpdiBjbGFzcz1cIml0ZW0tcG91Y2gtZ2xvd1wiPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiaXRlbS1wb3VjaC1nbG93MlwiPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiaXRlbS1wb3VjaC1nbG93M1wiPjwvZGl2PlxuICAgICAgYFxuICAgICAgbGV0IG9yZVBvcyA9IHMoJy5vcmUnKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgaXRlbUNvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgIGl0ZW1Db250YWluZXIuc3R5bGUudG9wID0gb3JlUG9zLmJvdHRvbSArIHJhbmRvbVkgKyAncHgnXG4gICAgICBpdGVtQ29udGFpbmVyLnN0eWxlLmxlZnQgPSAob3JlUG9zLmxlZnQgKyBvcmVQb3MucmlnaHQpLzIgKyByYW5kb21OdW1iZXIgKyAncHgnXG5cbiAgICAgIGxldCBpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIGl0ZW0uY2xhc3NMaXN0LmFkZCgnaXRlbS1kcm9wJylcbiAgICAgIGl0ZW0uc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnXG4gICAgICBpdGVtLmlkID0gYGl0ZW0tJHthbW91bnRPZlJvY2tzRGVzdHJveWVkfWBcblxuICAgICAgaXRlbUNvbnRhaW5lci5hcHBlbmRDaGlsZChpdGVtKVxuXG4gICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICBzKCcuaXRlbS1wb3VjaC1nbG93Jykuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICBzKCcuaXRlbS1wb3VjaC1nbG93MicpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgcygnLml0ZW0tcG91Y2gtZ2xvdzMnKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgIGl0ZW0uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJ1xuICAgICAgICBzKCcuaXRlbS1kcm9wJykuY2xhc3NMaXN0LmFkZCgnaXRlbS1waWNrdXAtYW5pbWF0aW9uJylcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaXRlbUNvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGl0ZW1Db250YWluZXIpXG4gICAgICAgICAgcGlja1VwSXRlbShpTHZsKVxuICAgICAgICB9LCA4MDApXG4gICAgICB9KVxuXG5cbiAgICAgIHMoJ2JvZHknKS5hcHBlbmRDaGlsZChpdGVtQ29udGFpbmVyKVxuICAgIH1cbiAgfVxuXG4gIGxldCBnZW5lcmF0ZVJhbmRvbUl0ZW0gPSAoaUx2bCkgPT4ge1xuXG4gICAgbGV0IHJhcml0eSA9IFtcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ0NvbW1vbicsXG4gICAgICAgIG11bHQ6IDFcbiAgICAgIH0sIHtcbiAgICAgICAgbmFtZTogJ1VuY29tbW9uJyxcbiAgICAgICAgbXVsdDogMS41XG4gICAgICB9LCB7XG4gICAgICAgIG5hbWU6ICdVbmlxdWUnLFxuICAgICAgICBtdWx0OiAyXG4gICAgICB9LCB7XG4gICAgICAgIG5hbWU6ICdSYXJlJyxcbiAgICAgICAgbXVsdDogM1xuICAgICAgfSwge1xuICAgICAgICBuYW1lOiAnTGVnZW5kYXJ5JyxcbiAgICAgICAgbXVsdDogNVxuICAgICAgfVxuICAgIF1cbiAgICBsZXQgcHJlZml4ZXMgPSBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdMdWNreScsXG4gICAgICAgIHN0YXQ6ICdMdWNrJyxcbiAgICAgICAgbXVsdDogMVxuICAgICAgfSwge1xuICAgICAgICBuYW1lOiAnVW5sdWNreScsXG4gICAgICAgIHN0YXQ6ICdMdWNrJyxcbiAgICAgICAgbXVsdDogLTFcbiAgICAgIH0sIHtcbiAgICAgICAgbmFtZTogJ0ZvcnR1aXRvdXMnLFxuICAgICAgICBzdGF0OiAnTHVjaycsXG4gICAgICAgIG11bHQ6IDJcbiAgICAgIH0sIHtcbiAgICAgICAgbmFtZTogJ1Bvb3InLFxuICAgICAgICBzdGF0OiAnTHVjaycsXG4gICAgICAgIG11bHQ6IC0xXG4gICAgICB9LCB7XG4gICAgICAgIG5hbWU6ICdTdHJvbmcnLFxuICAgICAgICBzdGF0OiAnU3RyZW5ndGgnLFxuICAgICAgICBtdWx0OiAxXG4gICAgICB9LCB7XG4gICAgICAgIG5hbWU6ICdXZWFrJyxcbiAgICAgICAgc3RhdDogJ1N0cmVuZ3RoJyxcbiAgICAgICAgbXVsdDogLTFcbiAgICAgIH0sIHtcbiAgICAgICAgbmFtZTogJ0JpZycsXG4gICAgICAgIHN0YXQ6ICdTdHJlbmd0aCcsXG4gICAgICAgIG11bHQ6IDFcbiAgICAgIH0sIHtcbiAgICAgICAgbmFtZTogJ1NtYWxsJyxcbiAgICAgICAgc3RhdDogJ1N0cmVuZ3RoJyxcbiAgICAgICAgbXVsdDogLTFcbiAgICAgIH0sIHtcbiAgICAgICAgbmFtZTogJ0JhYnknLFxuICAgICAgICBzdGF0OiAnU3RyZW5ndGgnLFxuICAgICAgICBtdWx0OiAtMlxuICAgICAgfSwge1xuICAgICAgICBuYW1lOiAnR2lnYW50aWMnLFxuICAgICAgICBzdGF0OiAnU3RyZW5ndGgnLFxuICAgICAgICBtdWx0OiAyXG4gICAgICB9LCAgIHtcbiAgICAgICAgbmFtZTogJ0R1cmFibGUnLFxuICAgICAgICBzdGF0OiAnU3RyZW5ndGgnLFxuICAgICAgICBtdWx0OiAxXG4gICAgICB9LCB7XG4gICAgICAgIG5hbWU6ICdGcmFpbCcsXG4gICAgICAgIHN0YXQ6ICdTdHJlbmd0aCcsXG4gICAgICAgIG11bHQ6IC0xLjVcbiAgICAgIH0sIHtcbiAgICAgICAgbmFtZTogJ0hhcmQnLFxuICAgICAgICBzdGF0OiAnU3RyZW5ndGgnLFxuICAgICAgICBtdWx0OiAxXG4gICAgICB9LCB7XG4gICAgICAgIG5hbWU6ICdXZWFrJyxcbiAgICAgICAgc3RhdDogJ1N0cmVuZ3RoJyxcbiAgICAgICAgbXVsdDogLTFcbiAgICAgIH0sIHtcbiAgICAgICAgbmFtZTogJ0Jyb2tlbicsXG4gICAgICAgIHN0YXQ6ICdTdHJlbmd0aCcsXG4gICAgICAgIG11bHQ6IC0yXG4gICAgICB9LCB7XG4gICAgICAgIG5hbWU6ICdTaG9kZHknLFxuICAgICAgICBzdGF0OiAnU3RyZW5ndGgnLFxuICAgICAgICBtdWx0OiAtMVxuICAgICAgfVxuICAgIF1cbiAgICBsZXQgbWF0ZXJpYWxzID0gW1xuICAgICAge1xuICAgICAgICBuYW1lOiAnV29vZCcsXG4gICAgICAgIG11bHQ6IC41XG4gICAgICB9LCB7XG4gICAgICAgIG5hbWU6ICdTdG9uZScsXG4gICAgICAgIG11bHQ6IDEuNVxuICAgICAgfSwge1xuICAgICAgICBuYW1lOiAnSXJvbicsXG4gICAgICAgIG11bHQ6IDNcbiAgICAgIH0sIHtcbiAgICAgICAgbmFtZTogJ1N0ZWVsJyxcbiAgICAgICAgbXVsdDogNVxuICAgICAgfSwge1xuICAgICAgICBuYW1lOiAnRGlhbW9uZCcsXG4gICAgICAgIG11bHQ6IDEwXG4gICAgICB9XG4gICAgXVxuICAgIGxldCBzdWZmaXhlcyA9IFtcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ29mIHRoZSBHaWFudCcsXG4gICAgICAgIHN0YXQ6ICdzdHJlbmd0aCcsXG4gICAgICAgIG11bHQ6IDEwXG4gICAgICB9LCB7XG4gICAgICAgIG5hbWU6ICdvZiB0aGUgTGVwcmVjaGF1bicsXG4gICAgICAgIHN0YXQ6ICdsdWNrJyxcbiAgICAgICAgbXVsdDogMTBcbiAgICAgIH1cbiAgICBdXG5cbiAgICBsZXQgcmFuZ2UgPSBNYXRoLmNlaWwoKE1hdGgucmFuZG9tKCkgKiBpTHZsLzIpICsgaUx2bC8yKSAvLyBQaWNrcyBhIHJhbmRvbSB3aG9sZSBudW1iZXIgZnJvbSAxIHRvIGlMdmxcblxuICAgIGxldCBjaG9vc2VSYXJpdHkgPSAoKSA9PiB7XG4gICAgICBsZXQgc2VsZWN0ZWRSYXJpdHlcbiAgICAgIGxldCByYW5kb21OdW0gPSBNYXRoLnJhbmRvbSgpXG4gICAgICBpZiAocmFuZG9tTnVtID49IDApIHtcbiAgICAgICAgc2VsZWN0ZWRSYXJpdHkgPSByYXJpdHlbMF1cbiAgICAgIH1cbiAgICAgIGlmIChyYW5kb21OdW0gPj0gLjUpIHtcbiAgICAgICAgc2VsZWN0ZWRSYXJpdHkgPSByYXJpdHlbMV1cbiAgICAgIH1cbiAgICAgIGlmIChyYW5kb21OdW0gPj0gLjcpIHtcbiAgICAgICAgc2VsZWN0ZWRSYXJpdHkgPSByYXJpdHlbMl1cbiAgICAgIH1cbiAgICAgIGlmIChyYW5kb21OdW0gPj0gLjkpIHtcbiAgICAgICAgc2VsZWN0ZWRSYXJpdHkgPSByYXJpdHlbM11cbiAgICAgIH1cbiAgICAgIGlmIChyYW5kb21OdW0gPj0gLjk1KSB7XG4gICAgICAgIHNlbGVjdGVkUmFyaXR5ID0gcmFyaXR5WzRdXG4gICAgICB9XG4gICAgICByZXR1cm4gc2VsZWN0ZWRSYXJpdHlcbiAgICB9XG4gICAgbGV0IGNob29zZU1hdGVyaWFsID0gKCkgPT4ge1xuICAgICAgbGV0IHNlbGVjdGVkTWF0ZXJpYWxcbiAgICAgIGxldCByYW5kb21OdW0gPSBNYXRoLnJhbmRvbSgpXG4gICAgICBpZiAocmFuZG9tTnVtID49IDApIHtcbiAgICAgICAgc2VsZWN0ZWRNYXRlcmlhbCA9IG1hdGVyaWFsc1swXVxuICAgICAgfVxuICAgICAgaWYgKHJhbmRvbU51bSA+PSAuNCkge1xuICAgICAgICBzZWxlY3RlZE1hdGVyaWFsID0gbWF0ZXJpYWxzWzFdXG4gICAgICB9XG4gICAgICBpZiAocmFuZG9tTnVtID49IC43KSB7XG4gICAgICAgIHNlbGVjdGVkTWF0ZXJpYWwgPSBtYXRlcmlhbHNbMl1cbiAgICAgIH1cbiAgICAgIGlmIChyYW5kb21OdW0gPj0gLjkpIHtcbiAgICAgICAgc2VsZWN0ZWRNYXRlcmlhbCA9IG1hdGVyaWFsc1szXVxuICAgICAgfVxuICAgICAgaWYgKHJhbmRvbU51bSA+PSAuOTUpIHtcbiAgICAgICAgc2VsZWN0ZWRNYXRlcmlhbCA9IG1hdGVyaWFsc1s0XVxuICAgICAgfVxuICAgICAgcmV0dXJuIHNlbGVjdGVkTWF0ZXJpYWxcbiAgICB9XG5cbiAgICBsZXQgc2VsZWN0ZWRSYXJpdHkgPSBjaG9vc2VSYXJpdHkoKVxuICAgIGxldCBzZWxlY3RlZE1hdGVyaWFsID0gY2hvb3NlTWF0ZXJpYWwoKVxuICAgIGxldCB0b3RhbE11bHQgPSBzZWxlY3RlZFJhcml0eS5tdWx0ICsgc2VsZWN0ZWRNYXRlcmlhbC5tdWx0XG4gICAgbGV0IGl0ZW1OYW1lXG4gICAgbGV0IHByZWZpeE5hbWVcbiAgICBsZXQgcHJlZml4VmFsXG4gICAgbGV0IHByZWZpeFN0YXRcbiAgICBsZXQgc3VmZml4TmFtZVxuXG4gICAgaWYgKHNlbGVjdGVkUmFyaXR5Lm5hbWUgPT0gJ0xlZ2VuZGFyeScgfHwgc2VsZWN0ZWRSYXJpdHkubmFtZSA9PSAnUmFyZScpIHtcbiAgICAgIGxldCBzZWxlY3RlZFN1ZmZpeCA9IHN1ZmZpeGVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHN1ZmZpeGVzLmxlbmd0aCldXG4gICAgICB0b3RhbE11bHQgKz0gc2VsZWN0ZWRTdWZmaXgubXVsdFxuICAgICAgc3VmZml4TmFtZSA9IHNlbGVjdGVkU3VmZml4Lm5hbWVcbiAgICB9XG4gICAgaWYgKE1hdGgucmFuZG9tKCkgPj0gLjYpIHsgLy8gNDAlIGNoYW5jZSBmb3IgYSBwcmVmaXhcbiAgICAgIGxldCBzZWxlY3RlZFByZWZpeCA9IHByZWZpeGVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHByZWZpeGVzLmxlbmd0aCldXG4gICAgICBwcmVmaXhWYWwgPSAocmFuZ2UgKyB0b3RhbE11bHQpICogc2VsZWN0ZWRQcmVmaXgubXVsdFxuICAgICAgcHJlZml4U3RhdCA9IHNlbGVjdGVkUHJlZml4LnN0YXRcbiAgICAgIHByZWZpeE5hbWUgPSBzZWxlY3RlZFByZWZpeC5uYW1lXG4gICAgfVxuICAgIGlmIChwcmVmaXhOYW1lKSB7XG4gICAgICBpdGVtTmFtZSA9IGAke3ByZWZpeE5hbWV9ICR7c2VsZWN0ZWRNYXRlcmlhbC5uYW1lfSBQaWNrYXhlYFxuICAgIH0gZWxzZSB7XG4gICAgICBpdGVtTmFtZSA9IGAke3NlbGVjdGVkTWF0ZXJpYWwubmFtZX0gUGlja2F4ZWBcbiAgICB9XG4gICAgaWYgKHN1ZmZpeE5hbWUpIHtcbiAgICAgIGl0ZW1OYW1lICs9IGAgJHtzdWZmaXhOYW1lfWBcbiAgICB9XG5cbiAgICBsZXQgY2FsY3VsYXRlRG1nID0gaUx2bCAqIHRvdGFsTXVsdFxuXG4gICAgbGV0IG5ld0l0ZW0gPSB7XG4gICAgICBuYW1lOiBpdGVtTmFtZSxcbiAgICAgIHJhcml0eTogc2VsZWN0ZWRSYXJpdHkubmFtZSxcbiAgICAgIG1hdGVyaWFsOiBzZWxlY3RlZE1hdGVyaWFsLm5hbWUsXG4gICAgICBpdGVtTGV2ZWw6IGlMdmwsXG4gICAgICBkYW1hZ2U6IGNhbGN1bGF0ZURtZyxcbiAgICB9XG5cbiAgICBpZiAocHJlZml4TmFtZSkge1xuICAgICAgbmV3SXRlbVsnaGFzUHJlZml4J10gPSB0cnVlXG4gICAgICBuZXdJdGVtWydwcmVmaXhTdGF0J10gPSBwcmVmaXhTdGF0XG4gICAgICBuZXdJdGVtWydwcmVmaXhTdGF0VmFsJ10gPSBwcmVmaXhWYWxcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3SXRlbVxuICB9XG5cbiAgbGV0IHBpY2tVcEl0ZW0gPSAoaUx2bCkgPT4ge1xuICAgIEdhbWUuc3RhdGUuc3RhdHMuaXRlbXNQaWNrZWRVcCsrXG4gICAgR2FtZS5uZXdJdGVtID0gZ2VuZXJhdGVSYW5kb21JdGVtKGlMdmwpXG4gICAgbGV0IGl0ZW1Nb2RhbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgaXRlbU1vZGFsLmNsYXNzTGlzdC5hZGQoJ2l0ZW0tbW9kYWwtY29udGFpbmVyJylcblxuICAgIGxldCBzdHIgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwiaXRlbS1tb2RhbFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiaXRlbS1tb2RhbC10b3BcIj5cbiAgICAgICAgICA8aDE+TmV3IEl0ZW0hPC9oMT5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJpdGVtLW1vZGFsLW1pZGRsZVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJpdGVtLW1vZGFsLW1pZGRsZS1sZWZ0XCI+XG4gICAgICAgICAgICA8cD5Zb3UgRm91bmQ8L3A+XG4gICAgICAgICAgICA8aDIgY2xhc3M9JyR7R2FtZS5uZXdJdGVtLnJhcml0eX0nIHN0eWxlPSdmb250LXNpemU6IHh4LWxhcmdlJz4ke0dhbWUubmV3SXRlbS5uYW1lfTwvaDI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaXRlbS1tb2RhbC1pbWdcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBpY2theGUtYXVyYSBhdXJhLSR7R2FtZS5uZXdJdGVtLnJhcml0eX1cIj48L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBpY2theGUtdG9wICR7R2FtZS5uZXdJdGVtLm1hdGVyaWFsfVwiPjwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGlja2F4ZS1ib3R0b21cIj48L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIml0ZW0tc3RhdHNcIj5cbiAgICAgICAgICAgICAgPHAgc3R5bGU9J2ZvbnQtc3R5bGU6IGl0YWxpYzsgZm9udC1zaXplOiBzbWFsbCc+JHtHYW1lLm5ld0l0ZW0ucmFyaXR5fTwvcD5cbiAgICAgICAgICAgICAgPGJyLz5cbiAgICAgICAgICAgICAgPHA+SXRlbSBMZXZlbDogJHtHYW1lLm5ld0l0ZW0uaXRlbUxldmVsfTwvcD5cbiAgICAgICAgICAgICAgPHA+RGFtYWdlOiAke2JlYXV0aWZ5KEdhbWUubmV3SXRlbS5kYW1hZ2UpfTwvcD5cbiAgICAgICAgICAgICAgYFxuICAgICAgICAgICAgICBpZiAoR2FtZS5uZXdJdGVtLmhhc1ByZWZpeCA9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IGBcbiAgICAgICAgICAgICAgICAgIDxwPiR7R2FtZS5uZXdJdGVtLnByZWZpeFN0YXR9OiAke01hdGguZmxvb3IoR2FtZS5uZXdJdGVtLnByZWZpeFN0YXRWYWwpfTwvcD5cbiAgICAgICAgICAgICAgICBgXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3RyICs9IGBcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJpdGVtLW1vZGFsLW1pZGRsZS1yaWdodFwiPlxuICAgICAgICAgICAgPHA+Q3VycmVudGx5IEVxdWlwcGVkPC9wPlxuICAgICAgICAgICAgPGgyIGNsYXNzPScke0dhbWUuc3RhdGUucGxheWVyLnBpY2theGUucmFyaXR5fScgc3R5bGU9J2ZvbnQtc2l6ZTogeHgtbGFyZ2UnPiR7R2FtZS5zdGF0ZS5wbGF5ZXIucGlja2F4ZS5uYW1lfTwvaDI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaXRlbS1tb2RhbC1pbWdcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBpY2theGUtYXVyYSBhdXJhLSR7R2FtZS5zdGF0ZS5wbGF5ZXIucGlja2F4ZS5yYXJpdHl9XCI+PC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWNrYXhlLXRvcCAke0dhbWUuc3RhdGUucGxheWVyLnBpY2theGUubWF0ZXJpYWx9XCI+PC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWNrYXhlLWJvdHRvbVwiPjwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaXRlbS1zdGF0c1wiPlxuICAgICAgICAgICAgICA8cCBzdHlsZT0nZm9udC1zdHlsZTogaXRhbGljOyBmb250LXNpemU6IHNtYWxsJz4ke0dhbWUuc3RhdGUucGxheWVyLnBpY2theGUucmFyaXR5fTwvcD5cbiAgICAgICAgICAgICAgPGJyLz5cbiAgICAgICAgICAgICAgPHA+SXRlbSBMZXZlbDogJHtHYW1lLnN0YXRlLnBsYXllci5waWNrYXhlLml0ZW1MZXZlbH08L3A+XG4gICAgICAgICAgICAgIDxwPkRhbWFnZTogJHtiZWF1dGlmeShHYW1lLnN0YXRlLnBsYXllci5waWNrYXhlLmRhbWFnZSl9PC9wPlxuICAgICAgICAgICAgICBgXG4gICAgICAgICAgICAgIGlmIChHYW1lLnN0YXRlLnBsYXllci5waWNrYXhlLmhhc1ByZWZpeCA9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IGBcbiAgICAgICAgICAgICAgICAgIDxwPiR7R2FtZS5zdGF0ZS5wbGF5ZXIucGlja2F4ZS5wcmVmaXhTdGF0fTogJHtNYXRoLmZsb29yKEdhbWUuc3RhdGUucGxheWVyLnBpY2theGUucHJlZml4U3RhdFZhbCl9PC9wPlxuICAgICAgICAgICAgICAgIGBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzdHIgKz0gYFxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiaXRlbS1tb2RhbC1ib3R0b21cIj5cbiAgICAgICAgICA8YnV0dG9uIHN0eWxlPSdtYXJnaW4tcmlnaHQ6IDEwcHg7JyBvbmNsaWNrPUdhbWUuaXRlbU1vZGFsQ2xpY2soJ2VxdWlwJyk+RXF1aXA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uIHN0eWxlPSdtYXJnaW4tbGVmdDogMTBweDsnIG9uY2xpY2s9R2FtZS5pdGVtTW9kYWxDbGljaygpPkRpc2NhcmQ8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgXG5cbiAgICBpdGVtTW9kYWwuaW5uZXJIVE1MID0gc3RyXG4gICAgcygnYm9keScpLmFwcGVuZENoaWxkKGl0ZW1Nb2RhbClcbiAgfVxuXG4gIEdhbWUuaXRlbU1vZGFsQ2xpY2sgPSAoc3RyKSA9PiB7XG5cbiAgICBpZiAoc3RyID09ICdlcXVpcCcpIHtcbiAgICAgIEdhbWUuc3RhdGUucGxheWVyLnBpY2theGUgPSBHYW1lLm5ld0l0ZW1cbiAgICB9XG4gICAgbGV0IGl0ZW1Db250YWluZXIgPSBzKCcuaXRlbS1tb2RhbC1jb250YWluZXInKVxuICAgIGl0ZW1Db250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpdGVtQ29udGFpbmVyKVxuICB9XG5cbiAgbGV0IGJ1aWxkSW52ZW50b3J5ID0gKCkgPT4ge1xuICAgIGxldCBzdHIgPSAnJ1xuICAgIHN0ciArPSBgT3JlczogJHtiZWF1dGlmeShHYW1lLnN0YXRlLm9yZXMudG9GaXhlZCgxKSl9YFxuICAgIGlmIChHYW1lLnN0YXRlLm9yZXNQZXJTZWNvbmQgPiAwKSB7XG4gICAgICBzdHIgKz0gYCAoJHtiZWF1dGlmeShHYW1lLnN0YXRlLm9yZXNQZXJTZWNvbmQudG9GaXhlZCgxKSl9L3MpYFxuICAgIH1cbiAgICBzKCcub3JlcycpLmlubmVySFRNTCA9IHN0clxuICAgIHMoJy5sZXZlbCcpLmlubmVySFRNTCA9IGBMZXZlbDogJHtHYW1lLnN0YXRlLnBsYXllci5sdmx9ICgke0dhbWUuc3RhdGUucGxheWVyLmN1cnJlbnRYcH0vJHtHYW1lLnN0YXRlLnBsYXllci54cE5lZWRlZH0pYFxuICB9XG5cbiAgbGV0IGJ1aWxkU3RvcmUgPSAoKSA9PiB7XG4gICAgbGV0IHN0ciA9ICcnXG4gICAgc3RyICs9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJ1cGdyYWRlcy1jb250YWluZXJcIj5cbiAgICBgXG4gICAgbGV0IGhhc0NvbnRlbnQgPSAwXG4gICAgZm9yIChsZXQgaSBpbiBHYW1lLml0ZW1zKSB7XG4gICAgICBsZXQgaXRlbSA9IEdhbWUuaXRlbXNbaV1cbiAgICAgIGlmIChpdGVtLnR5cGUgPT0gJ3VwZ3JhZGUnKSB7XG4gICAgICAgIGlmIChpdGVtLmhpZGRlbiA9PSAwKSB7XG4gICAgICAgICAgaGFzQ29udGVudCA9IDFcbiAgICAgICAgICBzdHIgKz0gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInVwZ3JhZGUtaXRlbS1jb250YWluZXJcIiBzdHlsZT0nYmFja2dyb3VuZC1jb2xvcjogI2I1NjUzNSc+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ1cGdyYWRlLWl0ZW1cIiBvbm1vdXNlb3Zlcj1cIkdhbWUuc2hvd1Rvb2x0aXAoJyR7aX0nKVwiIG9ubW91c2VvdXQ9XCJHYW1lLmhpZGVUb29sdGlwKClcIiBvbmNsaWNrPSdHYW1lLml0ZW1zW1wiJHtpfVwiXS5idXkoKScgc3R5bGU9J2JhY2tncm91bmQ6IHVybCguL2Fzc2V0cy8ke2l0ZW0ucGljfSk7IGJhY2tncm91bmQtc2l6ZTogMTAwJTsnPjwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgYFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChoYXNDb250ZW50ID09IDApIHN0ciArPSBgPGgzIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyB3aWR0aDogMTAwJTsgb3BhY2l0eTogLjVcIj5ubyB1cGdyYWRlcyBhdmFpbGFibGU8L2gzPmBcbiAgICBzdHIgKz0gYDwvZGl2PjxkaXYgY2xhc3M9XCJob3Jpem9udGFsLXNlcGFyYXRvclwiIHN0eWxlPSdoZWlnaHQ6IDhweDsnPjwvZGl2PmBcblxuICAgIGZvciAobGV0IGkgaW4gR2FtZS5pdGVtcykge1xuICAgICAgbGV0IGl0ZW0gPSBHYW1lLml0ZW1zW2ldXG4gICAgICBpZiAoaXRlbS50eXBlID09ICdpdGVtJykge1xuICAgICAgICBpZiAoaXRlbS5oaWRkZW4gPT0gMCkge1xuICAgICAgICAgIHN0ciArPSBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uXCIgb25jbGljaz1cIkdhbWUuaXRlbXNbJyR7aX0nXS5idXkoKVwiIG9ubW91c2VvdmVyPVwiR2FtZS5zaG93VG9vbHRpcCgnJHtpfScsIHRoaXMpXCIgb25tb3VzZW91dD1cIkdhbWUuaGlkZVRvb2x0aXAoKVwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uLXRvcFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidXR0b24tbGVmdFwiPlxuICAgICAgICAgICAgICAgICAgPGltZyBzcmM9XCIuL2Fzc2V0cy8ke2l0ZW0ucGljfVwiIHN0eWxlPSdmaWx0ZXI6IGJyaWdodG5lc3MoMTAwJSk7IGltYWdlLXJlbmRlcmluZzogcGl4ZWxhdGVkJy8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJ1dHRvbi1taWRkbGVcIj5cbiAgICAgICAgICAgICAgICAgIDxoMyBzdHlsZT0nZm9udC1zaXplOiB4LWxhcmdlJz4ke2l0ZW0ubmFtZX08L2gzPlxuICAgICAgICAgICAgICAgICAgPHA+Y29zdDogJHtiZWF1dGlmeShpdGVtLnByaWNlLnRvRml4ZWQoMCkpfSBvcmVzPC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidXR0b24tcmlnaHRcIj5cbiAgICAgICAgICAgICAgICAgIDxwIHN0eWxlPSdmb250LXNpemU6IHh4LWxhcmdlJz4ke2l0ZW0ub3duZWR9PC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIGBcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXRlbS5oaWRkZW4gPT0gMSkge1xuICAgICAgICAgIHN0ciArPSBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uXCIgc3R5bGU9J2N1cnNvcjogbm90LWFsbG93ZWQ7IGJveC1zaGFkb3c6IDAgNHB4IGJsYWNrOyBvcGFjaXR5OiAuNzsgZmlsdGVyOiBicmlnaHRuZXNzKDYwJSknPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uLXRvcFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidXR0b24tbGVmdFwiPlxuICAgICAgICAgICAgICAgICAgPGltZyBzcmM9XCIuL2Fzc2V0cy8ke2l0ZW0ucGljfVwiIHN0eWxlPSdmaWx0ZXI6IGJyaWdodG5lc3MoMCUpJy8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJ1dHRvbi1taWRkbGVcIj5cbiAgICAgICAgICAgICAgICAgIDxoMyBzdHlsZT0nZm9udC1zaXplOiBsYXJnZXInPj8/PzwvaDM+XG4gICAgICAgICAgICAgICAgICA8cD5jb3N0OiA/Pz8gb3JlczwvcD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uLXJpZ2h0XCI+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgYFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHMoJy50YWItY29udGVudCcpLmlubmVySFRNTCA9IHN0clxuICAgIGxvYWRBZCgpXG4gIH1cblxuICBHYW1lLnN0YXRzVmlzYWJsZSA9IGZhbHNlXG5cbiAgR2FtZS5idWlsZFN0YXRzID0gKCkgPT4ge1xuICAgIGxldCBzdHIgPSAnJ1xuICAgIGxldCBpbnZlbnRvcnlQb3MgPSBzKCcuaW52ZW50b3J5LXNlY3Rpb24nKVxuICAgIGxldCBsZWZ0U2VwYXJhdG9yUG9zID0gcygnI2xlZnQtc2VwYXJhdG9yJylcblxuICAgIGxldCBzdGF0c0NvbnRhaW5lciA9IHMoJy5zdGF0cy1jb250YWluZXInKVxuICAgIHN0YXRzQ29udGFpbmVyLnN0eWxlLnRvcCA9IGludmVudG9yeVBvcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5ib3R0b20gKyAxMCArICdweCdcbiAgICBzdGF0c0NvbnRhaW5lci5zdHlsZS5sZWZ0ID0gbGVmdFNlcGFyYXRvclBvcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5yaWdodCArICdweCdcblxuICAgIGlmIChHYW1lLnN0YXRzVmlzYWJsZSA9PSB0cnVlKSB7XG4gICAgICBzdHIgKz0gYFxuICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdHMtY29udGFpbmVyLWhlYWRlclwiIG9uY2xpY2s9J0dhbWUudG9nZ2xlU3RhdHMoKTsnPlxuICAgICAgICAgIDxoND5zdGF0czwvaDQ+XG4gICAgICAgICAgPHAgY2xhc3M9J2NhcmV0JyBzdHlsZT0nZm9udC1zaXplOiA4cHg7IGZsb2F0OiByaWdodDsgbWFyZ2luLXJpZ2h0OiA1cHg7IHRyYW5zZm9ybTogcm90YXRlKDE4MGRlZyknPiYjOTY2MDs8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYFxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gYFxuICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdHMtY29udGFpbmVyLWhlYWRlclwiIG9uY2xpY2s9J0dhbWUudG9nZ2xlU3RhdHMoKSc+XG4gICAgICAgICAgPGg0PnN0YXRzPC9oND5cbiAgICAgICAgICA8cCBjbGFzcz0nY2FyZXQnIHN0eWxlPSdmb250LXNpemU6IDhweDsgZmxvYXQ6IHJpZ2h0OyBtYXJnaW4tcmlnaHQ6IDVweCc7PiYjOTY2MDs8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYFxuICAgIH1cblxuICAgIGlmIChHYW1lLnN0YXRzVmlzYWJsZSA9PSB0cnVlKSB7XG4gICAgICBzdHIgKz0gJzxkaXYgY2xhc3M9XCJzdGF0cy1jb250YWluZXItY29udGVudC13cmFwcGVyXCIgc3R5bGU9XCJoZWlnaHQ6IDQwMHB4O1wiPidcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICc8ZGl2IGNsYXNzPVwic3RhdHMtY29udGFpbmVyLWNvbnRlbnQtd3JhcHBlclwiPidcbiAgICB9XG5cbiAgICAgIHN0ciArPSBgXG5cbiAgICAgICAgPGRpdiBjbGFzcz1cInN0YXRzLWNvbnRhaW5lci1jb250ZW50XCI+XG5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC1sZXZlbC1jb250YWluZXJcIj5cbiAgICAgICAgICAgIDxoMSBzdHlsZT0nZmxleC1ncm93OiAxJz5MZXZlbDo8L2gxPlxuICAgICAgICAgICAgPGgxIGNsYXNzPSdzdGF0LXBsYXllci1sdmwnPiR7R2FtZS5zdGF0ZS5wbGF5ZXIubHZsfTwvaDE+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8aHIvPlxuXG4gICAgICAgICAgPGRpdiBjbGFzcz1cInNpbmdsZS1zdGF0XCI+XG4gICAgICAgICAgICA8cCBzdHlsZT0nZmxleC1ncm93OiAxJyBvbm1vdXNlb3Zlcj0nR2FtZS5zaG93VG9vbHRpcChudWxsLCBudWxsLCBcInN0YXRcIiwgXCJzdHJcIiknIG9ubW91c2VvdXQ9J0dhbWUuaGlkZVRvb2x0aXAoKSc+U3RyZW5ndGg6PC9wPlxuICAgICAgICAgICAgPHAgY2xhc3M9J3N0YXQtc3RyJz4ke0dhbWUuc3RhdGUucGxheWVyLnN0cn08L3A+XG4gICAgICAgICAgICBgXG4gICAgICAgICAgICBpZiAoR2FtZS5zdGF0ZS5wbGF5ZXIuYXZhaWxhYmxlU3AgPiAwKSB7XG4gICAgICAgICAgICAgIHN0ciArPSBgPGJ1dHRvbiBvbmNsaWNrPSdHYW1lLmFkZFN0YXQoXCJzdHJcIiknIG9ubW91c2VvdmVyPSdHYW1lLnNob3dUb29sdGlwKG51bGwsIG51bGwsIFwic3RhdFwiLCBcInN0clwiKScgb25tb3VzZW91dD0nR2FtZS5oaWRlVG9vbHRpcCgpJz4rPC9idXR0b24+YFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdHIgKz0gYFxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzcz1cInNpbmdsZS1zdGF0XCI+XG4gICAgICAgICAgICA8cCBzdHlsZT0nZmxleC1ncm93OiAxJyBvbm1vdXNlb3Zlcj0nR2FtZS5zaG93VG9vbHRpcChudWxsLCBudWxsLCBcInN0YXRcIiwgXCJkZXhcIiknIG9ubW91c2VvdXQ9J0dhbWUuaGlkZVRvb2x0aXAoKSc+RGV4dGVyaXR5OjwvcD5cbiAgICAgICAgICAgIDxwIGNsYXNzPSdzdGF0LWRleCc+JHtHYW1lLnN0YXRlLnBsYXllci5kZXh9PC9wPlxuICAgICAgICAgICAgYFxuICAgICAgICAgICAgaWYgKEdhbWUuc3RhdGUucGxheWVyLmF2YWlsYWJsZVNwID4gMCkge1xuICAgICAgICAgICAgICBzdHIgKz0gYDxidXR0b24gb25jbGljaz0nR2FtZS5hZGRTdGF0KFwiZGV4XCIpJyBvbm1vdXNlb3Zlcj0nR2FtZS5zaG93VG9vbHRpcChudWxsLCBudWxsLCBcInN0YXRcIiwgXCJkZXhcIiknIG9ubW91c2VvdXQ9J0dhbWUuaGlkZVRvb2x0aXAoKSc+KzwvYnV0dG9uPmBcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RyICs9IGBcbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaW5nbGUtc3RhdFwiPlxuICAgICAgICAgICAgPHAgc3R5bGU9J2ZsZXgtZ3JvdzogMScgb25tb3VzZW92ZXI9J0dhbWUuc2hvd1Rvb2x0aXAobnVsbCwgbnVsbCwgXCJzdGF0XCIsIFwiaW50XCIpJyBvbm1vdXNlb3V0PSdHYW1lLmhpZGVUb29sdGlwKCknPkludGVsbGlnZW5jZTo8L3A+XG4gICAgICAgICAgICA8cCBjbGFzcz0nc3RhdC1pbnQnPiR7R2FtZS5zdGF0ZS5wbGF5ZXIuaW50fTwvcD5cbiAgICAgICAgICAgIGBcbiAgICAgICAgICAgIGlmIChHYW1lLnN0YXRlLnBsYXllci5hdmFpbGFibGVTcCA+IDApIHtcbiAgICAgICAgICAgICAgc3RyICs9IGA8YnV0dG9uIG9uY2xpY2s9J0dhbWUuYWRkU3RhdChcImludFwiKScgb25tb3VzZW92ZXI9J0dhbWUuc2hvd1Rvb2x0aXAobnVsbCwgbnVsbCwgXCJzdGF0XCIsIFwiaW50XCIpJyBvbm1vdXNlb3V0PSdHYW1lLmhpZGVUb29sdGlwKCknPis8L2J1dHRvbj5gXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0ciArPSBgXG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwic2luZ2xlLXN0YXRcIj5cbiAgICAgICAgICAgIDxwIHN0eWxlPSdmbGV4LWdyb3c6IDEnIG9ubW91c2VvdmVyPSdHYW1lLnNob3dUb29sdGlwKG51bGwsIG51bGwsIFwic3RhdFwiLCBcImx1a1wiKScgb25tb3VzZW91dD0nR2FtZS5oaWRlVG9vbHRpcCgpJz5MdWNrOjwvcD5cbiAgICAgICAgICAgIDxwIGNsYXNzPSdzdGF0LWx1ayc+JHtHYW1lLnN0YXRlLnBsYXllci5sdWt9PC9wPlxuICAgICAgICAgICAgYFxuICAgICAgICAgICAgaWYgKEdhbWUuc3RhdGUucGxheWVyLmF2YWlsYWJsZVNwID4gMCkge1xuICAgICAgICAgICAgICBzdHIgKz0gYDxidXR0b24gb25jbGljaz0nR2FtZS5hZGRTdGF0KFwibHVrXCIpJyBvbm1vdXNlb3Zlcj0nR2FtZS5zaG93VG9vbHRpcChudWxsLCBudWxsLCBcInN0YXRcIiwgXCJsdWtcIiknIG9ubW91c2VvdXQ9J0dhbWUuaGlkZVRvb2x0aXAoKSc+KzwvYnV0dG9uPmBcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RyICs9IGBcbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaW5nbGUtc3RhdFwiPlxuICAgICAgICAgICAgPHAgc3R5bGU9J2ZsZXgtZ3JvdzogMScgb25tb3VzZW92ZXI9J0dhbWUuc2hvd1Rvb2x0aXAobnVsbCwgbnVsbCwgXCJzdGF0XCIsIFwiY2hhXCIpJyBvbm1vdXNlb3V0PSdHYW1lLmhpZGVUb29sdGlwKCknPkNoYXJpc21hOjwvcD5cbiAgICAgICAgICAgIDxwIGNsYXNzPSdzdGF0LWNoYSc+JHtHYW1lLnN0YXRlLnBsYXllci5jaGF9PC9wPlxuICAgICAgICAgICAgYFxuICAgICAgICAgICAgaWYgKEdhbWUuc3RhdGUucGxheWVyLmF2YWlsYWJsZVNwID4gMCkge1xuICAgICAgICAgICAgICBzdHIgKz0gYDxidXR0b24gb25jbGljaz0nR2FtZS5hZGRTdGF0KFwiY2hhXCIpJyBvbm1vdXNlb3Zlcj0nR2FtZS5zaG93VG9vbHRpcChudWxsLCBudWxsLCBcInN0YXRcIiwgXCJjaGFcIiknIG9ubW91c2VvdXQ9J0dhbWUuaGlkZVRvb2x0aXAoKSc+KzwvYnV0dG9uPmBcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RyICs9IGBcbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxici8+XG5cbiAgICAgICAgICA8cCBzdHlsZT0ndGV4dC1hbGlnbjogY2VudGVyOyBmb250LXNpemU6IHNtYWxsJz5BdmFpbGFibGUgU1A6ICR7R2FtZS5zdGF0ZS5wbGF5ZXIuYXZhaWxhYmxlU3B9PC9wPlxuXG4gICAgICAgICAgPGhyLz5cbiAgICAgICAgICA8YnIvPlxuXG4gICAgICAgICAgPGRpdiBzdHlsZT0nd2lkdGg6IDEwMCU7IGJvcmRlcjogMXB4IHNvbGlkIHdoaXRlOyBjdXJzb3I6IHBvaW50ZXI7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZmxvdzogcm93LW5vd3JhcDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7Jz5cbiAgICAgICAgICAgIDxpbWcgc3JjPVwiLi9hc3NldHMvbG9jay5zdmdcIiBhbHQ9XCJcIiBoZWlnaHQ9XCIzMHB4XCIgc3R5bGU9J2ZpbHRlcjogaW52ZXJ0KDEwMCUpJy8+XG4gICAgICAgICAgICA8cCBzdHlsZT0nZmxleC1ncm93OiAxJz5DbGFzc2VzIGx2LiAxMDwvcD5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxici8+XG4gICAgICAgICAgPGhyLz5cbiAgICAgICAgICA8cD5NaXNjZWxsYW5lb3VzPC9wPlxuICAgICAgICAgIDxwPk9yZSBDbGlja3M6ICR7R2FtZS5zdGF0ZS5zdGF0cy5vcmVDbGlja3N9PC9wPlxuICAgICAgICAgIDxwPk9yZSBDcml0IENsaWNrczogJHtHYW1lLnN0YXRlLnN0YXRzLm9yZUNyaXRDbGlja3N9PC9wPlxuICAgICAgICAgIDxwPlJvY2tzIERlc3Ryb3llZDogJHtHYW1lLnN0YXRlLnN0YXRzLnJvY2tzRGVzdHJveWVkfTwvcD5cbiAgICAgICAgICA8cD5JdGVtcyBQaWNrZWQgVXA6ICR7R2FtZS5zdGF0ZS5zdGF0cy5pdGVtc1BpY2tlZFVwfTwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgXG5cblxuXG5cbiAgICBzdGF0c0NvbnRhaW5lci5pbm5lckhUTUwgPSBzdHJcbiAgfVxuXG4gIEdhbWUudG9nZ2xlU3RhdHMgPSAoKSA9PiB7XG4gICAgaWYgKHMoJy5zdGF0cy1jb250YWluZXItY29udGVudC13cmFwcGVyJykuc3R5bGUuaGVpZ2h0ID09IDAgfHwgcygnLnN0YXRzLWNvbnRhaW5lci1jb250ZW50LXdyYXBwZXInKS5zdHlsZS5oZWlnaHQgPT0gJzBweCcpIHtcbiAgICAgIHMoJy5zdGF0cy1jb250YWluZXItY29udGVudC13cmFwcGVyJykuc3R5bGUuaGVpZ2h0ID0gJzQwMHB4JztcbiAgICAgIHMoJy5jYXJldCcpLnN0eWxlLnRyYW5zZm9ybSA9ICdyb3RhdGUoMTgwZGVnKSdcbiAgICAgIEdhbWUuc3RhdHNWaXNhYmxlID0gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICBzKCcuc3RhdHMtY29udGFpbmVyLWNvbnRlbnQtd3JhcHBlcicpLnN0eWxlLmhlaWdodCA9IDA7XG4gICAgICBzKCcuY2FyZXQnKS5zdHlsZS50cmFuc2Zvcm0gPSAncm90YXRlKDBkZWcpJ1xuICAgICAgR2FtZS5zdGF0c1Zpc2FibGUgPSBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIEdhbWUuc2hvd1Rvb2x0aXAgPSAoaXRlbU5hbWUsIGFuY2hvclBvaW50LCB0eXBlLCBzdGF0KSA9PiB7XG4gICAgbGV0IGl0ZW07XG4gICAgaWYgKGl0ZW1OYW1lKSB7XG4gICAgICBpdGVtID0gR2FtZS5pdGVtc1tpdGVtTmFtZV1cbiAgICB9XG4gICAgbGV0IHRvb2x0aXAgPSBzKCcudG9vbHRpcCcpXG4gICAgbGV0IGFuY2hvciA9IHMoJyNtYWluLXNlcGFyYXRvcicpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cbiAgICB0b29sdGlwLmNsYXNzTGlzdC5hZGQoJ3Rvb2x0aXAtY29udGFpbmVyJylcbiAgICB0b29sdGlwLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgdG9vbHRpcC5zdHlsZS53aWR0aCA9ICczMDBweCdcbiAgICB0b29sdGlwLnN0eWxlLmJhY2tncm91bmQgPSAnIzIyMidcbiAgICB0b29sdGlwLnN0eWxlLmJvcmRlciA9ICcxcHggc29saWQgd2hpdGUnXG4gICAgdG9vbHRpcC5zdHlsZS5jb2xvciA9ICd3aGl0ZSdcbiAgICB0b29sdGlwLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgIHRvb2x0aXAuc3R5bGUubGVmdCA9IGFuY2hvci5sZWZ0IC0gdG9vbHRpcC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aCArICdweCdcblxuICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYW5jaG9yLXBvaW50JykpIHtcbiAgICAgIHRvb2x0aXAuc3R5bGUudG9wID0gcygnI2FuY2hvci1wb2ludCcpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmJvdHRvbSArICdweCdcbiAgICB9IGVsc2Uge1xuICAgICAgdG9vbHRpcC5zdHlsZS50b3AgPSBzKCcuc3RhdC1zaGVldCcpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArICdweCdcbiAgICB9XG5cbiAgICBpZiAoYW5jaG9yUG9pbnQpIHtcbiAgICAgIHRvb2x0aXAuc3R5bGUudG9wID0gYW5jaG9yUG9pbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgJ3B4J1xuICAgIH1cblxuXG4gICAgaWYgKHR5cGUgPT0gJ3N0YXQnKSB7XG4gICAgICBhbmNob3IgPSBzKCcuc3RhdHMtY29udGFpbmVyLWNvbnRlbnQtd3JhcHBlcicpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICB0b29sdGlwLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICB0b29sdGlwLnN0eWxlLmxlZnQgPSBhbmNob3IucmlnaHQgKyAncHgnXG4gICAgICB0b29sdGlwLnN0eWxlLnRvcCA9IGV2ZW50LmNsaWVudFkgKyAncHgnXG5cbiAgICAgIGlmIChzdGF0ID09ICdzdHInKSB7XG4gICAgICAgIHRvb2x0aXAuaW5uZXJIVE1MID0gYFxuICAgICAgICAgIDxoMz5TdHJlbmd0aDwvaDM+XG4gICAgICAgICAgPGhyLz5cbiAgICAgICAgICA8cD5JbmNyZWFzZXMgeW91ciBPcEM8L3A+XG4gICAgICAgIGBcbiAgICAgIH1cbiAgICAgIGlmIChzdGF0ID09ICdkZXgnKSB7XG4gICAgICAgIHRvb2x0aXAuaW5uZXJIVE1MID0gYFxuICAgICAgICAgIDxoMz5EZXh0ZXJpdHk8L2gzPlxuICAgICAgICAgIDxoci8+XG4gICAgICAgICAgPHA+SW5jcmVhc2VzIHlvdXIgT3BDIHNsaWdodGx5PC9wPlxuICAgICAgICAgIDxwPkNoYW5jZSBmb3IgY3JpdGljYWwgc3RyaWtlczwvcD5cbiAgICAgICAgYFxuICAgICAgfVxuICAgICAgaWYgKHN0YXQgPT0gJ2ludCcpIHtcbiAgICAgICAgdG9vbHRpcC5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgPGgzPkludGVsbGlnZW5jZTwvaDM+XG4gICAgICAgICAgPGhyLz5cbiAgICAgICAgICA8cD5JbmNyZWFzZXMgaXRlbSBvdXRwdXQgc2xpZ2h0bHk8L3A+XG4gICAgICAgICAgPHA+Q2hhbmNlIGZvciBjcml0aWNhbCBzdHJpa2VzPC9wPlxuICAgICAgICBgXG4gICAgICB9XG4gICAgICBpZiAoc3RhdCA9PSAnbHVrJykge1xuICAgICAgICB0b29sdGlwLmlubmVySFRNTCA9IGBcbiAgICAgICAgICA8aDM+THVjazwvaDM+XG4gICAgICAgICAgPGhyLz5cbiAgICAgICAgICA8cD5JbmNyZWFzZXMgaXRlbSByYXJpdHkgcGVyY2VudGFnZTwvcD5cbiAgICAgICAgICA8cD5JbmNyZWFzZXMgaXRlbSBkcm9wIGNoYW5jZTwvcD5cbiAgICAgICAgYFxuICAgICAgfVxuICAgICAgaWYgKHN0YXQgPT0gJ2NoYScpIHtcbiAgICAgICAgdG9vbHRpcC5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgPGgzPkNoYXJpc21hPC9oMz5cbiAgICAgICAgICA8aHIvPlxuICAgICAgICAgIDxwPkluY3JlYXNlcyBpdGVtIG91dHB1dDwvcD5cbiAgICAgICAgICA8cD5Mb3dlcnMgc2hvcCBwcmljZXM8L3A+XG4gICAgICAgIGBcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdG9vbHRpcC5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwidG9vbHRpcC10b3BcIj5cbiAgICAgICAgPGltZyBzcmM9XCIuL2Fzc2V0cy8ke2l0ZW0ucGljfVwiIGhlaWdodD0nNDBweCcgYWx0PVwiXCIgLz5cbiAgICAgICAgPGgzIHN0eWxlPSdmbGV4LWdyb3c6IDEnPiR7aXRlbS5uYW1lfTwvaDM+XG4gICAgICAgIDxwPiR7YmVhdXRpZnkoaXRlbS5wcmljZS50b0ZpeGVkKDApKX0gb3JlczwvcD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInRvb2x0aXAtYm90dG9tXCI+XG4gICAgICAgIDxociAvPlxuICAgICAgICA8cD4ke2l0ZW0uZGVzY308L3A+XG5cbiAgICAgICAgYFxuXG4gICAgICAgIGlmIChpdGVtLnR5cGUgPT0gJ2l0ZW0nKSB7XG4gICAgICAgICAgaWYgKGl0ZW0ub3duZWQgPiAwKSB7XG4gICAgICAgICAgICB0b29sdGlwLmlubmVySFRNTCArPSBgXG4gICAgICAgICAgICAgIDxociAvPlxuICAgICAgICAgICAgICA8cD5FYWNoICR7aXRlbS5uYW1lfSBnZW5lcmF0ZXMgJHtiZWF1dGlmeShpdGVtLnByb2R1Y3Rpb24pfSBPcFM8L3A+XG4gICAgICAgICAgICAgIDxwPjxzcGFuIGNsYXNzPSdib2xkJz4ke2l0ZW0ub3duZWR9PC9zcGFuPiAke2l0ZW0ubmFtZX0gZ2VuZXJhdGluZyA8c3BhbiBjbGFzcz0nYm9sZCc+JHtiZWF1dGlmeSgoaXRlbS5wcm9kdWN0aW9uICogaXRlbS5vd25lZCkudG9GaXhlZCgxKSl9PC9zcGFuPiBvcmVzIHBlciBzZWNvbmQ8L3A+XG4gICAgICAgICAgICBgXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdG9vbHRpcC5pbm5lckhUTUwgKz0gYFxuXG4gICAgICA8L2Rpdj5cbiAgICBgXG4gICAgfVxuICB9XG5cbiAgR2FtZS5oaWRlVG9vbHRpcCA9ICgpID0+IHtcbiAgICBzKCcudG9vbHRpcCcpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgfVxuXG4gIEdhbWUuYWRkU3RhdCA9IChzdGF0KSA9PiB7XG4gICAgaWYgKEdhbWUuc3RhdGUucGxheWVyLmF2YWlsYWJsZVNwID4gMCkge1xuICAgICAgR2FtZS5zdGF0ZS5wbGF5ZXIuYXZhaWxhYmxlU3AtLVxuICAgICAgaWYgKHN0YXQgPT0gJ3N0cicpIEdhbWUuc3RhdGUucGxheWVyLnN0cisrXG4gICAgICBpZiAoc3RhdCA9PSAnbHVrJykgR2FtZS5zdGF0ZS5wbGF5ZXIubHVrKytcbiAgICAgIGlmIChzdGF0ID09ICdkZXgnKSBHYW1lLnN0YXRlLnBsYXllci5kZXgrK1xuICAgICAgaWYgKHN0YXQgPT0gJ2ludCcpIEdhbWUuc3RhdGUucGxheWVyLmludCsrXG4gICAgICBpZiAoc3RhdCA9PSAnY2hhJykgR2FtZS5zdGF0ZS5wbGF5ZXIuY2hhKytcbiAgICAgIEdhbWUuYnVpbGRTdGF0cygpXG4gICAgICBpZiAoR2FtZS5zdGF0ZS5wbGF5ZXIuYXZhaWxhYmxlU3AgPT0gMCkge1xuICAgICAgICBHYW1lLmhpZGVUb29sdGlwKClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgdW5sb2NrVXBncmFkZXMgPSAobmFtZSkgPT4ge1xuICAgIGxldCB1cGdyYWRlID0gR2FtZS5pdGVtc1tuYW1lXVxuICAgIGlmICh1cGdyYWRlLm93bmVkIDw9IDApIHtcbiAgICAgIGlmICh1cGdyYWRlLmhpZGRlbiAhPSAwKSB7XG4gICAgICAgIHVwZ3JhZGUuaGlkZGVuID0gMFxuICAgICAgICBidWlsZFN0b3JlKClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgYWRzTG9hZGVkID0gZmFsc2VcbiAgbGV0IGxvYWRBZCA9ICgpID0+IHtcbiAgICBpZiAoYWRzTG9hZGVkID09IGZhbHNlKSB7XG4gICAgICBhZHNMb2FkZWQgPSB0cnVlXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgICBsZXQgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0JylcbiAgICAgICAgc2NyaXB0LnNyYyA9ICcvL3BhZ2VhZDIuZ29vZ2xlc3luZGljYXRpb24uY29tL3BhZ2VhZC9qcy9hZHNieWdvb2dsZS5qcydcbiAgICAgICAgbGV0IGlucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucycpXG4gICAgICAgIGlucy5jbGFzc0xpc3QuYWRkKCdhZHNieWdvb2dsZScpXG4gICAgICAgIGlucy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgICAgICBpbnMuc2V0QXR0cmlidXRlKCdkYXRhLWFkLWNsaWVudCcsICdjYS1wdWItNDU4NDU2Mzk1ODg3MDE2MycpXG4gICAgICAgIGlucy5zZXRBdHRyaWJ1dGUoJ2RhdGEtYWQtc2xvdCcsICc2NTY1MTE2NzM4JylcblxuICAgICAgICBsZXQgZGl2ID0gcygnI2Fkcy1pbS1zb3JyeS1wbGVhc2UtZG9udC1oYXRlLW1lJylcbiAgICAgICAgZGl2LmFwcGVuZENoaWxkKHNjcmlwdClcbiAgICAgICAgZGl2LmFwcGVuZENoaWxkKGlucylcblxuICAgICAgICBpZiAocygnaW5zJykuc3R5bGUuZGlzcGxheSA9PSAnYmxvY2snKSB7XG4gICAgICAgICAgaW5zLnNldEF0dHJpYnV0ZSgnZGF0YS1hZC1mb3JtYXQnLCAncmVjdGFuZ2xlLCBob3Jpem9udGFsJyk7XG4gICAgICAgICAgKGFkc2J5Z29vZ2xlID0gd2luZG93LmFkc2J5Z29vZ2xlIHx8IFtdKS5wdXNoKHt9KTtcbiAgICAgICAgfVxuICAgICAgcygnLnRhYi1jb250ZW50LWNvbnRhaW5lcicpLmFwcGVuZENoaWxkKGRpdilcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgYnV5RnVuY3Rpb24gPSAoaXRlbSkgPT4ge1xuICAgIC8vIElURU1TXG4gICAgaWYgKGl0ZW0ubmFtZSA9PSAnTWFnbmlmeWluZyBHbGFzcycpIHtcbiAgICAgIG9yZUNsaWNrQXJlYSgpXG4gICAgICBpdGVtLmhpZGRlbiA9IDJcbiAgICAgIHVubG9ja1VwZ3JhZGVzKCdDbGVhbk1hZ25pZnlpbmdHbGFzcycpXG4gICAgfVxuICAgIGlmIChpdGVtLm5hbWUgPT0gJ1NjaG9vbCcpIHtcbiAgICAgIGlmIChpdGVtLm93bmVkID09IDEpIHtcbiAgICAgICAgR2FtZS5pdGVtc1snRmFybSddLmhpZGRlbiA9IDBcbiAgICAgICAgR2FtZS5pdGVtc1snUXVhcnJ5J10uaGlkZGVuID0gMVxuICAgICAgICBHYW1lLml0ZW1zWydDaHVyY2gnXS5oaWRkZW4gPSAxXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpdGVtLm5hbWUgPT0gJ0Zhcm0nKSB7XG4gICAgICBpZiAoaXRlbS5vd25lZCA9PSAxKSB7XG4gICAgICAgIEdhbWUuaXRlbXNbJ1F1YXJyeSddLmhpZGRlbiA9IDBcbiAgICAgICAgR2FtZS5pdGVtc1snQ2h1cmNoJ10uaGlkZGVuID0gMVxuICAgICAgICBHYW1lLml0ZW1zWydGYWN0b3J5J10uaGlkZGVuID0gMVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXRlbS5uYW1lID09ICdRdWFycnknKSB7XG4gICAgICBpZiAoaXRlbS5vd25lZCA9PSAxKSB7XG4gICAgICAgIEdhbWUuaXRlbXNbJ0NodXJjaCddLmhpZGRlbiA9IDBcbiAgICAgICAgR2FtZS5pdGVtc1snRmFjdG9yeSddLmhpZGRlbiA9IDFcbiAgICAgICAgR2FtZS5pdGVtc1snQ3J5cHQnXS5oaWRkZW4gPSAxXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpdGVtLm5hbWUgPT0gJ0NodXJjaCcpIHtcbiAgICAgIGlmIChpdGVtLm93bmVkID09IDEpIHtcbiAgICAgICAgR2FtZS5pdGVtc1snRmFjdG9yeSddLmhpZGRlbiA9IDBcbiAgICAgICAgR2FtZS5pdGVtc1snQ3J5cHQnXS5oaWRkZW4gPSAxXG4gICAgICAgIEdhbWUuaXRlbXNbJ0hvc3BpdGFsJ10uaGlkZGVuID0gMVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXRlbS5uYW1lID09ICdGYWN0b3J5Jykge1xuICAgICAgaWYgKGl0ZW0ub3duZWQgPT0gMSkge1xuICAgICAgICBHYW1lLml0ZW1zWydDcnlwdCddLmhpZGRlbiA9IDBcbiAgICAgICAgR2FtZS5pdGVtc1snSG9zcGl0YWwnXS5oaWRkZW4gPSAxXG4gICAgICAgIEdhbWUuaXRlbXNbJ0NpdGFkZWwnXS5oaWRkZW4gPSAxXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpdGVtLm5hbWUgPT0gJ0NyeXB0Jykge1xuICAgICAgaWYgKGl0ZW0ub3duZWQgPT0gMSkge1xuICAgICAgICBHYW1lLml0ZW1zWydIb3NwaXRhbCddLmhpZGRlbiA9IDBcbiAgICAgICAgR2FtZS5pdGVtc1snQ2l0YWRlbCddLmhpZGRlbiA9IDFcbiAgICAgICAgR2FtZS5pdGVtc1snWGVub1NwYWNlc2hpcCddLmhpZGRlbiA9IDFcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGl0ZW0ubmFtZSA9PSAnSG9zcGl0YWwnKSB7XG4gICAgICBpZiAoaXRlbS5vd25lZCA9PSAxKSB7XG4gICAgICAgIEdhbWUuaXRlbXNbJ0NpdGFkZWwnXS5oaWRkZW4gPSAwXG4gICAgICAgIEdhbWUuaXRlbXNbJ1hlbm9TcGFjZXNoaXAnXS5oaWRkZW4gPSAxXG4gICAgICAgIEdhbWUuaXRlbXNbJ1NreUNhc3RsZSddLmhpZGRlbiA9IDFcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGl0ZW0ubmFtZSA9PSAnQ2l0YWRlbCcpIHtcbiAgICAgIGlmIChpdGVtLm93bmVkID09IDEpIHtcbiAgICAgICAgR2FtZS5pdGVtc1snWGVub1NwYWNlc2hpcCddLmhpZGRlbiA9IDBcbiAgICAgICAgR2FtZS5pdGVtc1snU2t5Q2FzdGxlJ10uaGlkZGVuID0gMVxuICAgICAgICBHYW1lLml0ZW1zWydFb25Qb3J0YWwnXS5oaWRkZW4gPSAxXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpdGVtLm5hbWUgPT0gJ1hlbm8gU3BhY2VzaGlwJykge1xuICAgICAgaWYgKGl0ZW0ub3duZWQgPT0gMSkge1xuICAgICAgICBHYW1lLml0ZW1zWydTa3lDYXN0bGUnXS5oaWRkZW4gPSAwXG4gICAgICAgIEdhbWUuaXRlbXNbJ0VvblBvcnRhbCddLmhpZGRlbiA9IDFcbiAgICAgICAgR2FtZS5pdGVtc1snU2FjcmVkTWluZXMnXS5oaWRkZW4gPSAxXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpdGVtLm5hbWUgPT0gJ1NreSBDYXN0bGUnKSB7XG4gICAgICBpZiAoaXRlbS5vd25lZCA9PSAxKSB7XG4gICAgICAgIEdhbWUuaXRlbXNbJ0VvblBvcnRhbCddLmhpZGRlbiA9IDBcbiAgICAgICAgR2FtZS5pdGVtc1snU2FjcmVkTWluZXMnXS5oaWRkZW4gPSAxXG4gICAgICAgIEdhbWUuaXRlbXNbJ08uQS5SLkQuSS5TLiddLmhpZGRlbiA9IDFcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGl0ZW0ubmFtZSA9PSAnRW9uIFBvcnRhbCcpIHtcbiAgICAgIGlmIChpdGVtLm93bmVkID09IDEpIHtcbiAgICAgICAgR2FtZS5pdGVtc1snU2FjcmVkTWluZXMnXS5oaWRkZW4gPSAwXG4gICAgICAgIEdhbWUuaXRlbXNbJ08uQS5SLkQuSS5TLiddLmhpZGRlbiA9IDFcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGl0ZW0ubmFtZSA9PSAnU2FjcmVkIE1pbmVzJykge1xuICAgICAgaWYgKGl0ZW0ub3duZWQgPT0gMSkge1xuICAgICAgICBHYW1lLml0ZW1zWydPLkEuUi5ELkkuUy4nXS5oaWRkZW4gPSAwXG4gICAgICB9XG4gICAgfVxuXG5cbiAgICAvLyBJVEVNIFVQR1JBREVTXG4gICAgaWYgKGl0ZW0ubmFtZSA9PSAnQ2xlYW4gTWFnbmlmeWluZyBHbGFzcycpIHtcbiAgICAgIGl0ZW0uaGlkZGVuID0gMVxuICAgICAgR2FtZS5zdGF0ZS5vcmVDbGlja011bHRpcGxpZXIgPSAxMFxuICAgIH1cblxuICAgIC8vIFVQR1JBREVTXG4gICAgaWYgKGl0ZW0ubmFtZSA9PSAnV29yayBCb290cycpIHtcbiAgICAgIGl0ZW0uaGlkZGVuID0gMVxuICAgICAgR2FtZS5zdGF0ZS5vcHNNdWx0aXBsaWVyICs9IC4xXG4gICAgICBHYW1lLnN0YXRlLm9wY011bHRpcGxpZXIgKz0gLjFcbiAgICB9XG4gICAgaWYgKGl0ZW0ubmFtZSA9PSAnUGFpbmtpbGxlcnMnKSB7XG4gICAgICBpdGVtLmhpZGRlbiA9IDFcbiAgICAgIEdhbWUuc3RhdGUub3BjTXVsdGlwbGllciArPSAyXG4gICAgICBHYW1lLml0ZW1zWydTdGVyb2lkcyddLmhpZGRlbiA9IDBcbiAgICB9XG4gICAgaWYgKGl0ZW0ubmFtZSA9PSAnU3Rlcm9pZHMnKSB7XG4gICAgICBpdGVtLmhpZGRlbiA9IDFcbiAgICAgIEdhbWUuc3RhdGUub3BjTXVsdGlwbGllciArPSAyXG4gICAgfVxuICB9XG5cbiAgbGV0IEl0ZW0gPSBmdW5jdGlvbihvYmosIGlkKSB7XG4gICAgLy8gdGhpcy5pZCA9IGlkXG4gICAgdGhpcy5uYW1lID0gb2JqLm5hbWVcbiAgICB0aGlzLmZ1bmN0aW9uTmFtZSA9IG9iai5uYW1lLnJlcGxhY2UoLyAvZywgJycpXG4gICAgdGhpcy50eXBlID0gb2JqLnR5cGVcbiAgICB0aGlzLnBpYyA9IG9iai5waWNcbiAgICB0aGlzLnByb2R1Y3Rpb24gPSBvYmoucHJvZHVjdGlvbiB8fCAwXG4gICAgdGhpcy5kZXNjID0gb2JqLmRlc2NcbiAgICB0aGlzLmZpbGxlclF1b3RlID0gb2JqLmZpbGxlclF1b3RlXG4gICAgdGhpcy5iYXNlUHJpY2UgPSBvYmouYmFzZVByaWNlXG4gICAgdGhpcy5wcmljZSA9IG9iai5wcmljZVxuICAgIHRoaXMuaGlkZGVuID0gb2JqLmhpZGRlblxuICAgIHRoaXMub3duZWQgPSBvYmoub3duZWQgfHwgMFxuXG4gICAgdGhpcy5idXkgPSAoKSA9PiB7XG4gICAgICBpZiAoR2FtZS5zdGF0ZS5vcmVzID49IHRoaXMucHJpY2UpIHtcbiAgICAgICAgc3BlbmQodGhpcy5wcmljZSlcbiAgICAgICAgdGhpcy5vd25lZCsrXG4gICAgICAgIHBsYXlTb3VuZCgnYnV5c291bmQnKVxuICAgICAgICB0aGlzLnByaWNlID0gdGhpcy5iYXNlUHJpY2UgKiBNYXRoLnBvdygxLjE1LCB0aGlzLm93bmVkKVxuICAgICAgICBidXlGdW5jdGlvbih0aGlzKVxuICAgICAgICBpZiAodGhpcy50eXBlID09ICd1cGdyYWRlJykge1xuICAgICAgICAgIEdhbWUuaGlkZVRvb2x0aXAoKVxuICAgICAgICB9XG4gICAgICAgIGJ1aWxkSW52ZW50b3J5KClcbiAgICAgICAgcmlzaW5nTnVtYmVyKDAsICdzcGVuZE1vbmV5JylcbiAgICAgICAgZ2VuZXJhdGVTdG9yZUl0ZW1zKClcbiAgICAgICAgYnVpbGRTdG9yZSgpXG4gICAgICB9XG4gICAgfVxuXG4gICAgR2FtZS5pdGVtc1t0aGlzLmZ1bmN0aW9uTmFtZV0gPSB0aGlzXG4gIH1cblxuICBHYW1lLml0ZW1zID0gW11cbiAgLy8gSVRFTVNcbiAgR2FtZS5pdGVtc1snTWFnbmlmeWluZ0dsYXNzJ10gPSB7XG4gICAgbmFtZTogJ01hZ25pZnlpbmcgR2xhc3MnLFxuICAgIHR5cGU6ICdpdGVtJyxcbiAgICBwaWM6ICdtYWduaWZ5aW5nLWdsYXNzLnBuZycsXG4gICAgZGVzYzogJ0FsbG93cyB5b3UgdG8gc3BvdCB3ZWFrcG9pbnRzIGluc2lkZSB0aGUgcm9jaycsXG4gICAgZmlsbGVyUXVvdGU6ICd3aXAnLFxuICAgIHByaWNlOiAxLFxuICAgIGJhc2VQcmljZTogMSxcbiAgICBoaWRkZW46IDBcbiAgfVxuICBHYW1lLml0ZW1zWydTY2hvb2wnXSA9IHtcbiAgICBuYW1lOiAnU2Nob29sJyxcbiAgICB0eXBlOiAnaXRlbScsXG4gICAgcGljOiAnd2lwLnBuZycsXG4gICAgcHJvZHVjdGlvbjogLjMsXG4gICAgZGVzYzogJ3dpcCcsXG4gICAgZmlsbGVyUXVvdGU6ICd3aXAnLFxuICAgIHByaWNlOiA2LFxuICAgIGJhc2VQcmljZTogNixcbiAgICBoaWRkZW46IDBcbiAgfVxuICBHYW1lLml0ZW1zWydGYXJtJ10gPSB7XG4gICAgbmFtZTogJ0Zhcm0nLFxuICAgIHR5cGU6ICdpdGVtJyxcbiAgICBwaWM6ICdmYXJtZXIucG5nJyxcbiAgICBwcm9kdWN0aW9uOiAxLFxuICAgIGRlc2M6ICd3aXAnLFxuICAgIGZpbGxlclF1b3RlOiAnd2lwJyxcbiAgICBwcmljZTogNzUsXG4gICAgYmFzZVByaWNlOiA3NSxcbiAgICBoaWRkZW46IDFcbiAgfVxuICBHYW1lLml0ZW1zWydRdWFycnknXSA9IHtcbiAgICBuYW1lOiAnUXVhcnJ5JyxcbiAgICB0eXBlOiAnaXRlbScsXG4gICAgcGljOiAnd2lwLnBuZycsXG4gICAgcHJvZHVjdGlvbjogMjEsXG4gICAgZGVzYzogJ3dpcCcsXG4gICAgZmlsbGVyUXVvdGU6ICd3aXAnLFxuICAgIHByaWNlOiAxMjAwLFxuICAgIGJhc2VQcmljZTogMTIwMCxcbiAgICBoaWRkZW46IDFcbiAgfVxuICBHYW1lLml0ZW1zWydDaHVyY2gnXSA9IHtcbiAgICBuYW1lOiAnQ2h1cmNoJyxcbiAgICB0eXBlOiAnaXRlbScsXG4gICAgcGljOiAnd2lwLnBuZycsXG4gICAgcHJvZHVjdGlvbjogMzAwLFxuICAgIGRlc2M6ICd3aXAnLFxuICAgIGZpbGxlclF1b3RlOiAnd2lwJyxcbiAgICBwcmljZTogNjY2MCxcbiAgICBiYXNlUHJpY2U6IDY2NjAsXG4gICAgaGlkZGVuOiAyXG4gIH1cbiAgR2FtZS5pdGVtc1snRmFjdG9yeSddID0ge1xuICAgIG5hbWU6ICdGYWN0b3J5JyxcbiAgICB0eXBlOiAnaXRlbScsXG4gICAgcGljOiAnd2lwLnBuZycsXG4gICAgcHJvZHVjdGlvbjogNTUwMCxcbiAgICBkZXNjOiAnd2lwJyxcbiAgICBmaWxsZXJRdW90ZTogJ3dpcCcsXG4gICAgcHJpY2U6IDQ4MDAwLFxuICAgIGJhc2VQcmljZTogNDgwMDAsXG4gICAgaGlkZGVuOiAyXG4gIH1cbiAgR2FtZS5pdGVtc1snQ3J5cHQnXSA9IHtcbiAgICBuYW1lOiAnQ3J5cHQnLFxuICAgIHR5cGU6ICdpdGVtJyxcbiAgICBwaWM6ICd3aXAucG5nJyxcbiAgICBwcm9kdWN0aW9uOiAzMDAwMCxcbiAgICBkZXNjOiAnd2lwJyxcbiAgICBmaWxsZXJRdW90ZTogJ3dpcCcsXG4gICAgcHJpY2U6IDI5MDAwMCxcbiAgICBiYXNlUHJpY2U6IDI5MDAwMCxcbiAgICBoaWRkZW46IDJcbiAgfVxuICBHYW1lLml0ZW1zWydIb3NwaXRhbCddID0ge1xuICAgIG5hbWU6ICdIb3NwaXRhbCcsXG4gICAgdHlwZTogJ2l0ZW0nLFxuICAgIHBpYzogJ3dpcC5wbmcnLFxuICAgIHByb2R1Y3Rpb246IDIyMDAwMCxcbiAgICBkZXNjOiAnd2lwJyxcbiAgICBmaWxsZXJRdW90ZTogJ3dpcCcsXG4gICAgcHJpY2U6IDEwMDAwMDAsXG4gICAgYmFzZVByaWNlOiAxMDAwMDAwLFxuICAgIGhpZGRlbjogMlxuICB9XG4gIEdhbWUuaXRlbXNbJ0NpdGFkZWwnXSA9IHtcbiAgICBuYW1lOiAnQ2l0YWRlbCcsXG4gICAgdHlwZTogJ2l0ZW0nLFxuICAgIHBpYzogJ3dpcC5wbmcnLFxuICAgIHByb2R1Y3Rpb246IDE2NjY2NjYsXG4gICAgZGVzYzogJ3dpcCcsXG4gICAgZmlsbGVyUXVvdGU6ICd3aXAnLFxuICAgIHByaWNlOiA2NjY2NjY2NixcbiAgICBiYXNlUHJpY2U6IDY2NjY2NjY2LFxuICAgIGhpZGRlbjogMlxuICB9XG4gIEdhbWUuaXRlbXNbJ1hlbm9TcGFjZXNoaXAnXSA9IHtcbiAgICBuYW1lOiAnWGVubyBTcGFjZXNoaXAnLFxuICAgIHR5cGU6ICdpdGVtJyxcbiAgICBwaWM6ICd3aXAucG5nJyxcbiAgICBwcm9kdWN0aW9uOiA0NTY3ODkxMCxcbiAgICBkZXNjOiAnd2lwJyxcbiAgICBmaWxsZXJRdW90ZTogJ3dpcCcsXG4gICAgcHJpY2U6IDc1ODQ5MjA0NyxcbiAgICBiYXNlUHJpY2U6IDc1ODQ5MjA0NyxcbiAgICBoaWRkZW46IDJcbiAgfVxuICBHYW1lLml0ZW1zWydTa3lDYXN0bGUnXSA9IHtcbiAgICBuYW1lOiAnU2t5IENhc3RsZScsXG4gICAgdHlwZTogJ2l0ZW0nLFxuICAgIHBpYzogJ3dpcC5wbmcnLFxuICAgIHByb2R1Y3Rpb246IDc3Nzc3Nzc3NyxcbiAgICBkZXNjOiAnd2lwJyxcbiAgICBmaWxsZXJRdW90ZTogJ3dpcCcsXG4gICAgcHJpY2U6IDU1MDAwMDAwMDAsXG4gICAgYmFzZVByaWNlOiA1NTAwMDAwMDAwLFxuICAgIGhpZGRlbjogMlxuICB9XG4gIEdhbWUuaXRlbXNbJ0VvblBvcnRhbCddID0ge1xuICAgIG5hbWU6ICdFb24gUG9ydGFsJyxcbiAgICB0eXBlOiAnaXRlbScsXG4gICAgcGljOiAnd2lwLnBuZycsXG4gICAgcHJvZHVjdGlvbjogODg4ODgwMDAwMCxcbiAgICBkZXNjOiAnd2lwJyxcbiAgICBmaWxsZXJRdW90ZTogJ3dpcCcsXG4gICAgcHJpY2U6IDc5NDMwMDAwMDAwLFxuICAgIGJhc2VQcmljZTogNzk0MzAwMDAwMDAsXG4gICAgaGlkZGVuOiAyXG4gIH1cbiAgR2FtZS5pdGVtc1snU2FjcmVkTWluZXMnXSA9IHtcbiAgICBuYW1lOiAnU2FjcmVkIE1pbmVzJyxcbiAgICB0eXBlOiAnaXRlbScsXG4gICAgcGljOiAnd2lwLnBuZycsXG4gICAgcHJvZHVjdGlvbjogNDA1MDEwMzA1MDAsXG4gICAgZGVzYzogJ3dpcCcsXG4gICAgZmlsbGVyUXVvdGU6ICd3aXAnLFxuICAgIHByaWNlOiAzMDAwMDAwMDAwMDAsXG4gICAgYmFzZVByaWNlOiAzMDAwMDAwMDAwMDAsXG4gICAgaGlkZGVuOiAyXG4gIH1cbiAgR2FtZS5pdGVtc1snTy5BLlIuRC5JLlMuJ10gPSB7XG4gICAgbmFtZTogJ08uQS5SLkQuSS5TLicsXG4gICAgdHlwZTogJ2l0ZW0nLFxuICAgIHBpYzogJ3dpcC5wbmcnLFxuICAgIHByb2R1Y3Rpb246IDExMDEwMDExMDExMCxcbiAgICBkZXNjOiAnd2lwJyxcbiAgICBmaWxsZXJRdW90ZTogJ3dpcCcsXG4gICAgcHJpY2U6IDk5OTk5OTk5OTk5OTksXG4gICAgYmFzZVByaWNlOiA5OTk5OTk5OTk5OTk5LFxuICAgIGhpZGRlbjogMlxuICB9XG5cbiAgLy8gSVRFTSBVUEdSQURFU1xuICBHYW1lLml0ZW1zWydDbGVhbk1hZ25pZnlpbmdHbGFzcyddID0ge1xuICAgIG5hbWU6ICdDbGVhbiBNYWduaWZ5aW5nIEdsYXNzJyxcbiAgICB0eXBlOiAndXBncmFkZScsXG4gICAgcGljOiAnY2xlYW4tbWFnbmlmeWluZy1nbGFzcy5wbmcnLFxuICAgIGRlc2M6ICdJbmNyZWFzZXMgY3JpdGljYWwgaGl0IG11bHRpcGxpZXIgdG8gMTB4JyxcbiAgICBmaWxsZXJRdW90ZTogJ3dpcCcsXG4gICAgcHJpY2U6IDEwMCxcbiAgICBoaWRkZW46IDEsXG4gIH1cblxuXG4gIC8vIFVQR1JBREVTXG4gIEdhbWUuaXRlbXNbJ1dvcmtCb290cyddID0ge1xuICAgIG5hbWU6ICdXb3JrIEJvb3RzJyxcbiAgICB0eXBlOiAndXBncmFkZScsXG4gICAgcGljOiAnd2lwLnBuZycsXG4gICAgZGVzYzogJ0luY3JlYXNlIGFsbCBvcmUgcHJvZHVjdGlvbiBieSAxJScsXG4gICAgZmlsbGVyUXVvdGU6ICd3aXAnLFxuICAgIHByaWNlOiA1MDAsXG4gICAgaGlkZGVuOiAxLFxuICB9XG4gIEdhbWUuaXRlbXNbJ1BhaW5raWxsZXJzJ10gPSB7XG4gICAgbmFtZTogJ1BhaW5raWxsZXJzJyxcbiAgICB0eXBlOiAndXBncmFkZScsXG4gICAgcGljOiAncGFpbmtpbGxlcnMucG5nJyxcbiAgICBkZXNjOiAnZG91YmxlIHlvdXIgT3BDJyxcbiAgICBmaWxsZXJRdW90ZTogJ3dpcCcsXG4gICAgcHJpY2U6IDE1MDAwLFxuICAgIGhpZGRlbjogMSxcbiAgfVxuICBHYW1lLml0ZW1zWydTdGVyb2lkcyddID0ge1xuICAgIG5hbWU6ICdTdGVyb2lkcycsXG4gICAgdHlwZTogJ3VwZ3JhZGUnLFxuICAgIHBpYzogJ3N0ZXJvaWRzLnBuZycsXG4gICAgZGVzYzogJ2RvdWJsZSB5b3VyIE9wQycsXG4gICAgZmlsbGVyUXVvdGU6ICd3aXAnLFxuICAgIHByaWNlOiAxMDAwMDAwLFxuICAgIGhpZGRlbjogMSxcbiAgfVxuXG4gIGxldCBnZW5lcmF0ZVN0b3JlSXRlbXMgPSAoKSA9PiB7XG4gICAgZm9yIChsZXQgaSBpbiBHYW1lLml0ZW1zKSB7XG4gICAgICBuZXcgSXRlbShHYW1lLml0ZW1zW2ldKVxuICAgIH1cbiAgfVxuXG4gIGxldCBzb3VuZFBsYXllZDEgPSBmYWxzZVxuICBsZXQgc291bmRQbGF5ZWQyID0gZmFsc2VcbiAgbGV0IHNvdW5kUGxheWVkMyA9IGZhbHNlXG4gIGxldCBzb3VuZFBsYXllZDQgPSBmYWxzZVxuICBsZXQgc291bmRQbGF5ZWQ1ID0gZmFsc2VcbiAgbGV0IHdoaWNoUGljID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogNCkgKyAxXG4gIGxldCB1cGRhdGVQZXJjZW50YWdlID0gKGFtb3VudCkgPT4ge1xuICAgIGlmIChHYW1lLnN0YXRlLm9yZUN1cnJlbnRIcCAtIGFtb3VudCA+IDApIHtcbiAgICAgIEdhbWUuc3RhdGUub3JlQ3VycmVudEhwIC09IGFtb3VudFxuICAgICAgcygnLm9yZS1ocCcpLmlubmVySFRNTCA9IGAkeygoR2FtZS5zdGF0ZS5vcmVDdXJyZW50SHAvR2FtZS5zdGF0ZS5vcmVIcCkqMTAwKS50b0ZpeGVkKDApfSVgXG5cbiAgICAgIGlmIChHYW1lLnN0YXRlLm9yZUN1cnJlbnRIcC9HYW1lLnN0YXRlLm9yZUhwID4gLjggKSB7XG4gICAgICAgIHMoJy5vcmUnKS5zdHlsZS5iYWNrZ3JvdW5kID0gYHVybChcIi4vYXNzZXRzL29yZSR7d2hpY2hQaWN9LTEucG5nXCIpYFxuICAgICAgICBzKCcub3JlJykuc3R5bGUuYmFja2dyb3VuZFNpemUgPSAnY292ZXInXG4gICAgICB9XG4gICAgICBpZiAoR2FtZS5zdGF0ZS5vcmVDdXJyZW50SHAvR2FtZS5zdGF0ZS5vcmVIcCA8PSAuOCAmJiBzb3VuZFBsYXllZDEgPT0gZmFsc2UpIHtcbiAgICAgICAgcygnLm9yZScpLnN0eWxlLmJhY2tncm91bmQgPSBgdXJsKFwiYXNzZXRzL29yZSR7d2hpY2hQaWN9LTIucG5nXCIpYFxuICAgICAgICBzKCcub3JlJykuc3R5bGUuYmFja2dyb3VuZFNpemUgPSAnY292ZXInXG4gICAgICAgIHBsYXlTb3VuZCgnZXhwbG9zaW9uJylcbiAgICAgICAgc291bmRQbGF5ZWQxID0gdHJ1ZVxuICAgICAgfVxuICAgICAgaWYgKEdhbWUuc3RhdGUub3JlQ3VycmVudEhwL0dhbWUuc3RhdGUub3JlSHAgPD0gLjYgJiYgc291bmRQbGF5ZWQyID09IGZhbHNlKSB7XG4gICAgICAgIHMoJy5vcmUnKS5zdHlsZS5iYWNrZ3JvdW5kID0gYHVybChcImFzc2V0cy9vcmUke3doaWNoUGljfS0zLnBuZ1wiKWBcbiAgICAgICAgcygnLm9yZScpLnN0eWxlLmJhY2tncm91bmRTaXplID0gJ2NvdmVyJ1xuICAgICAgICBwbGF5U291bmQoJ2V4cGxvc2lvbicpXG4gICAgICAgIHNvdW5kUGxheWVkMiA9IHRydWVcbiAgICAgIH1cbiAgICAgIGlmIChHYW1lLnN0YXRlLm9yZUN1cnJlbnRIcC9HYW1lLnN0YXRlLm9yZUhwIDw9IC40ICYmIHNvdW5kUGxheWVkMyA9PSBmYWxzZSkge1xuICAgICAgICBzKCcub3JlJykuc3R5bGUuYmFja2dyb3VuZCA9IGB1cmwoXCJhc3NldHMvb3JlJHt3aGljaFBpY30tNC5wbmdcIilgXG4gICAgICAgIHMoJy5vcmUnKS5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9ICdjb3ZlcidcbiAgICAgICAgcGxheVNvdW5kKCdleHBsb3Npb24nKVxuICAgICAgICBzb3VuZFBsYXllZDMgPSB0cnVlXG4gICAgICB9XG4gICAgICBpZiAoR2FtZS5zdGF0ZS5vcmVDdXJyZW50SHAvR2FtZS5zdGF0ZS5vcmVIcCA8PSAuMiAmJiBzb3VuZFBsYXllZDQgPT0gZmFsc2UpIHtcbiAgICAgICAgcygnLm9yZScpLnN0eWxlLmJhY2tncm91bmQgPSBgdXJsKFwiYXNzZXRzL29yZSR7d2hpY2hQaWN9LTUucG5nXCIpYFxuICAgICAgICBzKCcub3JlJykuc3R5bGUuYmFja2dyb3VuZFNpemUgPSAnY292ZXInXG4gICAgICAgIHBsYXlTb3VuZCgnZXhwbG9zaW9uJylcbiAgICAgICAgc291bmRQbGF5ZWQ0ID0gdHJ1ZVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBHYW1lLnN0YXRlLnN0YXRzLnJvY2tzRGVzdHJveWVkKytcbiAgICAgIHBsYXlTb3VuZCgnZXhwbG9zaW9uMicpXG4gICAgICBHYW1lLnN0YXRlLm9yZUhwID0gTWF0aC5wb3coR2FtZS5zdGF0ZS5vcmVIcCwgMS4xNSlcbiAgICAgIEdhbWUuc3RhdGUub3JlQ3VycmVudEhwID0gR2FtZS5zdGF0ZS5vcmVIcFxuICAgICAgZHJvcEl0ZW0oKVxuICAgICAgcygnLm9yZS1ocCcpLmlubmVySFRNTCA9ICcxMDAlJ1xuICAgICAgc291bmRQbGF5ZWQxID0gZmFsc2VcbiAgICAgIHNvdW5kUGxheWVkMiA9IGZhbHNlXG4gICAgICBzb3VuZFBsYXllZDMgPSBmYWxzZVxuICAgICAgc291bmRQbGF5ZWQ0ID0gZmFsc2VcbiAgICAgIHNvdW5kUGxheWVkNSA9IGZhbHNlXG4gICAgICB3aGljaFBpYyA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDQpICsgMVxuICAgICAgcygnLm9yZScpLnN0eWxlLmJhY2tncm91bmQgPSBgdXJsKFwiLi9hc3NldHMvb3JlJHt3aGljaFBpY30tMS5wbmdcIilgXG4gICAgICBzKCcub3JlJykuc3R5bGUuYmFja2dyb3VuZFNpemUgPSAnY292ZXInXG4gICAgfVxuICB9XG5cbiAgbGV0IG9yZUNsaWNrQXJlYSA9ICgpID0+IHtcbiAgICBsZXQgcmFuZG9tTnVtYmVyID0gKCkgPT4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogODApICsgMVxuICAgIGxldCBvcmVQb3MgPSBzKCcub3JlJykuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBsZXQgcmFuZG9tU2lnbiA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSkgKiAyIC0gMVxuICAgIGxldCBjZW50ZXJYID0gKG9yZVBvcy5sZWZ0ICsgb3JlUG9zLnJpZ2h0KSAvIDJcbiAgICBsZXQgY2VudGVyWSA9IChvcmVQb3MudG9wICsgb3JlUG9zLmJvdHRvbSkgLyAyXG4gICAgbGV0IHJhbmRvbVggPSBjZW50ZXJYICsgKHJhbmRvbU51bWJlcigpICogcmFuZG9tU2lnbilcbiAgICBsZXQgcmFuZG9tWSA9IGNlbnRlclkgKyAocmFuZG9tTnVtYmVyKCkgKiByYW5kb21TaWduKVxuXG4gICAgcygnLm9yZS1jbGljay1hcmVhJykuc3R5bGUubGVmdCA9IHJhbmRvbVggKyAncHgnXG4gICAgcygnLm9yZS1jbGljay1hcmVhJykuc3R5bGUudG9wID0gcmFuZG9tWSArICdweCdcbiAgICBzKCcub3JlLWNsaWNrLWFyZWEnKS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICB9XG5cbiAgbGV0IGdhaW5YcCA9IChhbXQpID0+IHtcbiAgICBsZXQgYW1vdW50ID0gMVxuICAgIGlmIChhbXQpIHtcbiAgICAgIGFtb3VudCA9IDJcbiAgICB9XG4gICAgaWYgKEdhbWUuc3RhdGUucGxheWVyLmN1cnJlbnRYcCA8IEdhbWUuc3RhdGUucGxheWVyLnhwTmVlZGVkKSB7XG4gICAgICBHYW1lLnN0YXRlLnBsYXllci5jdXJyZW50WHAgKz0gYW1vdW50XG4gICAgfSBlbHNlIHtcbiAgICAgIEdhbWUuc3RhdGUucGxheWVyLmN1cnJlbnRYcCA9IDBcbiAgICAgIEdhbWUuc3RhdGUucGxheWVyLmx2bCsrXG4gICAgICBHYW1lLnN0YXRlLnBsYXllci5hdmFpbGFibGVTcCArPSAzXG4gICAgICBHYW1lLmJ1aWxkU3RhdHMoKVxuICAgICAgcGxheVNvdW5kKCdsZXZlbHVwJylcbiAgICAgIEdhbWUuc3RhdGUucGxheWVyLnhwTmVlZGVkID0gTWF0aC5jZWlsKE1hdGgucG93KEdhbWUuc3RhdGUucGxheWVyLnhwTmVlZGVkLCAxLjA1KSlcbiAgICAgIHJpc2luZ051bWJlcigwLCAnbGV2ZWwnKVxuICAgIH1cbiAgICBidWlsZEludmVudG9yeSgpXG4gIH1cblxuICBsZXQgcmlzaW5nTnVtYmVyID0gKGFtb3VudCwgdHlwZSkgPT4ge1xuICAgIGxldCBtb3VzZVggPSAocygnLm9yZScpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgKyBzKCcub3JlJykuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkucmlnaHQpLzJcbiAgICBsZXQgbW91c2VZID0gKHMoJy5vcmUnKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgKyBzKCcub3JlJykuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuYm90dG9tKS8yXG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICBtb3VzZVggPSBldmVudC5jbGllbnRYXG4gICAgICBtb3VzZVkgPSBldmVudC5jbGllbnRZXG4gICAgfVxuICAgIGxldCByYW5kb21OdW1iZXIgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyMCkgKyAxXG4gICAgbGV0IHJhbmRvbVNpZ24gPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkpICogMiAtIDFcbiAgICBsZXQgcmFuZG9tTW91c2VYID0gbW91c2VYICsgKHJhbmRvbU51bWJlciAqIHJhbmRvbVNpZ24pXG5cbiAgICBsZXQgcmlzaW5nTnVtYmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICByaXNpbmdOdW1iZXIuY2xhc3NMaXN0LmFkZCgncmlzaW5nLW51bWJlcicpXG4gICAgcmlzaW5nTnVtYmVyLmlubmVySFRNTCA9IGArJHtiZWF1dGlmeShhbW91bnQudG9GaXhlZCgxKSl9YFxuICAgIHJpc2luZ051bWJlci5zdHlsZS5sZWZ0ID0gcmFuZG9tTW91c2VYICsgJ3B4J1xuICAgIHJpc2luZ051bWJlci5zdHlsZS50b3AgPSBtb3VzZVkgKyAncHgnXG5cbiAgICByaXNpbmdOdW1iZXIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG4gICAgcmlzaW5nTnVtYmVyLnN0eWxlLmZvbnRTaXplID0gJzE1cHgnXG4gICAgcmlzaW5nTnVtYmVyLnN0eWxlLmFuaW1hdGlvbiA9ICdyaXNpbmdOdW1iZXIgMnMgZWFzZS1vdXQnXG4gICAgcmlzaW5nTnVtYmVyLnN0eWxlLmFuaW1hdGlvbkZpbGxNb2RlID0gJ2ZvcndhcmRzJ1xuICAgIHJpc2luZ051bWJlci5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnXG4gICAgcmlzaW5nTnVtYmVyLnN0eWxlLmNvbG9yID0gJ3doaXRlJ1xuXG4gICAgaWYgKHR5cGUgPT0gJ2NyaXQnKSB7XG4gICAgICByaXNpbmdOdW1iZXIuc3R5bGUuZm9udFNpemUgPSAneHgtbGFyZ2UnXG4gICAgfVxuXG4gICAgaWYgKHR5cGUgPT0gJ2xldmVsJykge1xuICAgICAgcmlzaW5nTnVtYmVyLnN0eWxlLmZvbnRTaXplID0gJ3h4LWxhcmdlJ1xuICAgICAgcmlzaW5nTnVtYmVyLmlubmVySFRNTCA9ICdMRVZFTCBVUCdcbiAgICB9XG5cbiAgICBpZiAodHlwZSA9PSAnc3BlbmRNb25leScpIHtcbiAgICAgIHJpc2luZ051bWJlci5zdHlsZS5mb250U2l6ZSA9ICd4eC1sYXJnZSdcbiAgICAgIHJpc2luZ051bWJlci5pbm5lckhUTUwgPSAnLSQnXG4gICAgICByaXNpbmdOdW1iZXIuc3R5bGUuY29sb3IgPSAncmVkJ1xuICAgIH1cblxuICAgIHMoJy5wYXJ0aWNsZXMnKS5hcHBlbmRDaGlsZChyaXNpbmdOdW1iZXIpXG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHJpc2luZ051bWJlci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHJpc2luZ051bWJlcilcbiAgICB9LCAyMDAwKVxuICB9XG5cbiAgbGV0IGRyYXdSb2NrUGFydGljbGVzID0gKCkgPT4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICBsZXQgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIGRpdi5jbGFzc0xpc3QuYWRkKCdwYXJ0aWNsZScpXG4gICAgICBkaXYuc3R5bGUuYmFja2dyb3VuZCA9ICdsaWdodGdyZXknXG4gICAgICBsZXQgeCA9IGV2ZW50LmNsaWVudFhcbiAgICAgIGxldCB5ID0gZXZlbnQuY2xpZW50WVxuICAgICAgZGl2LnN0eWxlLmxlZnQgPSB4ICsgJ3B4J1xuICAgICAgZGl2LnN0eWxlLnRvcCA9IHkgKyAncHgnXG5cbiAgICAgIGxldCBwYXJ0aWNsZVkgPSB5XG4gICAgICBsZXQgcGFydGljbGVYID0geFxuXG4gICAgICBsZXQgcmFuZG9tTnVtYmVyID0gTWF0aC5yYW5kb20oKVxuICAgICAgbGV0IHJhbmRvbVNpZ24gPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkpICogMiAtIDFcblxuICAgICAgbGV0IHBhcnRpY2xlVXAgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgIHBhcnRpY2xlWCArPSByYW5kb21OdW1iZXIgKiByYW5kb21TaWduXG4gICAgICAgIHBhcnRpY2xlWSAtPSAxXG4gICAgICAgIGRpdi5zdHlsZS50b3AgPSBwYXJ0aWNsZVkgKyAncHgnXG4gICAgICAgIGRpdi5zdHlsZS5sZWZ0ID0gcGFydGljbGVYICsgJ3B4J1xuICAgICAgfSwgMTApXG5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjbGVhckludGVydmFsKHBhcnRpY2xlVXApXG5cbiAgICAgICAgbGV0IHBhcnRpY2xlRG93biA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICBwYXJ0aWNsZVggKz0gcmFuZG9tTnVtYmVyICogcmFuZG9tU2lnbiAvIDJcbiAgICAgICAgICBwYXJ0aWNsZVkgKz0gMS41XG4gICAgICAgICAgZGl2LnN0eWxlLnRvcCA9IHBhcnRpY2xlWSArICdweCdcbiAgICAgICAgICBkaXYuc3R5bGUubGVmdCA9IHBhcnRpY2xlWCArICdweCdcbiAgICAgICAgfSwgMTApXG5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbChwYXJ0aWNsZURvd24pXG4gICAgICAgICAgZGl2LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZGl2KVxuICAgICAgICB9LCAxMDAwKVxuICAgICAgfSwgMTAwKVxuXG4gICAgICBzKCdib2R5JykuYXBwZW5kQ2hpbGQoZGl2KVxuICAgIH1cbiAgfVxuXG4gIHMoJy5vcmUnKS5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGxldCBhbXQgPSBjYWxjdWxhdGVPUEMoKVxuICAgIGVhcm4oYW10KVxuICAgIGdhaW5YcCgpXG4gICAgcmlzaW5nTnVtYmVyKGFtdClcbiAgICBwbGF5U291bmQoJ29yZS1oaXQnKVxuICAgIHVwZGF0ZVBlcmNlbnRhZ2UoYW10KVxuICAgIGJ1aWxkSW52ZW50b3J5KClcbiAgICBkcmF3Um9ja1BhcnRpY2xlcygpXG4gICAgR2FtZS5zdGF0ZS5zdGF0cy5vcmVDbGlja3MrK1xuICAgIGlmIChHYW1lLnN0YXRzVmlzYWJsZSkgR2FtZS5idWlsZFN0YXRzKClcbiAgICBpZiAoR2FtZS5zdGF0ZS5zdGF0cy5vcmVDbGlja3MgPj0gMTAgKSB1bmxvY2tVcGdyYWRlcygnV29ya0Jvb3RzJylcbiAgICBpZiAoR2FtZS5zdGF0ZS5zdGF0cy5vcmVDbGlja3MgPj0gMTAwKSB1bmxvY2tVcGdyYWRlcygnUGFpbmtpbGxlcnMnKVxuICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuY2xpY2stbWUtY29udGFpbmVyJykpIHtcbiAgICAgIGxldCBjbGlja01lQ29udGFpbmVyID0gcygnLmNsaWNrLW1lLWNvbnRhaW5lcicpXG4gICAgICBjbGlja01lQ29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2xpY2tNZUNvbnRhaW5lcilcbiAgICB9XG4gIH1cblxuICBzKCcub3JlLWNsaWNrLWFyZWEnKS5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGxldCBhbXQgPSBjYWxjdWxhdGVPUEMoJ2NyaXQnKVxuICAgIEdhbWUuc3RhdGUuc3RhdHMub3JlQ2xpY2tzKytcbiAgICBHYW1lLnN0YXRlLnN0YXRzLm9yZUNyaXRDbGlja3MrK1xuICAgIGVhcm4oYW10KVxuICAgIGdhaW5YcCgzKVxuICAgIHJpc2luZ051bWJlcihhbXQsICdjcml0JylcbiAgICBwbGF5U291bmQoJ29yZS1jcml0LWhpdCcpXG4gICAgdXBkYXRlUGVyY2VudGFnZShhbXQpXG4gICAgYnVpbGRJbnZlbnRvcnkoKVxuICAgIGRyYXdSb2NrUGFydGljbGVzKClcbiAgICBvcmVDbGlja0FyZWEoKVxuICB9XG5cbiAgLy8gSU5JVCBTSElUXG4gIGJ1aWxkSW52ZW50b3J5KClcbiAgR2FtZS5idWlsZFN0YXRzKClcbiAgZ2VuZXJhdGVTdG9yZUl0ZW1zKClcbiAgYnVpbGRTdG9yZSgpXG4gIEdhbWUubG9hZCgpXG4gIEdhbWUuYnVpbGRTdGF0cygpXG4gIHNldEludGVydmFsKCgpID0+IHtcbiAgICBnYWluWHAoKVxuICAgIEdhbWUuc3RhdGUuc3RhdHMudGltZVBsYXllZCsrXG4gIH0sIDEwMDApXG4gIHNldEludGVydmFsKCgpID0+IHtcbiAgICBHYW1lLnNhdmUoKVxuICB9LCAxMDAwICogMzApXG4gIHVwZGF0ZVBlcmNlbnRhZ2UoMClcbiAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgIGVhcm5PUFMoKVxuICB9LCAxMDAwIC8gMzApXG4gIHdpbmRvdy5vbnJlc2l6ZSA9ICgpID0+IHtcbiAgICBpZiAoR2FtZS5pdGVtc1snTWFnbmlmeWluZ0dsYXNzJ10ub3duZWQgPiAwKSB7XG4gICAgICBvcmVDbGlja0FyZWEoKVxuICAgIH1cbiAgfVxuICBpZiAoR2FtZS5zdGF0ZS5zdGF0cy5vcmVDbGlja3MgPT0gMCkge1xuICAgIGxldCBjbGlja01lQ29udGFpbmVyID0gcygnLmNsaWNrLW1lLWNvbnRhaW5lcicpXG4gICAgbGV0IG9yZVBvcyA9IHMoJy5vcmUnKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGNsaWNrTWVDb250YWluZXIuc3R5bGUudG9wID0gKG9yZVBvcy50b3AgKyBvcmVQb3MuYm90dG9tKS8yICsgJ3B4J1xuICAgIGNsaWNrTWVDb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cImNsaWNrLW1lLWxlZnRcIj5cbiAgICAgICAgPHAgc3R5bGU9J3RleHQtYWxpZ246IGNlbnRlcjsnPkNsaWNrIG1lITwvcD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImNsaWNrLW1lLXJpZ2h0XCI+PC9kaXY+XG4gICAgYFxuICAgIGNsaWNrTWVDb250YWluZXIuc3R5bGUubGVmdCA9IG9yZVBvcy5sZWZ0IC0gY2xpY2tNZUNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aCArICdweCdcbiAgICBzKCdib2R5JykuYXBwZW5kQ2hpbGQoY2xpY2tNZUNvbnRhaW5lcilcbiAgfVxuICBpZiAoR2FtZS5pdGVtc1snTWFnbmlmeWluZ0dsYXNzJ10ub3duZWQgPiAwKSBvcmVDbGlja0FyZWEoKVxufVxuXG53aW5kb3cub25sb2FkID0gKCkgPT4ge1xuICBHYW1lLmxhdW5jaCgpO1xufVxuXG4iXX0=
