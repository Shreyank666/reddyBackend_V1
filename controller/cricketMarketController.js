const Bet = require('../models/cricketMarketModel');
const User_Wallet = require('../models/Wallet');

// Create a new bet
exports.createBet = async (req, res) => {
    try {
        console.log("viaisali bala",req.body);

        const { myBets } = req.body;
        const betsToSave = [];  
        for (const betData of myBets) {
            const {
                userId,
                label: matbet,
                type: mode,
                odds,
                rate,
                stake,
                teamAProfit: profitA,
                teamBProfit: profitB,
                balance: balance,
                exposure,
                currentExposure,
                
            } = betData;
            parsedExposure = parseFloat(currentExposure)
            // Update User Wallet
            const userWallet = await User_Wallet.findOne({ user: userId });

            if (userWallet) {
                userWallet.balance = balance;
                userWallet.exposureBalance +=parsedExposure;
                await userWallet.save();
            }
            console.log(userWallet);

            // Create Bet Entry
            const bet = new Bet({
                userId,
                matbet,
                mode,
                odds,
                rate,
                stake,
                profitA,
                profitB,
                balance,
                exposure
            });

            betsToSave.push(bet);
        }

        // Save all bets in one go
        const savedBets = await Bet.insertMany(betsToSave);

        res.status(201).json(savedBets);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};



// Get all bets
exports.getAllBets = async (req, res) => {
    try {
        const bets = await Bet.find();
        res.json(bets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get bets by userId
exports.getBetsByUser = async (req, res) => {
    try {
        console.log(req.params.userId);
        const bets = await Bet.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(bets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getBetsByMatch = async (req, res) => {
    try {
        // console.log(req.params.userId);
        const bets = await Bet.find({ matbet: req.params.matbet }).sort({ createdAt: -1 });
        res.json(bets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete bet by ID
exports.deleteBet = async (req, res) => {
    try {
        await Bet.findByIdAndDelete(req.params.id);
        res.json({ message: 'Bet deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.resetAllBet = async (req, res) => {
    try {
        await Bet.deleteMany({});
        res.json({ message: 'All bets deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
