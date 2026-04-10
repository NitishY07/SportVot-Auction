const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e8 // Allow large CSV file uploads (100MB)
});

// 1. Database Configuration
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auction_pro";
const AuctionSchema = new mongoose.Schema({ state: Object });
const AuctionModel = mongoose.model('AuctionState', AuctionSchema);

let db = {
    tournaments: [],
    activeTournamentId: null,
    currentAuction: { activePlayer: null, bidHistory: [], currentBid: 0, currentBidderId: null, status: 'IDLE' }
};

// 2. Connect to MongoDB with Error Handling
mongoose.connect(MONGODB_URI, { 
    serverSelectionTimeoutMS: 5000 // Don't wait forever
})
.then(async () => {
    console.log("📦 MongoDB Connected Successfully");
    const saved = await AuctionModel.findOne();
    if (saved) db = saved.state;
})
.catch(err => {
    console.log("⚠️ MongoDB Not Running. Server will run in 'Memory Only' mode (Data won't save permanently).");
});

// 3. Background Save (Optimized to NOT crash the server)
const safeSave = async () => {
    if (mongoose.connection.readyState !== 1) return; // Only save if DB is connected
    try {
        await AuctionModel.findOneAndUpdate({}, { state: db }, { upsert: true });
    } catch (e) {
        console.error("💾 Database Save Failed (Server still running):", e.message);
    }
};

const getTour = () => db.tournaments.find(t => t.id === db.activeTournamentId) || db.tournaments[db.tournaments.length - 1];

// 4. Real-time Events
io.on('connection', (socket) => {
    socket.emit('init_data', db);

    socket.on('create_tournament', (data) => {
        const id = `tour-${Date.now()}`;
        db.tournaments.push({ 
            id, 
            name: data.name, 
            budget: data.budget, 
            teams: [], 
            players: [], 
            soldPlayers: [], 
            unsoldPlayers: [] 
        });
        db.activeTournamentId = id;
        io.emit('init_data', db);
        safeSave();
    });

    socket.on('sync_tournament_data', (data) => {
        const tour = getTour();
        if (!tour) return;
        
        console.log(`📥 Syncing ${data.players?.length || 0} players...`);
        if (data.players) tour.players = data.players;
        if (data.teams) tour.teams = data.teams;
        
        io.emit('init_data', db);
        safeSave();
    });

    socket.on('start_player', (playerId) => {
        const tour = getTour();
        const player = tour?.players.find(p => p.id === playerId);
        if(!player) return;
        db.currentAuction = { activePlayer: player, bidHistory: [], currentBid: player.basePrice, currentBidderId: null, status: 'BIDDING' };
        io.emit('auction_update', db.currentAuction);
    });

    socket.on('place_bid', ({ teamId, amount }) => {
        db.currentAuction.bidHistory.push({ bidderId: db.currentAuction.currentBidderId, amount: db.currentAuction.currentBid });
        db.currentAuction.currentBid = amount;
        db.currentAuction.currentBidderId = teamId;
        io.emit('auction_update', db.currentAuction);
        io.emit('trigger_anim', 'bid_pulse');
    });

    socket.on('finalize_sold', () => {
        const tour = getTour();
        const { activePlayer, currentBid, currentBidderId } = db.currentAuction;
        if (!activePlayer || !tour) return;

        if (!currentBidderId) {
            tour.unsoldPlayers.push({ ...activePlayer, id: `u-${Date.now()}` });
            db.currentAuction.status = 'UNSOLD';
        } else {
            tour.soldPlayers.push({ ...activePlayer, id: `s-${Date.now()}`, soldPrice: currentBid, teamId: currentBidderId });
            const tIdx = tour.teams.findIndex(t => t.id === currentBidderId);
            if (tIdx > -1) tour.teams[tIdx].purse -= currentBid;
            db.currentAuction.status = 'SOLD';
        }
        tour.players = tour.players.filter(p => p.id !== activePlayer.id);
        
        io.emit('init_data', db);
        io.emit('auction_update', db.currentAuction);
        safeSave();
    });

    socket.on('undo_bid', () => {
        if (db.currentAuction.bidHistory.length > 0) {
            const last = db.currentAuction.bidHistory.pop();
            db.currentAuction.currentBid = last.amount;
            db.currentAuction.currentBidderId = last.bidderId;
            io.emit('auction_update', db.currentAuction);
        }
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`✅ FAST SERVER READY ON PORT ${PORT}`));