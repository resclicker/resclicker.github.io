var game = new Phaser.Game(800, 600, Phaser.AUTO, '');
 
game.state.add('play', {
    preload: function() {
        this.game.load.image('sadfrog1', 'assets/sadfrog002.png');
        this.game.load.image('background1', 'assets/stockholm.png');
        this.game.load.image('tear', 'assets/tear2.png');
        this.game.load.image('help-clickfrog', 'assets/help-clickfrog.png');

        // build panel for upgrades
        var bmd = this.game.add.bitmapData(250, 500);
        bmd.ctx.fillStyle = '#9a783d';
        bmd.ctx.strokeStyle = '#35371c';
        bmd.ctx.lineWidth = 12;
        bmd.ctx.fillRect(0, 0, 250, 500);
        bmd.ctx.strokeRect(0, 0, 250, 500);
        this.game.cache.addBitmapData('upgradePanel', bmd);
        
        var buttonImage = this.game.add.bitmapData(476, 48);
        buttonImage.ctx.fillStyle = '#e6dec7';
        buttonImage.ctx.strokeStyle = '#35371c';
        buttonImage.ctx.lineWidth = 4;
        buttonImage.ctx.fillRect(0, 0, 225, 48);
        buttonImage.ctx.strokeRect(0, 0, 225, 48);
        this.game.cache.addBitmapData('button', buttonImage);

        var statsSize = {w: 800, h: 126};
        var statsPanel = this.game.add.bitmapData(statsSize.w, statsSize.h);
        statsPanel.ctx.fillStyle = '#9a783d';
        statsPanel.ctx.strokeStyle = '#35371c';
        statsPanel.ctx.lineWidth = 0;
        statsPanel.ctx.fillRect(0, 0, statsSize.w, statsSize.h);
        statsPanel.ctx.strokeRect(0, 0, statsSize.w, statsSize.h);
        this.game.cache.addBitmapData('statsPanel', statsPanel);
    },
    create: function() {
        

        var state = this;
 
        this.background = this.game.add.group();

        ['background1']  //add moar bg!!
            .forEach(function(image) {
                var bg = state.game.add.tileSprite(0, 0, state.game.world.width,
                state.game.world.height, image, '', state.background);
                bg.tileScale.setTo(1,1);
            });

        this.upgradeButtonsData = [
            {icon: 'yyy', id: 'L1 Smurfling', name: 'L1 Smurfling', level: 0, baseCost: 20, cost: 20, purchaseHandler: function(button, player) {
                player.tps += 0.1;
            }},
            {icon: 'xxx', id: 'Builder smurf', name: 'Builder smurf', level: 0, baseCost: 100, cost: 100, purchaseHandler: function(button, player) {
                player.tps += 0.5;
            }},
            {icon: 'xxx', id: 'L7 Levler', name: 'L7 Levler', level: 0, baseCost: 500, cost: 500, purchaseHandler: function(button, player) {
                player.tps += 1;
            }}
        ];

        // the main player
        this.player = {
            checkPoint: -1,
            checkPointTears: 0,
            tears: 0,
            manualTears: 0,
            clickTears: 1,
            tps: 0
        };

        this.loadSavedGameState();

        this.frog = this.add.group();
        this.frog.x = 100;
        this.frog.y = 170;

        this.frog2 = this.game.add.button(118, 90, 'sadfrog1');
        this.frog2.anchor.setTo(0.5, 0.5);
        this.frog2.scale.setTo(0.99, 0.99);
        this.frog2.events.onInputDown.add(state.onClickFrog, state);
        this.frog2.events.onInputOver.add(state.onInputOverFrog, state);
        this.frog2.events.onInputOut.add(state.onInputOutFrog, state);
        this.frog2.inputOverTween = this.game.add.tween(this.frog2.scale)
            .to({x: 1, y: 1}, 100, Phaser.Easing.Linear.In);
        this.frog2.inputOutTween = this.game.add.tween(this.frog2.scale)
            .to({x: 0.99, y: 0.99}, 100, Phaser.Easing.Linear.In);
        this.frog.add(this.frog2);

        this.tearTextPool = this.add.group();
        var tearText;
        for (var d=0; d<50; d++) {
            tearText = this.add.text(0, 0, '1', {
                font: '32px Arial Black',
                fill: '#fff',
                strokeThickness: 4
            });
            // start out not existing, so we don't draw it yet
            tearText.exists = false;
            tearText.anchor.setTo(0, 1);
            this.tearTextPool.add(tearText);
        }

        // create a pool of tears
        this.tearPool = this.add.group();
        var tearCoords = [{x: 115, y: 70}, {x: 185, y: 75}];
        for (var d=0; d<50; d++) {

            var rand = tearCoords[Math.floor(Math.random() * tearCoords.length)];
            var tear = this.add.image(rand.x, rand.y, 'tear');
            tear.exists = false;
            tear.spawnX = rand.x;
            tear.spawnY = rand.y;
            tear.tween = this.game.add.tween(tear)
                .to({
                    alpha: 0,
                    y: rand.y + 500,
                    x: rand.x
                }, 1000, Phaser.Easing.Exponential.In);
            this.tearPool.add(tear);
            tear.tween.onComplete.add(function(tear, tween){
                tear.kill();
            });
        }
        this.tearPool.x =0;
        this.tearPool.y =0;
        this.frog.add(this.tearPool);

        this.helpClickFrog = this.game.add.image(350, 230, 'help-clickfrog');
        this.helpClickFrog.spawnX = this.helpClickFrog.x;
        this.helpClickFrog.spawnY = this.helpClickFrog.y;
        this.helpClickFrog.scale.setTo(0.5, 0.5);

        this.helpClickFrog.exists = false;
        this.helpClickFrog.tween = this.game.add.tween(this.helpClickFrog)
            .to({x: this.helpClickFrog.x - 20}, 2000, Phaser.Easing.Bounce.Out);
        this.helpClickFrog.tween.onComplete.add(function(sprite, tween) {
            console.log('onComplete');
            sprite.kill();
            state.showHelpClickFrog();
        });
        this.frog.add(this.helpClickFrog);

        this.statsUI = this.game.add.group();

        this.statsPanel = this.game.add.image(0, 0, this.game.cache.getBitmapData('statsPanel'));
        this.statsPanel.alpha = 0.2;
        this.statsUI.add(this.statsPanel);

        var playerTearsLabel = this.add.text(25, 5, 'Tears:', {
            font: '18px Arial Black',
            fill: '#fff',
            strokeThickness: 4
        });
        this.statsUI.add(playerTearsLabel);
        this.playerTearsText = this.add.text(25, 30, '0', {
            font: '24px Arial Black',
            fill: '#fff',
            strokeThickness: 4
        });
        this.statsUI.add(this.playerTearsText);

        var tpsLabel = this.add.text(25, 65, 'Tears per second: ', {
            font: '18px Arial Black',
            fill: '#fff',
            strokeThickness: 4
        });
        this.statsUI.add(tpsLabel);
        this.tpsText = this.add.text(25, 90, '0', {
            font: '24px Arial Black',
            fill: '#fff',
            strokeThickness: 4
        });
        this.statsUI.add(this.tpsText);
        this.statsUI.x = 0;
        this.statsUI.y = 30;

        this.upgradePanel = this.game.add.image(500, 70, this.game.cache.getBitmapData('upgradePanel'));
        var upgradeButtons = this.upgradePanel.addChild(this.game.add.group());
        upgradeButtons.position.setTo(8, 8);

        var button;
        this.upgradeButtonsData.forEach(function(buttonData, index) {
            button = state.game.add.button(0, (50 * index), state.game.cache.getBitmapData('button'));
            //button.icon = button.addChild(state.game.add.image(6, 6, buttonData.icon));
            button.text = button.addChild(state.game.add.text(42, 6, buttonData.name + ': ' + buttonData.level, {font: '16px Arial Black'}));
            button.details = buttonData;
            button.costText = button.addChild(state.game.add.text(42, 24, 'Cost: ' + buttonData.cost, {font: '16px Arial Black'}));
            button.events.onInputDown.add(state.onUpgradeButtonClick, state);
         
            upgradeButtons.addChild(button);
        });

        this.upfront = this.game.add.group();

        this.tpsTimer = this.game.time.events.loop(100, this.onTPS, this);
        this.saveTimer = this.game.time.events.loop(10000, this.saveGameState, this);
        this.displayTears();
        this.showHelpClickFrog();
    },
    render: function() {
    },
    displayTears: function() {
        this.playerTearsText.text = '' + Math.round(this.player.tears);
        this.tpsText.text = '' + Math.round(this.player.tps * 10) / 10;
    },
    recordCheckPoint: function() {
        this.player.checkPoint = Date.now();
        this.player.checkPointTears = this.player.tears;
    },
    onClickFrog: function(xxx, pointer) {
        // grab a damage text from the pool to display what happened
        var tearText = this.tearTextPool.getFirstExists(false);
        if (tearText) {
            tearText.text = '+' + this.player.clickTears;
            tearText.reset(pointer.positionDown.x, pointer.positionDown.y);
            tearText.alpha = 1;
            var tw = this.game.add.tween(tearText)
                .to({
                    x: pointer.x,
                    y: pointer.y - 40,
                    alpha: 0
                }, 2000, Phaser.Easing.Exponential.Out);
            tw.onComplete.add(function(text, tween) {
                text.kill();
            });
            tw.start();
        }
        var tear = this.tearPool.getFirstExists(false);
        if(tear) {
            tear.reset(tear.spawnX, tear.spawnY);
            tear.alpha = 1;
            tear.tween.start();
        }
        this.player.manualTears += this.player.clickTears;
        this.player.tears += this.player.clickTears;
        this.recordCheckPoint();
        this.displayTears();
        this.saveGameState();
    },
    onUpgradeButtonClick: function(button, pointer) {

        if (this.player.tears - button.details.cost >= 0) {
            this.player.tears -= button.details.cost;
            console.log('new balance: ' + this.player.tears);
            this.recordCheckPoint();
            button.details.level++;
            button.details.cost = costOf(button.details);
            button.text.text = button.details.name + ': ' + button.details.level;
            button.costText.text = 'Cost: ' + button.details.cost;
            button.details.purchaseHandler.call(this, button, this.player);
            this.displayTears();
            this.saveGameState();
        } else {
            console.log('cant afford: ' + this.player.tears + ' < ' + button.details.cost);
        }
    },
    onTPS: function() {
        if (this.player.tps > 0 && this.player.checkPoint > 0) {

            this.player.tears = this.player.checkPointTears + this.player.tps * secondsSince(this.player.checkPoint);
            this.displayTears();
        }
    },
    onInputOverFrog: function(button, pointer) {
        button.inputOverTween.start();
    },
    onInputOutFrog: function(button, pointer) {
        button.inputOutTween.start();
    },
    saveGameState: function() {
        if (!supportsLocalStorage()) { return false; }

        var localStorage = window['localStorage'];
        console.log('localStorage: ' + localStorage);

        localStorage["resclicker.savegames.1.player"] = '{\
            "version": 1,\
            "player": ' +
            JSON.stringify(this.player) +
            '}';
        localStorage["resclicker.savegames.1.upgrades"] = '{\
            "version": 1,\
            "upgrades": ' +
            JSON.stringify(this.upgradeButtonsData) +
            '}';
        return true;
    },
    loadSavedGameState: function() {
        if (!supportsLocalStorage()) { return false; }

        var localStorage = window['localStorage'];

        var pk = "resclicker.savegames.1.player";
        var storedPlayer = pk in localStorage ? localStorage[pk] : null;
        var uk = "resclicker.savegames.1.upgrades";
        var storedUpgrades = uk in localStorage ? localStorage[uk] : null;
        console.log('storedPlayer: ' + storedPlayer);
        console.log('storedUpgrades: ' + storedUpgrades);
        if(storedPlayer !== null && storedUpgrades !== null) {
            this.player = JSON.parse(storedPlayer).player;
            var state = this;
            JSON.parse(storedUpgrades).upgrades.forEach(function(savedUpgrade, index) {
                state.upgradeButtonsData.forEach(function(upgrade, index) {
                    if(savedUpgrade.id == upgrade.id) {
                        upgrade.level = savedUpgrade.level;
                        console.log("upgrade.level: " + upgrade.level);
                        upgrade.cost = costOf(upgrade);
                    }
                });
            });
            return true;
        } else return false;
    },
    showHelpClickFrog: function() {
        if(this.player.manualTears < 5) {
            this.upfront.add(this.helpClickFrog);
            this.helpClickFrog.reset(this.helpClickFrog.spawnX, this.helpClickFrog.spawnY);
            //this.helpClickFrog.exists = true;
            this.helpClickFrog.tween.start();
        }
    },
    showHelpBuyUpgrade: function() {
 
    }
});

function secondsSince(timestamp) {
    return (Date.now() - timestamp) / 1000;
}

function costOf(upgrade) {
    return Math.round(upgrade.baseCost * Math.pow(1.15, upgrade.level));
}

function supportsLocalStorage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}

game.state.start('play');
