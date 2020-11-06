function Main() {
    var net = new Net(this);
		var game;
		waiting = false;
		
		this.createGame = function(packet){
			packet.main = this;
			game = new Game(packet);
		}
		this.gameReady = function(){
			net.gameReady();
		}
		this.setObserver = (observer) => {game.setObserver(observer);}
		this.setTurn = (packet) => {game.setTurn(packet);}
		this.sendParty = (packet) => {net.sendParty(packet);}
		this.partySelect = (party) => {game.setParty(party);}
		this.voted = (packet) => {net.vote(packet);}
		this.setFailVote = (pos) => {	game.setFailVote(pos);}
		this.goOnQuest = () => {game.goOnQuest();}
		this.voteResult = (res) => {game.voteResult(res);}
		this.sendQuestResult = (packet) => {net.sendQuestResult(packet);}
		this.questResult = (res) => {game.questResult(res);}
		this.assasinShoot = () => {game.assasinShoot();}
		this.assasinMerlin = (packet) => {net.assasinMerlin(packet);}
		this.evilWin = () => {game.evilWin();}
		this.goodWin = () => {game.goodWin();}
}