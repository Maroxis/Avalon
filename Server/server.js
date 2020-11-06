const fs = require("fs");
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const config = require('./config.json');
const gameConfig = require('./game_config.json');
const path = require('path');
const io = require('socket.io')(http);

const port = config.Port;
const mainDir = path.join(__dirname, '../');
const imgDir = path.join(mainDir, '/Img');
const gameStEnum = Object.freeze({"loading":0,"partySelect":1,"partyVote":2,"quest":3,"assasin":4})
var user_max = config.User_max;
var nicks;
var players;
var gameState;
var map;
var vote;
var quest;
var party;
var playerTurn = 0;

function init(){
	players = new Array();
	nicks = new Array();
	party = new Array();
	map = new Object();
	map.currentMission = 1;
	map.type = null;
	map.partySize = null;
	vote = new Object();
	vote.total = 0;
	vote.yes = 0;
	vote.no = 0;
	vote.failCount = 0;
	quest = new Object();
	quest.total = 0;
	quest.win = 0;
	quest.fail = 0;
	//quest.results = new Array();
	quest.totalWin = 0;
	quest.totalFail = 0;
	gameState = gameStEnum.loading;
}
init();
app.use("/Img",express.static(imgDir));

app.get('/', (req, res) => {
  res.sendFile('/index.html', { root: mainDir });
});
app.get('/favicon.ico', (req, res) => {
  res.status(204).send({});
});
app.get('/Style.css', (req, res) => {
  res.sendFile('/Style.css', { root: mainDir });
});
app.get('/Scripts/Lib/socket.io-2.3.1.slim.js', (req, res) => {
  res.sendFile('/Scripts/Lib/socket.io-2.3.1.slim.js', { root: mainDir });
});
app.get('/Scripts/Lib/jquery-3.5.1.min.js', (req, res) => {
  res.sendFile('/Scripts/Lib/jquery-3.5.1.min.js', { root: mainDir });
});
app.get('/Scripts/Lib/pixi.min.js', (req, res) => {
  res.sendFile('/Scripts/Lib/pixi.min.js', { root: mainDir });
});
app.get('/Scripts/Main.js', (req, res) => {
  res.sendFile('/Scripts/Main.js', { root: mainDir });
});
app.get('/Scripts/Net.js', (req, res) => {
  res.sendFile('/Scripts/Net.js', { root: mainDir });
});
app.get('/Scripts/Game.js', (req, res) => {
  res.sendFile('/Scripts/Game.js', { root: mainDir });
});
app.get('/Scripts/GameSetup.js', (req, res) => {
  res.sendFile('/Scripts/GameSetup.js', { root: mainDir });
});

io.on('connection', (socket) => {
	if(gameState !== gameStEnum.loading){//game in progress
		let packet = startPacket(null);
		socket.emit('game_start',packet)
		//socket.emit('game_inprogress', nicks);
	}
  //console.log('user connected: '+socket.id);
	
	socket.on('user_add', (nick) => {
		if(gameState !== gameStEnum.loading){
			let packet = startPacket(null);
			socket.emit('game_start',packet)
			return;
		}
		//console.log('adding user '+socket.id);
		if(players.length == user_max){
			console.log('user_max')
			socket.emit('user_maxReached', user_max);
			return;
		}
		for(let i = 0; i < players.length; i ++){
			if(players[i].nick == nick){
				socket.emit('user_dupName');
				console.log('user_dupName')
				return;
			}else
				socket.emit('user_add', players[i].nick); //send current nicks to client
		}
		let player = new Object();
		player.nick = nick;
		player.id = socket.id;
		player.voted = null;
		player.quest = null;
		players.push(player);
		io.emit('user_add', nick); // send new nick to all clients
		console.log(`user added: ${nick}`);
		
	});
	
	socket.on('game_start', () => {
		if(gameState !== gameStEnum.loading)
			return;
		gameState = gameStEnum.partySelect;
		charAssign();
		if(players.length < 5){
			fakePlayers();
		}
		for(let i = 0; i < players.length; i++){
			nicks.push(players[i].nick);
		}
		for(let i = 0; i < players.length; i++){
			let packet = startPacket(i);
			io.to(players[i].id).emit('game_start',packet)
		}
		map.type = gameConfig.map_config.party_size["map"+players.length];
		map.partySize = map.type["mission"+map.currentMission];
		console.log("   ---   game started   ---   ");
		//console.log("turn: "+playerTurn);
	});	
  socket.on('disconnect', () => {
		if(gameState !== gameStEnum.loading)
			return;

		for(let i = 0; i < players.length; i++){
			if(players[i].id == socket.id){
				console.log('user removed: ' + players[i].nick);
				socket.broadcast.emit('user_removed', players[i].nick);
				players.splice(i, 1);
				console.log(players);
			}
		}
  });
	socket.on('game_partySelect', (packet) => {
		if(gameState !== gameStEnum.partySelect || packet.id !== playerTurn)
			return;
		party = packet.party;
		gameState = gameStEnum.partyVote;
		//console.log(" - party selected - ");
		io.emit('game_partySelect', party);
  });
	socket.on('game_partyVote', (packet) => {
		let id = packet.id;
		let voteRs = packet.vote;
		
		if(gameState !== gameStEnum.partyVote || id == null)
			return;

		if(players[id].voted === null){
			players[id].voted = voteRs;
			//console.log(players[id].nick + " Voted: " + voteRs);
			if(voteRs == "yes")
				vote.yes++
			else
				vote.no++;
			vote.total++;
			voteCheck();
		}
  });	
	socket.on('game_sendQuestResult', (packet) => {
		let id = packet.id;
		let questRs = packet.result;
		
		if(gameState !== gameStEnum.quest || id == null)
			return;
		
		if(players[id].quest === null){
			players[id].quest = questRs;
			//console.log(players[id].nick + " Quest: " + questRs);
			if(questRs == "win"){
				quest.win++;
			}else{
				quest.fail++;
			}
			quest.total++;
			questCheck();
		}
	});	
	socket.on('game_ready', () => {
		let turnPacket = new Object();
		turnPacket.turn = playerTurn;
		turnPacket.pSize = map.type["mission"+map.currentMission];
		socket.emit('game_setTurn', turnPacket);
		socket.emit('game_setVoteFail', vote.failCount);
  });		
	socket.on('game_assasinMerlin', (packet) => {
		let id = packet.id;
		let target = packet.target;
		
		if(gameState != gameStEnum.assasin || id == null)
			return;
		
		for(let i = 0; i < players.length; i++){
			if(players[i].character == "assasin" && id == i){
				for(let j = 0; j < players.length; j++){
					if(players[j].character == "merlin"){
						if(target == j){
							io.emit('game_evilWin');
							console.log("merlin assasinated");
						}
						else{
							io.emit('game_goodWin');
							console.log("good won");
						}
						return;
					}
				}
			}
		}
  });		
});
function fakePlayers(){
	for(let i = players.length; i < 5; i++){
		let nick = i;
		let player = new Object();
		player.nick = nick;
		player.id = null;
		player.voted = null;
		players.push(player);
		io.emit('user_add', nick); // send new nick to all clients
		console.log(`user faked: ${nick}`);
	}
}
function setTurn(){
	if(playerTurn == players.length)
			playerTurn = 0;
	//console.log("turn: "+playerTurn);
	let turnPacket = new Object();
	turnPacket.turn = playerTurn;
	turnPacket.pSize = map.partySize;
	io.emit('game_setTurn', turnPacket); 
}
function voteCheck(){
	if(vote.total == players.length){
		let res = votePacket();
		io.emit('game_voteResult', res);
		if(vote.yes >= Math.floor(players.length/2)+1){
			setTimeout(votePassed, 1000*players.length);
		}else{
			gameState = gameStEnum.partySelect;
			setTimeout(voteFailed, 1000*players.length);
		}
		voteZero();
	}
}
function questCheck(){
	if(quest.total == map.partySize){
		let win;
		let faR = gameConfig.map_config.fail_required["map"+players.length];
		if(quest.fail < faR["mission"+map.currentMission]){
			win = true;
			setTimeout(questWin, 1000*players.length);
		}else{
			setTimeout(questFail, 1000*players.length);
			win = false;
		}
		let res = questPacket(win);
		io.emit('game_questResult', res);
		gameState = gameStEnum.partySelect;
		questZero();
		map.currentMission++;
		map.partySize = map.type["mission"+map.currentMission];
	}
}
function sendOnQuest(){
	for(let i = 0; i < party.length; i++){
		io.to(players[party[i]].id).emit('goOnQuest');
	}
}
function votePassed(){
	vote.failCount = 0;
	io.emit('game_setVoteFail', vote.failCount);
	gameState = gameStEnum.quest;
	setTimeout(sendOnQuest, 1000);
}
function voteFailed(){
	vote.failCount++;
	if(vote.failCount == 5){
		io.emit('game_evilWin');
		console.log("evil won");
	}
	else{
		io.emit('game_setVoteFail', vote.failCount);
		playerTurn++;
		setTurn();
	}
}
function questWin(){
	//quest.results.push("win");
	quest.totalWin++;
	if(quest.totalWin == 3){
		assasinShoot();
	}else{
		playerTurn++;
		setTurn();
	}
}
function assasinShoot(){
	gameState = gameStEnum.assasin;
	if(gameConfig.characters.assasin){
		for(let i = 0; i < players.length; i++){
			if(players[i].character == "assasin"){
				io.to(players[i].id).emit('game_assasinShoot');
				return;
			}
		}
	}else{
		io.emit('game_goodWin'); 
		console.log("good won");
	}
}
function questFail(){
	//quest.results.push("fail");
	quest.totalFail++;
	if(quest.totalFail == 3){
		io.emit('game_evilWin');
	}else{
		playerTurn++;
		setTurn();
	}
}
function questZero(){
	quest.total = 0;
	quest.win = 0;
	quest.fail = 0;
	for(let i = 0; i< players.length; i++){
		players[i].quest = null;
	}
}
function voteZero(){
	vote.total = 0;
	vote.yes = 0;
	vote.no = 0;
	for(let i = 0; i< players.length; i++){
		players[i].voted = null;
	}
}
function votePacket(){
	let packet = new Array()
	for(let i = 0; i < players.length; i++){
		packet[i] = players[i].voted;
	}
	return packet;
}
function questPacket(win){
	let packet = new Object();
	packet.res = new Array()
	for(let i = 0; i < party.length; i++){ //todo maybe shuffle/sort instead of priority of sending
		packet.res[i] = players[party[i]].quest;
	}
	packet.win = win;
	return packet;
}
function startPacket(i){
	let packet = new Object();
	packet.id = i;
	packet.nicks = nicks;
	if(i !== null){
		packet.character = players[i].character;
		packet.charInfo = new Array();
		switch(players[i].character){
			case "merlin":
				packet.alignment = "good";
				for(let j = 0; j < players.length; j++){
					let pl = new Object();
					pl.character = "unknown";
					if(players[j].alignment == "evil" && players[j].character != "mordred")
						pl.alignment = players[j].alignment;
					else 
						pl.alignment = "unknown"
					packet.charInfo[j] = pl;
				}
			break;
			case "parsifal":
				packet.alignment = "good";
				for(let j = 0; j < players.length; j++){
					let pl = new Object();
					pl.alignment = "unknown";
					if(players[j].character == "merlin" || players[j].character == "morgana"){
						if(gameConfig.characters.morgana){
							pl.character = "merlinMorgana";
						}else{
							pl.character = "merlin";
						}
					}
						
					else
						pl.character = "unknown";
					packet.charInfo[j] = pl;
				}
			break;
			case "oberon":
				packet.alignment = "evil";
				for(let j = 0; j < players.length; j++){
					let pl = new Object();
					pl.alignment = "unknown";
					pl.character = "unknown";
					packet.charInfo[j] = pl;
				}
			break;
			default:
				if(players[i].alignment == "good"){
					packet.alignment = "good";
					for(let j = 0; j < players.length; j++){
						let pl = new Object();
						pl.alignment = "unknown";
						pl.character = "unknown";
						packet.charInfo[j] = pl;
					}
				}else if(players[i].alignment == "evil"){
					packet.alignment = "evil";
					for(let j = 0; j < players.length; j++){
						let pl = new Object();
						if(players[j].alignment == "evil" && players[j].character != "oberon"){
							pl.alignment = "evil";
							pl.character = players[j].character;
						}else{
							pl.alignment = "unknown";
							pl.character = "unknown";
						}
						packet.charInfo[j] = pl;
					}
				}
			break;
		}
	}else if(gameConfig.observer.fullVision){
		packet.character = null;
		packet.charInfo = new Array();
		for(let j = 0; j < players.length; j++){
			let pl = new Object();
			pl.character = players[j].character;
			pl.alignment = players[j].alignment;
			packet.charInfo[j] = pl;
		}
	}else {
		packet.character = null;
		packet.charInfo = null;
	}
	return packet;
}
function charAssign(){
	let good;
	let evil;
	switch(players.length){
		case 5:
			good = 3;
			evil = 2;
		break;
		case 6:
			good = 4;
			evil = 2;
		break;
		case 7:
			good = 4;
			evil = 3;
		break;
		case 8:
			good = 5;
			evil = 3;
		break;
		case 9:
			good = 6;
			evil = 3;
		break;
		case 10:
			good = 6;
			evil = 4;
		break;
		default:
			good = players.length;
			evil = 0;
		break;
	}
	let characters = gameConfig.characters;
	let ids = new Array();
	for(let i = 0; i < players.length; i++){
		ids.push(i);
	}
	if(characters.merlin && good > 0){
		let r = Math.floor(Math.random() * (ids.length-1));
		players[ids[r]].character = "merlin";
		players[ids[r]].alignment = "good";
		ids.splice(r, 1);
		good--;
	}
	if(characters.parsifal && good > 0){
		let r = Math.floor(Math.random() * (ids.length-1));
		players[ids[r]].character = "parsifal";
		players[ids[r]].alignment = "good";
		ids.splice(r, 1);
		good--
	}
	while(good > 0){
		let r = Math.floor(Math.random() * (ids.length-1));
		players[ids[r]].character = "pa"+((good%4)+1);
		players[ids[r]].alignment = "good";
		ids.splice(r, 1);
		good--;
	}
	if(characters.assasin && evil > 0){
		let r = Math.floor(Math.random() * (ids.length-1));
		players[ids[r]].character = "assasin";
		players[ids[r]].alignment = "evil";
		ids.splice(r, 1);
		evil--;
	}
	if(characters.morgana && evil > 0){
		let r = Math.floor(Math.random() * (ids.length-1));
		players[ids[r]].character = "morgana";
		players[ids[r]].alignment = "evil";
		ids.splice(r, 1);
		evil--;
	}
	if(characters.mordred && evil > 0){
		let r = Math.floor(Math.random() * (ids.length-1));
		players[ids[r]].character = "mordred";
		players[ids[r]].alignment = "evil";
		ids.splice(r, 1);
		evil--;
	}
	if(characters.oberon && evil > 0){
		let r = Math.floor(Math.random() * (ids.length-1));
		players[ids[r]].character = "oberon";
		players[ids[r]].alignment = "evil";
		ids.splice(r, 1);
		evil--;
	}
	while(evil > 0){
		let r = Math.floor(Math.random() * (ids.length-1));
		players[ids[r]].character = "pm"+((evil%2)+1);
		players[ids[r]].alignment = "evil";
		ids.splice(r, 1);
		evil--;
	}
}
http.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});