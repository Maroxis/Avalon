class Game {
	constructor(packet) {
		this.main = packet.main;
		this.setup = this.setup.bind(this);
		this.player = new Object();
		this.player.id = packet.id;
		this.player.character = packet.character;
		this.player.alignment = packet.alignment;
		this.info = new Array();
		this.info = packet.charInfo;
		this.nicks = packet.nicks;	
		this.selectingparty = false;
		this.assasinMerlin = false;
		this.partysize = 0;
		this.party = new Array();
		let loader = PIXI.loader;
		let type = "WebGL"
		if(!PIXI.utils.isWebGLSupported()){
			type = "canvas"
		}
		this.app = new PIXI.Application({ 
			width: window.innerWidth,     // default: 800
			height: window.innerHeight,    // default: 600
			antialias: true,    					 // default: false
			transparent: false, 					 // default: false
			resolution: 1      					   // default: 1
		});
		
		document.body.appendChild(this.app.view);
		
		loader.add([
			"./Img/boards.json",
			"./Img/vote.json",
			"./Img/characters.json",
			"./Img/tokens.json",
			"./Img/quest.json",
			"./Img/background.png"
		]);
		loader.onProgress.add(loadProgressHandler);
		loader.load(this.setup);
			
		function loadProgressHandler(loader, resource) {
			//console.log("progress: " + loader.progress + "%");  
		}
	}	
	setup() {
		this.questSheet = PIXI.loader.resources["./Img/quest.json"];
		this.tokensSheet = PIXI.loader.resources["./Img/tokens.json"];
		this.voteSheet = PIXI.loader.resources["./Img/vote.json"];
		this.gamesetup = new GameSetup(this.nicks.length,this);
		this.playersCon = this.gamesetup.setPositions(this.nicks.length);
		this.board = this.gamesetup.setBoard(this.nicks.length);
		this.voteCon = this.gamesetup.setVote();
		this.questCon = this.gamesetup.setQuest();
		this.questResCon = this.gamesetup.setQuestReults()
		this.tokens = this.gamesetup.setTokens();
		this.background = this.gamesetup.setBackground(this.nicks.length);
		//this.infoCorner = this.gamesetup.setInfoCorner();
		this.app.stage.addChild(this.background);
		this.app.stage.addChild(this.board);
		//this.app.stage.addChild(this.infoCorner);
		this.app.stage.addChild(this.tokens.vote);
		this.board.addChild(this.tokens.mission);
		this.app.stage.addChild(this.voteCon);
		this.app.stage.addChild(this.questCon);
		this.app.stage.addChild(this.questResCon);
		
		this.players = this.gamesetup.setPlayers(this.nicks,this.character);
		
		for(let i = 0; i < this.players.length; i++){
			this.playersCon[i].addChild(this.players[i].card_player);
			this.playersCon[i].addChild(this.players[i].card_vote);
			this.playersCon[i].addChild(this.players[i].namePlate);
			this.playersCon[i].addChild(this.players[i].namePlateText);
			this.playersCon[i].addChild(this.players[i].party);
			this.app.stage.addChild(this.playersCon[i]);
		}
		this.main.gameReady();
	}
	setObserver(observer){
		this.observer = observer;
	}
	selectCrew(id){
		if(this.assasinMerlin){
			let packet = new Object()
			packet.id = this.player.id;
			packet.target = id;
			this.main.assasinMerlin(packet);
			return;
		}
		if(this.selectingparty){
			if(!this.players[id].party.visible){
				this.players[id].party.visible = true;
				this.party.push(id);
				if(this.party.length == this.partysize){
					let packet = new Object()
					packet.id = this.player.id;
					packet.party = this.party;
					this.main.sendParty(packet);
					this.selectingparty = false;
				}
			}else{
				this.players[id].party.visible = false;
				for(let i = 0; i < this.party.length; i++){
					this.party[i] == id;
					this.party.splice(i, 1);
					return;
				}
			}
		}
	}
	setParty(party){
		this.clearParty();
		for(let i = 0; i < party.length; i ++){
			this.players[party[i]].party.visible = true;
		}
		this.party.splice(0,this.party.length)//clear array
		if(!this.observer)
			this.selectVote();
	}
	clearParty(){
		for(let i = 0; i < this.players.length; i ++){
			this.players[i].party.visible = false;
		}
	}
	setTurn(packet){
		let turn = packet.turn;
		
		if(turn > this.players.length-1 || turn < 0)
			return false;
		
		this.clearParty();
		this.partysize = packet.pSize;
		let prevTurn = turn-1;
		if(prevTurn < 0)
				prevTurn = this.players.length-1;
		this.playersCon[prevTurn].removeChild(this.tokens.turn);
		this.playersCon[turn].addChild(this.tokens.turn);
		if(turn == this.player.id){
			this.selectingparty = true;
			//this.infoCorner.children[1].text = this.gamesetup.infoTexts.selectParty(this.partysize);
		}
		else{
			this.selectingparty = false;
			//this.infoCorner.children[1].text = this.gamesetup.infoTexts.selectingParty(this.nicks[turn]);
		}
	}
	selectVote(){
		//this.infoCorner.children[1].text = this.gamesetup.infoTexts.vote;
		this.voteCon.visible = true;
	}
	showQuest(){
		this.questCon.visible = true;
	}
	questWin(){
		this.questCon.visible = false;
		let p = this.questPacket("win");
		this.main.sendQuestResult(p)
		return true;
	}
	questFail(){
		if(this.player.alignment == "good")
			return false;
		this.questCon.visible = false;
		let p = this.questPacket("fail");
		this.main.sendQuestResult(p)
		return true;
	}
	questPacket(res){
		let packet = new Object();
		packet.id = this.player.id;
		packet.result = res;
		return packet;
	}
	questResult(result){
		let res = result.res;
		let win = result.win;
		
		this.questResCon.visible = true;
		let quests = this.questResCon.children;
		for(let i = 0; i < res.length; i++){
			quests[i].visible = true;
		}
		
		(function showResLoop(i,sheet) {
			setTimeout(function() {
				quests[i].texture = sheet.textures[res[i]+".png"];
				if (++i < res.length)
					showResLoop(i,sheet);	
			}, 800)
		})(0,this.questSheet);
		
		setTimeout(this.clearQuestResult.bind(this), 1000*this.players.length);
		setTimeout(function() {this.addMissionToken(win);}.bind(this), 1000*this.players.length)
	}
	addMissionToken(win){
		let missions = this.tokens.mission.children;
		for(let i = 0; i < missions.length; i++){
			if(!missions[i].visible){
				missions[i].visible = true;
				if(!win)
					missions[i].texture = this.tokensSheet.textures["tfail.png"];
				return;
			}
		}
	}
	clearQuestResult(){
		this.questResCon.visible = false;
		let quests = this.questResCon.children;
		for(let i = 0; i < quests.length; i++){
			quests[i].texture = this.questSheet.textures["qback.png"];
			quests[i].visible = false;
		}
	}
	voteYes(){ 
		this.voted("yes");
	}
	voteNo(){
		this.voted("no");
	}
	voted(vote){
		let packet = new Object();
		packet.id = this.player.id;
		packet.vote = vote;
		this.main.voted(packet)
		this.voteCon.visible = false;
	}
	setFailVote(slot){
		if(slot<0 || slot>5)
			return false;
		let scale = this.gamesetup.table.scale;
		this.tokens.vote.x = Math.floor(this.gamesetup.positions.center.x - (boardW/2*scale)*0.955) + this.tokens.vote.width*1.215*slot;
	}
	voteResult(res){
		let voteFail = 0;
		for(let i = 0; i < res.length; i++){
			if(res[i] == "no")
				voteFail++;
			this.players[i].card_vote.texture = this.voteSheet.textures[res[i]+".png"];
		}
		//console.log(voteFail + "  " + this.players.length + "  " + Math.ceil(this.players.length/2));
		if(voteFail >= Math.ceil(this.players.length/2)){
			//this.infoCorner.children[1].text = this.gamesetup.infoTexts.voteFailed;
		}
		else{
			//this.infoCorner.children[1].text = this.gamesetup.infoTexts.votePassed;
		}
		setTimeout(this.clearVoteResult.bind(this), 1000*this.players.length);
	}
	clearVoteResult(){
		for(let i = 0; i < this.players.length; i++){
			this.players[i].card_vote.texture = this.voteSheet.textures["back.png"];
		}
	}
	goOnQuest(){
		this.showQuest();
	}
	assasinShoot(){
		this.assasinMerlin = true;
		alert("assasinate merlin");
	}
	evilWin(){
		alert("Evil Won");
	}
	goodWin(){
		alert("Good Won");
	}
}

// remove sprite
//app.stage.removeChild(anySprite);
//anySprite.visible = false;
