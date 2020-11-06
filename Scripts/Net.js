function Net(m) {
	var main = m;
	var socket = io();
	var observer;
	this.gameReady = function(){
		socket.emit('game_ready');
		main.setObserver(observer);
	}
	this.sendParty = function(packet){
		socket.emit('game_partySelect', packet);
	}
	this.vote = function(packet){
		socket.emit('game_partyVote', packet);
	}
	this.sendQuestResult = function(packet){
		socket.emit('game_sendQuestResult', packet);
	}
	this.assasinMerlin = function(packet){
		socket.emit('game_assasinMerlin', packet);
	}
	$(function () {
		$('form').submit(function(e) {
			e.preventDefault(); // prevents page reloading
			socket.emit('user_add', $('#inNick').val().toUpperCase().substring(0, 12));
			$('#logIn').hide();
			$('#lobbyPlayerList').empty()
			$('#lobby').show();
			waiting = true;
			observer = false;
			return false;
		});
		$( "#btStart" ).click(function() {
			socket.emit('game_start');
		});
		socket.on('user_add', function(nick){
			if(waiting)
				$('#lobbyPlayerList').append($('<li>').text(nick));
		});
		socket.on('user_dupName', function(){
			$('#logIn').show();
			$('#lobby').hide();
			alert("choose another nickname")
		});
		socket.on('user_maxReached', function(max){
			$('#lobby').hide();
			$('#fullLobby').show();
			$( '#fullLobby' ).text( "Lobby is full ("+max+")" );
		});
		socket.on('user_removed', function(nick){
			$('li').filter(function() { return $.text([this]) === nick; }).remove();
		});
		socket.on('game_start', function(packet){
			$('#menu').hide();
			main.createGame(packet);
			if(!waiting){
				observer = true;
				alert("you are observer");
			}
		});
		socket.on('game_setTurn', function(packet){
			main.setTurn(packet);
		});
		socket.on('game_partySelect', function(party){
			main.partySelect(party);
		});
		socket.on('game_setVoteFail', function(pos){
			main.setFailVote(pos);
		});
		socket.on('game_voteResult', function(res){
			main.voteResult(res);
		});
		socket.on('goOnQuest', function(){
			main.goOnQuest();
		});
		socket.on('game_questResult', function(res){
			main.questResult(res);
		});
		socket.on('game_assasinShoot', function(){
			main.assasinShoot();
		});
		socket.on('game_evilWin', function(){
			main.evilWin();
		});
		socket.on('game_goodWin', function(){
			main.goodWin();
		});
	});
}