const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, maxHttpBufferSize: 1e8 });

mongoose.set('bufferCommands', false); 

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auction_pro";
const AuctionModel = mongoose.model('AuctionState', new mongoose.Schema({ state: Object }));

let db = {
    tournaments: [],
    activeTournamentId: null,
    currentAuction: { activePlayer: null, bidHistory: [], currentBid: 0, currentBidderId: null, status: 'IDLE', timeLeft: 30, isPaused: false }
};

let isDbConnected = false;

// Connect to DB
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 })
    .then(async () => {
        isDbConnected = true;
        const saved = await AuctionModel.findOne();
        if (saved) db = saved.state;
        console.log("📦 DB Connected");
    }).catch(() => console.log("⚠️ DB Not Found. Running in Memory mode."));

const persist = async () => {
    if (!isDbConnected) return;
    try { AuctionModel.findOneAndUpdate({}, { state: db }, { upsert: true }).exec(); } catch (e) {}
};

// --- REAL-TIME TIMER ENGINE ---
let timer;
const runTimer = () => {
    clearInterval(timer);
    timer = setInterval(() => {
        if (db.currentAuction.status === 'BIDDING' && !db.currentAuction.isPaused) {
            if (db.currentAuction.timeLeft > 0) {
                db.currentAuction.timeLeft--;
                io.emit('timer_update', db.currentAuction.timeLeft); // Tick-tock
            } else {
                db.currentAuction.isPaused = true;
                io.emit('auction_update', db.currentAuction);
            }
        }
    }, 1000);
};
runTimer(); // Start the engine

const getTour = () => db.tournaments.find(t => t.id === db.activeTournamentId) || db.tournaments[db.tournaments.length - 1];

io.on('connection', (socket) => {
    socket.emit('init_data', db);

    socket.on('create_tournament', (data) => {
        const id = `tour-${Date.now()}`;
        db.tournaments.push({ id, name: data.name, budget: data.budget, teams: [], players: [], soldPlayers: [], unsoldPlayers: [] });
        db.activeTournamentId = id;
        io.emit('init_data', db);
        persist();
    });

    socket.on('start_player', (playerId) => {
        const tour = getTour();
        const player = tour?.players.find(p => p.id === playerId);
        if(!player) return;
        db.currentAuction = { activePlayer: player, bidHistory: [], currentBid: player.basePrice, currentBidderId: null, status: 'BIDDING', timeLeft: 30, isPaused: false };
        io.emit('auction_update', db.currentAuction);
    });

    socket.on('place_bid', ({ teamId, amount }) => {
        db.currentAuction.bidHistory.push({ bidderId: db.currentAuction.currentBidderId, amount: db.currentAuction.currentBid });
        db.currentAuction.currentBid = amount;
        db.currentAuction.currentBidderId = teamId;
        db.currentAuction.timeLeft = 30; // AUTO-RESET TIMER ON BID
        io.emit('auction_update', db.currentAuction);
        io.emit('trigger_anim', 'bid_pulse');
    });

    socket.on('finalize_sold', () => {
        const tour = getTour();
        const { activePlayer, currentBid, currentBidderId } = db.currentAuction;
        if (!activePlayer || !tour) return;
        if (currentBidderId) {
            tour.soldPlayers.push({ ...activePlayer, soldPrice: currentBid, teamId: currentBidderId });
            const tIdx = tour.teams.findIndex(t => t.id === currentBidderId);
            if (tIdx > -1) tour.teams[tIdx].purse -= currentBid;
            db.currentAuction.status = 'SOLD';
        } else {
            tour.unsoldPlayers.push({ ...activePlayer, id: `u-${Date.now()}` });
            db.currentAuction.status = 'UNSOLD';
        }
        tour.players = tour.players.filter(p => p.id !== activePlayer.id);
        io.emit('init_data', db);
        io.emit('auction_update', db.currentAuction);
        persist();
    });

    socket.on('toggle_pause', () => {
        db.currentAuction.isPaused = !db.currentAuction.isPaused;
        io.emit('auction_update', db.currentAuction);
    });

    socket.on('sync_tournament_data', (data) => {
        const tour = getTour();
        if (tour) {
            if (data.players) tour.players = data.players;
            if (data.teams) tour.teams = data.teams;
            io.emit('init_data', db);
            persist();
        }
    });

    socket.on('undo_bid', () => {
        if (db.currentAuction.bidHistory.length > 0) {
            const last = db.currentAuction.bidHistory.pop();
            db.currentAuction.currentBid = last.amount;
            db.currentAuction.currentBidderId = last.bidderId;
            db.currentAuction.timeLeft = 30;
            io.emit('auction_update', db.currentAuction);
        }
    });
});

server.listen(4000, () => console.log("🚀 Timer Engine Live"));