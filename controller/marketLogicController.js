const MarketLK = require('../models/marketLogicModel');
const User = require('../models/UserSignUp');  
const User_Wallet = require('../models/Wallet');

// Place a new bet
const placeBet = async (req, res) => {
  console.log(req.body);
  try {
    const { userId, label, odds, stake, teamAProfit, teamBProfit, balance, exposure, time, type, match } = req.body;
    if(balance<0){
      return res.status(400).json({ success: false, message: 'You are not able to place bet' });
    }else{
    // Validate all fields
    if (!userId || !label || !odds || !stake || !balance || !exposure || !time || !type || !match) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Parse numerical values
    const parsedOdds = parseFloat(odds);
    const parsedStake = parseFloat(stake);
    const parsedTeamAProfit = parseFloat(teamAProfit || 0);
    const parsedTeamBProfit = parseFloat(teamBProfit || 0);
    const parsedBalance = parseFloat(balance);
    const parsedExposure = parseFloat(exposure);

    // Validate numerical values
    if (isNaN(parsedOdds) || isNaN(parsedStake) || isNaN(parsedBalance) || isNaN(parsedExposure)) {
      return res.status(400).json({ success: false, message: 'Invalid numerical values provided.' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await MarketLK.updateMany(
      { user: userId, match, current_status: "Pending" },
      { $set: { current_status: "Complete" } }
    );

    // Create and save the bet
    const newBet = new MarketLK({
      user: userId,
      label,
      odds: parsedOdds,
      stake: parsedStake,
      teamAProfit: parsedTeamAProfit,
      teamBProfit: parsedTeamBProfit,
      balance: parsedBalance,
      exposure: parsedExposure,
      time,
      type,
      match
    });
    await newBet.save();

    const wallet = await User_Wallet.findOne({ user: userId });
    
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found.' });
    }

    wallet.exposureBalance = parsedExposure;
    wallet.balance = parsedBalance;
    wallet.teamAProfit = parsedTeamAProfit;
    wallet.teamBProfit = parsedTeamBProfit;
    
    await wallet.save();
    res.status(201).json({ success: true, message: 'Bet placed successfully!', bet: newBet });
  }
  } catch (error) {
    console.error('Error placing bet:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const updateResult = async (req, res) => {
  try {
      const { matchName, result } = req.body;

      // Fetch Market Odds Data
      const marketOddsData = await MarketLK.find({ label: matchName });

      // Dictionary to track user wallet updates
      const userWalletUpdates = {};

      for (const bet of marketOddsData) {
          bet.current_status = result;
          await bet.save(); // Save updated bet

          // Fetch user's wallet
          const userId = bet.user.toString();
          if (!userWalletUpdates[userId]) {
              userWalletUpdates[userId] = await User_Wallet.findOne({ user: userId });
          }

          const userWallet = userWalletUpdates[userId];
          if (!userWallet) continue; // Skip if wallet not found
          // userWallet.balance += Math.abs(bet.exposure) + bet.profitA;

          // Update exposure and balance based on bet result
          if (result === "Winner" || result === "Draw") {
              userWallet.balance += Math.abs(bet.exposure) + Math.abs(bet.profitA);
          } else {
              userWallet.exposure = 0; // Reset exposure if lost
          }
      }

      // Save updated wallets
      for (const userId in userWalletUpdates) {
          await userWalletUpdates[userId].save();
      }

      res.status(200).json({ success: true, message: "Results and wallet updated successfully" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const resetAllData = async (req, res) => {
  try {
    // Fetch all bets
    const allBets = await MarketLK.find();

    // Dictionary to track user wallet updates
    const userWalletUpdates = new Map();

    for (let bet of allBets) {
        const userId = bet.user.toString();

        // Fetch user's wallet only if not already cached
        if (!userWalletUpdates.has(userId)) {
            const userWallet = await User_Wallet.findOne({ user: userId });
            if (userWallet) userWalletUpdates.set(userId, userWallet);
        }

        const userWallet = userWalletUpdates.get(userId);
        if (!userWallet) continue; // Skip if wallet not found

        // Add exposure amount back to balance
        userWallet.balance += Math.abs(bet.exposure);

        // Reset exposure to 0
        bet.exposure = 0;
        await bet.save(); // Save the updated bet
    }

    // Save all updated wallets
    for (const wallet of userWalletUpdates.values()) {
        await wallet.save();
    }

    res.status(200).json({ success: true, message: "All data has been reset, exposure added back to balances" });

  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};





// Get bets by user
const getUserBets = async (req, res) => {
  try {
    const { userId } = req.params;
    const bets = await MarketLK.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, bets });
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getwalletandexposure = async (req, res) => {
  const { userId } = req.params;

  try {
    const wallet = await User_Wallet.findOne({ user: userId }); 

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.status(200).json({
      balance: wallet.balance || 0,
      exposureBalance: wallet.exposureBalance || 0,
      teamAProfit: wallet.teamAProfit || 0,
      teamBProfit: wallet.teamBProfit || 0
    });
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



const getUniqueMatchesAndLabels = async (req, res) => {
  try {
    const uniqueData = await MarketLK.aggregate([
      {
        $group: {
          _id: "$match",
          match: { $first: "$match" },
          status: { $first: "$status" },
          teams: { $addToSet: "$label" }
        }
      }
    ]);

    res.status(200).json(uniqueData);
  } catch (error) {
    console.error('Error fetching unique matches and labels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const ResultDeclaration = require('../models/resultDeclartion');
const submitNewDeclaration = async (req, res) => {
  const { match, winner ,resultType } = req.body;
  try {

    const bets = await MarketLK.find({ match, current_status: "Pending" });

    if (!bets.length) {
      return res.status(404).json({ message: "No pending bets found for this match." });
    }

    for (const bet of bets) {
      const userWallet = await User_Wallet.findOne({ user: bet.user });

      if (!userWallet) {
        console.error(`Wallet not found for user: ${bet.user}`);
        continue;
      }

      // Check conditions and update wallet
      if ((bet.match === match && bet.label === winner &&resultType=="win")) {
        // User wins
        if(bet.teamAProfit>0){
          userWallet.balance +=Number(bet.teamAProfit)+Number(userWallet.exposureBalance);
          userWallet.exposureBalance=0;
        }else{
          userWallet.exposureBalance=0;
        }
        // userWallet.balance += bet.teamAProfit;
      } else if((bet.match === match && bet.label === winner &&resultType=="loss")){
       // User wins
       if(bet.teamBProfit>0){
        userWallet.balance +=Number(bet.teamBProfit)+Number(userWallet.exposureBalance);
        userWallet.exposureBalance=0;
      }else{
        userWallet.exposureBalance=0;
      }
      }

      // Adjust exposure and mark bet as completed
     
      bet.current_status = "Complete";

      await userWallet.save();
      await bet.save();
    }

    
    console.log('Received payload:', req.body);

    const newDeclaration = new ResultDeclaration(req.body);
    await newDeclaration.save();

    res.status(200).json({ message: 'Declaration saved successfully' });
  } catch (error) {
    console.error('Error saving declaration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};






const fatchrecentresultdeclation = async (req, res) => {
  try {
    const declarations = await ResultDeclaration.find({});
    res.status(200).json(declarations);
  } catch (error) {
    console.error('Error fetching declarations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { placeBet, getUserBets ,getwalletandexposure,getUniqueMatchesAndLabels, submitNewDeclaration,fatchrecentresultdeclation, updateResult, resetAllData};
