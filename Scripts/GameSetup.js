const cardW = 16;
const cardH = 22;
const namePlateW = cardW*2;
const namePlateH = Math.floor(cardW/2);
const boardW = cardW*6 + namePlateH*2;//35*2;
const boardH = cardW*4 + namePlateH;//25*2;
const tokenD = Math.floor(boardW/8);

function GameSetup(playerAmm,_parent){
	this.voteSheet = PIXI.loader.resources["./Img/vote.json"];
	this.questSheet = PIXI.loader.resources["./Img/quest.json"];
	this.tokensSheet = PIXI.loader.resources["./Img/tokens.json"];
	
	this.setTable = function(playerAmm){
		let table = new Object();
		
		let windowW = window.innerWidth;
		let windowH = window.innerHeight;
		
		let gameH = cardH*2 + namePlateH*3 + namePlateW*2; //1320
		let gameW = cardH*2 + namePlateH*4 + namePlateW*3; //1720
		if(playerAmm < 8)
			gameH -= (cardH + namePlateH);
		
		let scaleX = Math.floor(windowW/gameW);
		let scaleY = Math.floor(windowH/gameH);
		let scale = (scaleX > scaleY) ? scaleY : scaleX;
		
		table.gameH = gameH;
		table.gameW = gameW;
		table.scale = scale;
		table.windowW = windowW;
		table.windowH = windowH;
		//console.log("scale: "+ scale);
		return table;
	}
	this.setPositions = function(playerAmm){
		let margin = namePlateH;
		let playerSize = namePlateW;
		let scale = this.table.scale;
		
		this.positions = new Object();
		this.positions.center = new Object();
		this.positions.center.x = Math.floor(this.table.windowW/2);
		this.positions.center.y = Math.floor(this.table.windowH/2);
		if(playerAmm < 8)
			this.positions.center.y -= (cardH + namePlateH)*scale/2;
		
		
		let playersCon = new Array();
		for(let i = 0; i < 10; i++){
			playersCon.push(new PIXI.Container());
			playersCon[i].name = i;
			playersCon[i].interactive = true;
			playersCon[i].on('mouseover', () => {if(_parent.selectingparty || _parent.assasinMerlin)playersCon[i].alpha = 0.8;})
			.on('pointerout', () => {playersCon[i].alpha = 1;})
			.on('click', () => {_parent.selectCrew(i)});
		}
		playersCon[0].position.set(this.positions.center.x + (cardW + margin) * scale , this.positions.center.y + (Math.floor(boardH/2) * scale));
		playersCon[1].position.set(playersCon[0].x - (margin + playerSize) * scale, playersCon[0].y);
		playersCon[2].position.set(playersCon[1].x - (margin + playerSize) * scale, playersCon[0].y);
		playersCon[3].position.set(playersCon[2].x , this.positions.center.y + (Math.floor(margin/2) * scale));
		playersCon[4].position.set(playersCon[3].x , this.positions.center.y  - (playerSize + Math.floor(margin/2)) * scale);
		playersCon[5].position.set(playersCon[2].x , this.positions.center.y - (Math.floor(boardH/2) + cardH + namePlateH) * scale);
		playersCon[6].position.set(playersCon[1].x , playersCon[5].y);
		playersCon[7].position.set(playersCon[0].x , playersCon[5].y);
		playersCon[8].position.set(playersCon[0].x + (playerSize * scale), playersCon[4].y  + (playerSize * scale));
		playersCon[9].position.set(playersCon[8].x , playersCon[8].y + (playerSize + margin) * scale);
		if(playerAmm < 8){
			playersCon[5].position.set(playersCon[8].x , playersCon[8].y);
			playersCon[6].position.set(playersCon[9].x , playersCon[9].y);
		}
		
		this.playersCon = playersCon;
		return playersCon;
	}
	this.setBackground = function(playerAmm){
		let bg = new PIXI.Sprite(PIXI.loader.resources["./Img/background.png"].texture);
		bg.anchor.set(0);
		let scale = this.table.scale;
		if(playerAmm < 8)
			bg.position.set(this.positions.center.x - Math.floor(this.table.gameW/2*scale),this.positions.center.y - Math.floor(boardH/2*scale));
		else
			bg.position.set(this.positions.center.x - Math.floor(this.table.gameW/2*scale),this.positions.center.y - Math.floor(this.table.gameH/2*scale));
		bg.width = this.table.gameW*scale;
		bg.height = this.table.gameH*scale;
		bg.zOrder = 10;
		return bg;
	}
	this.setPlayers = function(nicks,cha){
		this.player = _parent.player;
		this.info = _parent.info;
		let charactersSheet = PIXI.loader.resources["./Img/characters.json"];
		let amm = nicks.length;
		let players = new Array();
		for(let i = 0; i < amm; i++){
			players.push(new Object());
			players[i].nick = nicks[i];
			if(this.player.character !== null && this.player.id == i){
				players[i].card_player = new PIXI.Sprite(charactersSheet.textures[this.player.character+".png"]);
			}else if(this.info[i].character != "unknown" && this.info[i].character !== null){
				players[i].card_player = new PIXI.Sprite(charactersSheet.textures[this.info[i].character+".png"]);
			}else if(this.info[i].alignment != "unknown" && this.info[i].alignment !== null){
				players[i].card_player = new PIXI.Sprite(charactersSheet.textures[this.info[i].alignment+".png"]);
			}else{
				players[i].card_player = new PIXI.Sprite(charactersSheet.textures["chback.png"]);
			}
			players[i].card_player.anchor.set(0);
			players[i].card_vote = new PIXI.Sprite(this.voteSheet.textures["back.png"]);
			players[i].card_vote.anchor.set(0);
			players[i].namePlate = new PIXI.Graphics();
			players[i].party = new PIXI.Sprite(this.tokensSheet.textures["questParty.png"]);
		}
		this.players = players;
		players.zOrder = 0;
		this.resizePlayers();
		return players;
	}
	this.resizePlayers = function(){
		let players = this.players;
		let board = this.board;
		let scale = this.table.scale;
		for(let i = 0; i < players.length; i++){
			players[i].card_player.width = cardW*scale;
			players[i].card_player.height = cardH*scale;
			players[i].card_vote.width = cardW*scale;
			players[i].card_vote.height = cardH*scale;
			players[i].namePlateText = new PIXI.Text(players[i].nick,{fontSize: 3*scale, fill: 0x0044aa, padding: 3*scale, wordWrap: true, breakWords: true, wordWrapWidth: namePlateW*scale/2-scale*2,lineHeight: namePlateH*scale/2, "dropShadow": true, "dropShadowAngle": 1, "dropShadowBlur": 10, "dropShadowDistance": 2});
			players[i].namePlateText.x += scale;
			players[i].card_player.position.set(0, namePlateH * scale);
			players[i].card_vote.position.set(cardW * scale, namePlateH * scale);
			
			if(i == 3 || i == 4){
				this.playersCon[i].rotation = 1.57079633;
			}else if(i == 8 || i == 9){
				this.playersCon[i].rotation = -1.57079633;
			}else if(players.length < 8){
				if(i == 5 || i == 6)
					this.playersCon[i].rotation = -1.57079633;
			}
			players[i].namePlate.beginFill(0xaaaa66);
			players[i].namePlate.drawRect(0, 0, namePlateW*scale, namePlateH*scale);
			players[i].namePlate.endFill();
			players[i].party.position.set((cardW*1.5)*scale, 0);
			players[i].party.width = Math.floor(namePlateW/4)*scale;
			players[i].party.height = namePlateH*scale;
			players[i].party.visible = false;
		}
	} 
	this.setBoard = function(playerAmm){
		if(playerAmm < 5) //for dev purpose
			playerAmm = 5;
		let boardsSheet = PIXI.loader.resources["./Img/boards.json"];
		let board = new PIXI.Sprite(boardsSheet.textures[`board${playerAmm}.png`]);
		board.anchor.set(0);
		let scale = this.table.scale;
		board.position.set(Math.floor(this.positions.center.x - (boardW/2*scale)), Math.floor(this.positions.center.y - (boardH/2*scale)));//
		board.width = boardW*scale;
		board.height = boardH*scale;
		board.zOrder = 1;
		this.board = board;
		return board;
	}
	this.setVote = function(){
		let scale = this.table.scale;
		let voteCon = new PIXI.Container();
		voteCon.position.set(this.positions.center.x-(cardW*2+namePlateH)*scale,this.positions.center.y-(cardW+namePlateH)*scale);
		
		let voteYes = new PIXI.Sprite(this.voteSheet.textures["yes.png"]);
		voteYes.anchor.set(0);
		voteYes.height = cardH*scale*2;
		voteYes.width = cardW*scale*2;
		voteYes.interactive = true;
		voteYes.buttonMode = true;
		voteYes.on('mouseover', () => {voteYes.alpha = 0.8;})
		.on('pointerout', () => {voteYes.alpha = 1;})
		.on('click', _parent.voteYes.bind(_parent));
		voteCon.addChild(voteYes);
		
		let voteNo = new PIXI.Sprite(this.voteSheet.textures["no.png"]);
		voteNo.anchor.set(0);
		voteNo.height = cardH*scale*2;
		voteNo.width = cardW*scale*2;
		voteNo.position.set((cardW+namePlateH)*scale*2, 0);
		voteNo.interactive = true;
		voteNo.buttonMode = true;
		voteNo.on('mouseover', () => {voteNo.alpha = 0.8;})
		.on('pointerout', () => {voteNo.alpha = 1;})
		.on('click', _parent.voteNo.bind(_parent));
		voteCon.addChild(voteNo);
		
		//voteCon.interactiveChildren = false;
		voteCon.visible = false;
		voteCon.zOrder = 0;
		return voteCon;
	}
	this.setQuest = function(){
		let scale = this.table.scale;
		let questCon = new PIXI.Container();
		questCon.position.set(this.positions.center.x-(cardW*2+namePlateH)*scale,this.positions.center.y-(cardW+namePlateH)*scale);
		
		let questWin = new PIXI.Sprite(this.questSheet.textures["win.png"]);
		questWin.anchor.set(0);
		questWin.height = cardH*scale*2;
		questWin.width = cardW*scale*2;
		questWin.interactive = true;
		questWin.buttonMode = true;
		questWin.on('mouseover', () => {questWin.alpha = 0.8;})
		.on('pointerout', () => {questWin.alpha = 1;})
		.on('click', _parent.questWin.bind(_parent));
		questCon.addChild(questWin);
		
		let questFail = new PIXI.Sprite(this.questSheet.textures["fail.png"]);
		questFail.anchor.set(0);
		questFail.height = cardH*scale*2;
		questFail.width = cardW*scale*2;
		questFail.position.set((cardW+namePlateH)*scale*2, 0);
		questFail.interactive = true;
		questFail.buttonMode = true;
		questFail.on('mouseover', () => {questFail.alpha = 0.8;})
		.on('pointerout', () => {questFail.alpha = 1;})
		.on('click', _parent.questFail.bind(_parent));
		questCon.addChild(questFail);
		
		questCon.visible = false;
		questCon.zOrder = 0;
		return questCon;
	}
	this.setQuestReults = function(){
		let scale = this.table.scale;
		let questResCon = new PIXI.Container();
		questResCon.position.set(this.positions.center.x-(cardW*2.5+namePlateH*2)*scale,this.positions.center.y-(cardH/2)*scale);
		let questResults = new Array();
		for(let i = 0; i < 5; i++){
			questResults[i] = new PIXI.Sprite(this.questSheet.textures["qback.png"]);
			questResults[i].anchor.set(0);
			questResults[i].height = cardH*scale;
			questResults[i].width = cardW*scale;
			questResults[i].position.set((cardW+namePlateH)*scale*i, 0);
			questResults[i].visible = false;
			questResCon.addChild(questResults[i]);
		}
		questResCon.visible = false;
		questResCon.zOrder = 0;
		return questResCon;
	}
	this.setTokens = function(playerAmm){
		if(playerAmm < 5) //for dev purpose
			playerAmm = 5;
		let scale = this.table.scale;
		let tokens = new Object();
		tokens.vote = new PIXI.Sprite(this.tokensSheet.textures["tvote.png"]);
		tokens.vote.position.set(Math.floor(this.positions.center.x - (boardW/2*scale)*0.95), Math.floor(this.positions.center.y + (boardH/2*scale)*0.9 - tokenD*scale));
		tokens.vote.width = tokenD*scale;
		tokens.vote.height = tokenD*scale;
		tokens.turn = new PIXI.Sprite(this.tokensSheet.textures["turn.png"]);
		tokens.turn.position.set(cardW*this.table.scale, 0)
		tokens.turn.width = namePlateH*(scale);
		tokens.turn.height = namePlateH*(scale);
		tokens.mission = new PIXI.Container();
		tokens.mission.position.set(0,this.positions.center.y - (boardH/2*scale) + (tokenD/2*scale));
		for(let i = 0; i < 5; i++){
			let token = new PIXI.Sprite(this.tokensSheet.textures["twin.png"]);
			token.width = tokenD*scale;
			token.height = tokenD*scale;
			token.position.set(token.width*1.2*(i+1), 0);
			token.visible = false;
			tokens.mission.addChild(token);
		}
		return tokens;
	}
	this.setInfoCorner = function(){
		let scale = this.table.scale;
		let infoCon = new PIXI.Container();
		infoCon.position.set(this.playersCon[2].x-(cardH*scale+namePlateH*scale),this.playersCon[2].y);
		let bg = new PIXI.Graphics();
		bg.beginFill(0x000000,0.7);
		bg.drawRect(0, 0, cardH*scale+namePlateH*scale,cardH*scale+namePlateH*scale);
		bg.beginFill(0xaaaa66,0.5);
		bg.drawRoundedRect(Math.floor(scale/2), Math.floor(scale/2), cardH*scale+namePlateH*scale-scale,cardH*scale+namePlateH*scale-scale,scale);
		bg.endFill();
		let txt = new PIXI.Text("Loading...",{fontSize: 3*scale, fill: 0x0044aa, padding: 3*scale, wordWrap: true, wordWrapWidth: namePlateW*scale-scale*2,lineHeight: namePlateH*scale/2, "dropShadow": false, "dropShadowAngle": 1, "dropShadowBlur": 10, "dropShadowDistance": 2});
		txt.x += scale;
		txt.y += scale;
		infoCon.addChild(bg);
		infoCon.addChild(txt);
		return infoCon;
	}
	this.infoTexts = Object.freeze({
		"selectParty": (param) => {return (`Wybierz ${param} członków drużyny`);},
		"selectingParty": (param) => {return (`Gracz ${param} wybiera członków drużyny`);},
		"vote": "Zagłosuj Zgoda/Sprzeciw",
		"votePassed": "Głosowanie przeszło",
		"voteFailed": "Głosowanie nie powiodło się",
		"onQuest": "Wybierz wynik misji",
		"waitingOnQuest": "Czekaj aż drużyna wróci z wyprawy"
		})
	this.table = this.setTable(playerAmm);
}