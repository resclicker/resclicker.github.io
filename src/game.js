var game = new Phaser.Game(800, 600, Phaser.AUTO, '');
 
game.state.add('play', {
    preload: function() {
        this.game.load.image('sadfrog1', 'assets/sadfrog002.png');
        this.game.load.image('background1', 'assets/stockholm.png');
        this.game.load.image('tear', 'assets/tear2.png');

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

        var upgradeButtonsData = [
            {icon: 'yyy', name: 'L1 Smurfling', level: 1, baseCost: 5, cost: 5, purchaseHandler: function(button, player) {
                player.tps += 1;
            }},
            {icon: 'xxx', name: 'L7 Levler', level: 0, baseCost: 25, cost: 25, purchaseHandler: function(button, player) {
                player.tps += 5;
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

        this.frog2 = this.game.add.button(100, 100, 'sadfrog1');
        this.frog2.events.onInputDown.add(state.onClickFrog, state);

        this.tearTextPool = this.add.group();
        var tearText;
        for (var d=0; d<50; d++) {
            tearText = this.add.text(0, 0, '1', {
                font: '64px Arial Black',
                fill: '#fff',
                strokeThickness: 4
            });
            // start out not existing, so we don't draw it yet
            tearText.exists = false;
            tearText.tween = game.add.tween(tearText)
                .to({
                    alpha: 0,
                    y: 100,
                    x: this.game.rnd.integerInRange(100, 700)
                }, 1000, Phaser.Easing.Cubic.Out);
         
            tearText.tween.onComplete.add(function(text, tween) {
                text.kill();
            });
            this.tearTextPool.add(tearText);
        }

        // create a pool of tears
        this.tearPool = this.add.group();
        var tearCoords = [{x: 210, y: 160}, {x: 285, y: 175}];
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

        this.playerTearsText = this.add.text(30, 30, 'Tears: ' + this.player.tears, {
            font: '24px Arial Black',
            fill: '#fff',
            strokeThickness: 4
        });

        this.upgradePanel = this.game.add.image(500, 70, this.game.cache.getBitmapData('upgradePanel'));
        var upgradeButtons = this.upgradePanel.addChild(this.game.add.group());
        upgradeButtons.position.setTo(8, 8);

        var button;
        upgradeButtonsData.forEach(function(buttonData, index) {
            button = state.game.add.button(0, (50 * index), state.game.cache.getBitmapData('button'));
            button.icon = button.addChild(state.game.add.image(6, 6, buttonData.icon));
            button.text = button.addChild(state.game.add.text(42, 6, buttonData.name + ': ' + buttonData.level, {font: '16px Arial Black'}));
            button.details = buttonData;
            button.costText = button.addChild(state.game.add.text(42, 24, 'Cost: ' + buttonData.cost, {font: '16px Arial Black'}));
            button.events.onInputDown.add(state.onUpgradeButtonClick, state);
         
            upgradeButtons.addChild(button);
        });

        //this.frog2.icon = this.frog2.addChile(state.game.add.image(0, 0, ));
        this.tpsTimer = this.game.time.events.loop(100, this.onTPS, this);
    },
    render: function() {
    },
    displayTears: function() {
        this.playerTearsText.text = 'Tears: ' + Math.round(this.player.tears);
    },
    recordCheckPoint: function() {
        this.player.checkPoint = Date.now();
        this.player.checkPointTears = this.player.tears;
    },
    onClickFrog: function(xxx, pointer) {
        // grab a damage text from the pool to display what happened
        var tearText = this.tearTextPool.getFirstExists(false);
        if (tearText) {
            tearText.text = this.player.clickTears;
            tearText.reset(pointer.positionDown.x, pointer.positionDown.y);
            tearText.alpha = 1;
            tearText.tween.start();
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
    },
    onUpgradeButtonClick: function(button, pointer) {

        if (this.player.tears - button.details.cost >= 0) {
            this.player.tears -= button.details.cost;
            console.log('new balance: ' + this.player.tears);
            this.recordCheckPoint();
            button.details.level++;
            button.details.cost = costOf(button.details);
            button.text.text = button.details.name + ': ' + button.details.level;
            button.costText.text = button.details.cost;
            button.details.purchaseHandler.call(this, button, this.player);
        } else {
            console.log('cant afford: ' + this.player.tears + ' < ' + button.details.cost);
        }
    },
    onTPS: function() {
        if (this.player.tps > 0 && this.player.checkPoint > 0) {

            this.player.tears = this.player.checkPointTears + this.player.tps * secondsSince(this.player.checkPoint);
            this.displayTears();
        }
    }
});

function secondsSince(timestamp) {
    return (Date.now() - timestamp) / 1000;
}

function costOf(upgrade) {
    return upgrade.baseCost * Math.pow(1.15, upgrade.level);
}

game.state.start('play');
