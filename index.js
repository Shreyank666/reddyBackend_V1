const JWT_SECRET = 'bunneybet';
const express = require('express');
const app = express();
const cors = require('cors');
const User = require('./models/UserSignUp');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User_Wallet = require('./models/Wallet.js');
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
const playerRouter = require("./Routes/cricket/playerRoutes");
dotenv.config();
const axios = require('axios');
const cricketMarketRoutes = require('./Routes/cricketMarketRoutes');
const cheerio = require('cheerio');
const moment = require('moment'); // For Node.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ 
  stdTTL: 2, // Cache for 2 seconds
  checkperiod: 1, // Check expired keys every 1 second
  useClones: false // Don't clone data (faster)
});

// Token management setup
const AUTH_TOKENS = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZW1iZXJDb2RlIjoiQzEwMTAxMDJNMDkiLCJ0b2tlbklkIjoiMjA4MTlhYTJhYTY3NWI1NjI0ZGNiYmViMzQ1ODRkYzYyOTVkODJiM2EwYjAxZmRmNDJhN2FiMWY3ODJiYjQ0MSIsImxvZ2luQ291bnRyeSI6IklOIiwic2Vzc2lvbklkIjoiYmUyMTM4Zjk0MjQ5OWU2NDg2MjkwYTgyYmY3OTUzZDRiZWJlMTQ4NjU4NDU3N2ViMWI5ODhmZTI1NDRkNmY5NCIsImFsbG93U2hha3RpUHJvIjpmYWxzZSwibGFzdExvZ2luVGltZSI6MTc0MzA2ODcyMjU1OCwibmJmIjoxNzQzMDY4NzI3LCJsb2dpbk5hbWUiOiJkaXMuZGVtb2Q4IiwibG9naW5JUCI6IjE1Mi41OC4yNDQuMjQ2IiwidGhlbWUiOiJsb3R1cyIsImV4cCI6MTc0MzQxNDMyNywiaWF0IjoxNzQzMDY4NzI3LCJtZW1iZXJJZCI6NTEzNzEwLCJ1cGxpbmVzIjp7IkNPWSI6eyJ1c2VySWQiOjEsInVzZXJDb2RlIjoiYWRtaW4udXNlciJ9LCJTTUEiOnsidXNlcklkIjo1MTMyOTcsInVzZXJDb2RlIjoiQzEwMSJ9LCJNQSI6eyJ1c2VySWQiOjUxMzY5MSwidXNlckNvZGUiOiJDMTAxMDEifSwiQWdlbnQiOnsidXNlcklkIjo1MTM2OTQsInVzZXJDb2RlIjoiQzEwMTAxMDIifX0sImN1cnJlbmN5IjoiSU5SIiwiaXNEZW1vIjp0cnVlLCJtYSI6bnVsbCwiYiI6bnVsbCxzOm51bGwsYzpudWxsfQ.GtHiTkROKQb9xgn3BGiZ7bLbY0bATzov-dWV2jfP64Q',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZW1iZXJDb2RlIjoiSTRfLTAxMDFNNFAiLCJ0b2tlbklkIjoiYjg1M2FkMTAyODE4YTk5N2M1YWZhMjBlOTZjNWQ3NzBiMzQwMDg1YWNlMTQ2ZThjNzdmYmI3ZGU5OGUxYWI0NCIsImxvZ2luQ291bnRyeSI6IklOIiwic2Vzc2lvbklkIjoiNWU0ZTM0MWY5ZmZlYWQzMzIwMWI3OTJiMThiNDkxOTE3MzdmYTZkOWNkNWFhNjA0MGFkOGZjODA2NjQ5NmE2YyIsImFsbG93U2hha3RpUHJvIjpmYWxzZSwibGFzdExvZ2luVGltZSI6MTc0MjgzNTk1NTAxNSwibmJmIjoxNzQyODQyNDYwLCJsb2dpbk5hbWUiOiJkaXMubWFoZXNoODUyIiwibG9naW5JUCI6IjE1Mi41OC4xOTIuNCIsInRoZW1lIjoibG90dXMiLCJleHAiOjE3NDMxODgwNjAsImlhdCI6MTc0Mjg0MjQ2MCwibWVtYmVySWQiOjkwODUzMDIsInVwbGluZXMiOnsiQ09ZIjp7InVzZXJJZCI6MSwidXNlckNvZGUiOiJhZG1pbi51c2VyIn0sIlNNQSI6eyJ1c2VySWQiOjAsInVzZXJDb2RlIjpudWxsfSwiTUEiOnsidXNlcklkIjo2NTcxOTUsInVzZXJDb2RlIjoiSTRfLTAxIn0sIkFnZW50Ijp7InVzZXJJZCI6NjU3MjAxLCJ1c2VyQ29kZSI6Ikk0Xy0wMTAxIn19LCJjdXJyZW5jeSI6IklOUiIsImlzRGVtbyI6ZmFsc2UsIm1hIjpudWxsLCJiIjpudWxsLCJzIjpudWxsLCJjIjpudWxsfQ.oAEhUVj0-t3kVTG4ggOj4Dueg02wd-kKxx5Z2_joYhU',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZW1iZXJDb2RlIjoiSTRfLTAxMDFNNE4iLCJ0b2tlbklkIjoiMzgwM2U0NjlkMjhkMTcxMjMyZDgwMTE1YmUwZjU2YmExMzAwN2Y2ZmM4NjVlZjcxN2M0YWE3MjhkNWE5YjRlOSIsImxvZ2luQ291bnRyeSI6IklOIiwic2Vzc2lvbklkIjoiZWVkMmQ2YzBlODdhMmFmNjE0MmU1NmZkYTQzNmNkMWE4NzhjZjU3MGQ2MzhmNWMwNGFhODg4ZmU5YWMxZDY5OCIsImFsbG93U2hha3RpUHJvIjpmYWxzZSwibGFzdExvZ2luVGltZSI6MTc0Mjg0NDU2NjkyOSwibmJmIjoxNzQyODQ0NTczLCJsb2dpbk5hbWUiOiJkaXMuaGFyaXNoNDYiLCJsb2dpbklQIjoiMTUyLjU4LjE5Mi40IiwidGhlbWUiOiJsb3R1cyIsImV4cCI6MTc0MzE5MDE3MywiaWF0IjoxNzQyODQ0NTczLCJtZW1iZXJJZCI6OTA4NDc2NiwidXBsaW5lcyI6eyJDT1kiOnsidXNlcklkIjoxLCJ1c2VyQ29kZSI6ImFkbWluLnVzZXIifSwiU01BIjp7InVzZXJJZCI6MCwidXNlckNvZGUiOjEsInVzZXJDb2RlIjoiQzEwMSJ9LCJNQSI6eyJ1c2VySWQiOjY1NzE5NSwidXNlckNvZGUiOiJJNF8tMDEifSwiQWdlbnQiOnsidXNlcklkIjo2NTcyMDEsInVzZXJDb2RlIjoiSTRfLTAxMDEifX0sImN1cnJlbmN5IjoiSU5SIiwiaXNEZW1vIjpmYWxzZSwibWEiOm51bGwsImIiOm51bGwsInMiOm51bGwsImMiOm51bGx9.au7E_2eWXM68d-4OPLpBUj5XLebGeBT7DxjyVCwbphw'
];

const USER_CREDENTIALS = [
  { username: 'harish46', password: 'GK@789xe' },
  { username: 'mahesh852', password: 'PK@672km' },
  { username: 'ganesh658', password: 'FX@772cw' }
];

// Token manager class
class TokenManager {
  constructor(initialTokens, credentials) {
    this.tokens = [...initialTokens];
    this.credentials = credentials;
    this.currentIndex = 0;
    this.renewalAttempts = {};
    this.lastRenewalTime = Date.now();
    this.initialRenewal();
  }
  
  async renewToken(credentials) {
    try {
      console.log(`🔑 Attempting to renew token for ${credentials.username} via direct API call...`);
      
      try {
        const response = await axios.post('https://gobook9.com/api/auth/b2b/login', {
          username: credentials.username,
          password: credentials.password
        }, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0',
            'Accept': 'application/json, text/plain, /',
            'Origin': 'https://gobook9.com',
            'Referer': 'https://gobook9.com/login'
          }
        });
        
        const authToken = response.headers['authorization'];
        
        if (authToken) {
          console.log(`✅ Successfully obtained token from response headers for ${credentials.username}: ${authToken.substring(0, 30)}...`);
          return authToken;
        } else {
          console.error(`❌ No authorization header found in response for ${credentials.username}`);
          if (response.data && response.data.result && response.data.result.token) {
            console.log(`✅ Successfully obtained token from response body for ${credentials.username}: ${response.data.result.token.substring(0, 30)}...`);
            return response.data.result.token;
          }
          return null;
        }
      } catch (error) {
        console.error(`❌ API call error for ${credentials.username}:`, error.message);
        if (error.response) {
          console.error(`Status: ${error.response.status}`);
          console.error(`Headers:`, JSON.stringify(error.response.headers, null, 2));
          console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
        }
        return null;
      }
    } catch (error) {
      console.error(`❌ Error in renewToken for ${credentials.username}:`, error.message);
      return null;
    }
  }
  
  getToken() {
    const token = this.tokens[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.tokens.length;
    if (this.currentIndex % 10 === 0) {
      this.checkRenewalNeeded();
    }
    return token;
  }
  
  checkRenewalNeeded() {
    const now = Date.now();
    const hoursSinceLastRenewal = (now - this.lastRenewalTime) / (1000 * 60 * 60);
    if (hoursSinceLastRenewal > 1) {
      console.log(`⏰ It's been ${hoursSinceLastRenewal.toFixed(1)} hours since last renewal. Starting renewal...`);
      this.renewAllTokens();
    }
  }
  
  async initialRenewal() {
    console.log('🚀 Performing initial token renewal...');
    await this.renewAllTokens();
    this.scheduleTokenRenewals();
  }
  
  replaceToken(index, newToken) {
    if (newToken) {
      this.tokens[index] = newToken;
      console.log(`🔄 Token at index ${index} replaced`);
      this.lastRenewalTime = Date.now();
    }
  }
  
  scheduleTokenRenewals() {
    setInterval(() => {
      this.renewAllTokens();
    }, 4 * 60 * 60 * 1000);
  }
  
  async renewAllTokens() {
    console.log('🔄 Starting token renewal process...');
    let renewedAny = false;
    
    for (let i = 0; i < this.credentials.length; i++) {
      let newToken = await this.renewToken(this.credentials[i]);
      if (newToken) {
        this.replaceToken(i, newToken);
        this.renewalAttempts[i] = 0;
        renewedAny = true;
      } else {
        console.log(`⚠ Failed to renew token for ${this.credentials[i].username}, will retry later`);
      }
    }
    
    if (!renewedAny) {
      console.log(`⚠ Could not renew any tokens. Will try again after delay.`);
      setTimeout(() => {
        console.log(`🔄 Retrying token renewal after delay...`);
        this.renewAllTokens();
      }, 5 * 60 * 1000);
    } else {
      console.log(`✅ Token renewal process completed with some success`);
      this.lastRenewalTime = Date.now();
    }
  }
  
  async handleTokenError(tokenIndex) {
    if (!this.renewalAttempts[tokenIndex]) {
      this.renewalAttempts[tokenIndex] = 0;
    }
    
    this.renewalAttempts[tokenIndex]++;
    
    if (this.renewalAttempts[tokenIndex] <= 3) {
      console.log(`🔑 Token ${tokenIndex} seems expired. Attempting renewal (attempt ${this.renewalAttempts[tokenIndex]})...`);
      const newToken = await this.renewToken(this.credentials[tokenIndex]);
      if (newToken) {
        this.replaceToken(tokenIndex, newToken);
        this.renewalAttempts[tokenIndex] = 0;
        return true;
      }
    } else {
      console.log(`⚠ Max renewal attempts reached for token ${tokenIndex}`);
      setTimeout(() => {
        console.log(`🔄 Resetting renewal counter for token ${tokenIndex}`);
        this.renewalAttempts[tokenIndex] = 0;
      }, 30 * 60 * 1000);
    }
    return false;
  }
}

// Initialize token manager
const tokenManager = new TokenManager(AUTH_TOKENS, USER_CREDENTIALS);

// Data fetching function
const fetchData = async (url, retries = 3) => {
  const tokenIndex = tokenManager.currentIndex;
  const currentToken = tokenManager.getToken();
  
  const options = {
    method: 'GET',
    headers: {
      'Authorization': currentToken,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0',
      'Accept': 'application/json, text/plain, /',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Origin': 'https://gobook9.com',
      'Referer': 'https://gobook9.com/sports/4'
    },
    timeout: 8000
  };
  
  try {
    console.log(`🔄 Fetching data from: ${url} with token index: ${tokenIndex}`);
    const response = await axios(url, options);
    
    if (response.data && (response.data.error || response.data.message === 'Unauthorized')) {
      console.log(`⚠ API returned error: ${response.data.error || response.data.message}`);
      const renewed = await tokenManager.handleTokenError(tokenIndex);
      if (renewed && retries > 0) {
        console.log(`🔄 Retrying request with new token. Retries left: ${retries-1}`);
        return fetchData(url, retries - 1);
      }
    }
    
    return response.data;
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log(`⚠ Token error (${error.response.status}) detected. Attempting renewal...`);
      const renewed = await tokenManager.handleTokenError(tokenIndex);
      if (renewed && retries > 0) {
        console.log(`🔄 Retrying request with new token. Retries left: ${retries-1}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchData(url, retries - 1);
      }
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.log(`⚠ Request timeout: ${error.message}`);
      if (retries > 0) {
        console.log(`🔄 Retrying after timeout. Retries left: ${retries-1}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchData(url, retries - 1);
      }
    }
    
    console.error(`❌ Fetch error: ${error.message}`);
    throw error;
  }
};

// Market data transformation function
const transformMarketData = (market) => {
  if (market.mtype === 'MATCH_ODDS' || market.mtype === 'MATCH_ODDS_SB') {
    return {
      ...market,
      displayType: 'MATCH_ODDS',
      runners: market.runners.map(runner => ({
        ...runner,
        back: runner.back?.[0] || { price: 0, size: 0 },
        lay: runner.lay?.[0] || { price: 0, size: 0 }
      }))
    };
  }

  if (market.btype === 'LINE' || market.mtype === 'INNINGS_RUNS' || market.name.includes('Over') || market.name.includes('Lambi')) {
    return {
      ...market,
      displayType: 'FANCY',
      name: market.name,
      status: market.status,
      runners: [
        {
          no: {
            price: market.runners[0]?.back?.[0]?.price || 0,
            size: market.runners[0]?.back?.[0]?.size || 0
          },
          yes: {
            price: market.runners[0]?.lay?.[0]?.price || 0,
            size: market.runners[0]?.lay?.[0]?.size || 0
          }
        }
      ]
    };
  }

  if (market.name.toLowerCase().includes('toss')) {
    return {
      ...market,
      displayType: 'TOSS',
      runners: market.runners.map(runner => ({
        ...runner,
        back: runner.back?.[0] || { price: 0, size: 0 },
        lay: runner.lay?.[0] || { price: 0, size: 0 }
      }))
    };
  }

  return market;
};

app.use(express.json());
const betRoutes = require('./Routes/betRoutes');
const matkaRouter = require('./Routes/matkaRoutes.js');
const Matka = require('./models/matkaModel.js')
const papuRouter = require("./Routes/pappuRoutes.js")
const AddPointRouter = require("./controller/addPointsController")
const withdraw = require("./Routes/withdrwaRoter.js")
const crickbetRoutes = require("./Routes/crickbetRoutes.js")
const minesRouter = require('./Routes/minesRoute.js')
const bankDetailsRouter = require("./controller/bankDetails.js")
const http = require("http");
const matchRouter = require("./Routes/matchRouter.js")
const socketIo = require("socket.io");
const server = http.createServer(app);
const aarParParchiRouter = require('./Routes/aarPaarParchiRoutes.js');
const avaitorRouter = require("./Routes/avaitorRoutes.js")
const crashAvaitorRouter = require('./Routes/crashAvaitorRoutes.js')
const titliWinnerRouter = require("./Routes/titliWinnerRoutes.js")
const marketLogicRoutes = require('./Routes/marketLogicRoutes.js')
const sessionResultRoutes = require("./Routes/sessionResultRoutes.js")
const io = socketIo(server, {
//   cors: {
//     origin: "*",
//   },
// });

// port = 4000
// CORS configuration

app.use(
  cors({
    origin: ["https://www.annareddy.live"], // Replace '*' with the specific origin(s) you want to allow, e.g., 'https://yourdomain.com'
    methods: ['POST', 'GET', 'PUT', 'DELETE'], // Define allowed HTTP methods
    credentials: true, // Allow credentials like cookies to be sent
  })
);
// app.use(cors());

const MONGO_URI = process.env.mongodb_url;   
// MongoDB connection
mongoose.connect(`mongodb+srv://infusion:oxPmrqHhXOdsBLPk@cluster0.rnz0y.mongodb.net/laxhmibook?retryWrites=true&w=majority&appName=Cluster0`)
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch(err => console.error("MongoDB Connection Error:", err));

const marketMapping = {
    1: "SRIDEVI MORNING",
    10: "MILAN MORNING",
    13: "KALYAN MORNING",
    16: "SRIDEVI",
    22: "TIME BAZAR",
    25: "MADHUR DAY",
    31: "RAJDHANI DAY",
    34: "MILAN DAY",
    40: "KALYAN",
    46: "SRIDEVI NIGHT",
    58: "MILAN NIGHT",
    61: "KALYAN NIGHT",
    64: "RAJDHANI NIGHT",
    // 71: "abc",
  };
  
  const fetchMarketData = async () => {
    try {
      console.log('Fetching fresh market data...');
      const url = 'https://www.shrimatka.in';
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
  
      const markets = [];
  
      $('.clmn.clmn6.mblinbk.center').each((i, el) => {
        const marketNumber = i + 1;
        const marketName = marketMapping[marketNumber];
  
        if (!marketName) return; // Skip markets not in mapping
  
        const vCenterChildren = $(el).find('.v-center').children();
        const openNumber = vCenterChildren.eq(0)?.text().trim() || '*';
        const jodiDigit = vCenterChildren.eq(1)?.text().trim() || '*';
        const closeNumber = vCenterChildren.eq(2)?.text().trim() || '*';
  
        const openTime = $(el).find('.cmlo.font1 .clmn.clmn6.center.mblinbk span').first().text().trim();
        const closeTime = $(el).find('.cmlo.font1 .clmn.clmn6.center.mblinbk span').last().text().trim();
  
        if (!openTime || !closeTime || openTime === 'N/A' || closeTime === 'N/A') {
          return; // Skip markets without valid open/close times
        }
  
        const currentTime = moment();
        const openTimeMoment = moment(openTime, 'hh:mm a').subtract(5, 'hours').subtract(30, 'minutes');
        const closeTimeMoment = moment(closeTime, 'hh:mm a').subtract(5, 'hours').subtract(30, 'minutes');
        
        const isBeforeOpenTime = currentTime.isBefore(openTimeMoment);
        const isBeforeCloseTime = currentTime.isBefore(closeTimeMoment);
        
        let bidStatus;
        
        if (!isBeforeOpenTime && isBeforeCloseTime) {
          bidStatus = "Close";  // ✅ If open time has passed but close time has not
        } else if (!isBeforeOpenTime && !isBeforeCloseTime) {
          bidStatus = "Closed"; // ✅ If both open time and close time have passed
        } else if (isBeforeOpenTime && isBeforeCloseTime) {
          bidStatus = "Open | Close"; // ✅ If neither open time nor close time has passed
        }
        
        markets.push({
          marketNumber,
          marketName,
          openNumber,
          jodiDigit,
          closeNumber,
          openTime,
          closeTime,
          bidStatus
        });
      });
  
      const matkaData = await Matka.find();
    if (Array.isArray(matkaData)) {
      matkaData.forEach(data => {
        if (!Object.values(marketMapping).includes(data.marketName)) {
          return; // ✅ Skip if marketName is not in marketMapping
        }
  
        // ✅ Check if marketName already exists in `markets`
        const existingMarket = markets.find(m => m.marketName === data.marketName);
        if (!existingMarket) {
          const currentTime = moment();
          const openTimeMoment = moment(openTime, 'hh:mm a').subtract(5, 'hours').subtract(30, 'minutes');
          const closeTimeMoment = moment(closeTime, 'hh:mm a').subtract(5, 'hours').subtract(30, 'minutes');
          
          const isBeforeOpenTime = currentTime.isBefore(openTimeMoment);
          const isBeforeCloseTime = currentTime.isBefore(closeTimeMoment);
          
          let bidStatus;
          
          if (!isBeforeOpenTime && isBeforeCloseTime) {
            bidStatus = "Close";  // ✅ If open time has passed but close time has not
          } else if (!isBeforeOpenTime && !isBeforeCloseTime) {
            bidStatus = "Closed"; // ✅ If both open time and close time have passed
          } else if (isBeforeOpenTime && isBeforeCloseTime) {
            bidStatus = "Open | Close"; // ✅ If neither open time nor close time has passed
          }
          
          markets.push({
            marketName: data.marketName,
            openNumber: data.openNumber,
            jodiDigit: data.jodiDigit,
            closeNumber: data.closeNumber,
            openTime: data.openTime,
            closeTime: data.closeTime,
            bidStatus
          });
        }
      });
    } else {
      console.error("matkaData is not an array:", matkaData);
    }
      cache.set('marketData', markets);
      return markets;
  
    } catch (error) {
      console.error('Error fetching data:', error.message);
      return [];
    }
  };
  
  app.get('/api/subscription-state', async (req, res) => {
    let markets = cache.get('marketData');
  
    if (!markets) {
      markets = await fetchMarketData();
    }
  
    res.json({ markets });
  });
  
  setInterval(fetchMarketData, 60000);

app.get('/api/name/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find the user and wallet by ID
    const user = await User.findById(id);
    const wallet = await User_Wallet.findOne({ user: id });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Respond with username, wallet balance, exposure balance, and email
    res.json({ 
      username: user.username, 
      walletBalance: wallet.balance, 
      exposureBalance: wallet.exposureBalance || 0, 
      email: user.email,
      userNo: user.userNo 
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Sign Up Route
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // Ensure all fields are provided
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // let userNo;
    // let count = 5000;
    // do {
    //   userNo = `C${count}`;
    //   count++;
    // } while (await User.findOne({ userNo }));

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
 
    });

    const savedUser = await newUser.save();

    // Create a wallet for the new user
    const wallet = new User_Wallet({
      user: savedUser._id,
      balance: 0, // Set an initial wallet balance if desired
    });
    await wallet.save();

    // Link the wallet to the user
    savedUser.wallet = wallet._id;
    await savedUser.save();

    // Respond with success
    res.status(201).json({
      message: 'User registered successfully',
      user: { id: savedUser._id, username: savedUser.username, email: savedUser.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await User.findOne({ email }).populate('wallet');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        walletBalance: user.wallet?.balance || 0,
      
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;
  console.log(email, newPassword)
  // Check if email and new password are provided
  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.use('/api', aarParParchiRouter);
app.use("/", matkaRouter)
app.use("/", playerRouter)
app.use("/",crickbetRoutes)
app.use('/api', AddPointRouter);
app.use(betRoutes);
app.use("/api",papuRouter)
app.use('/api', bankDetailsRouter);
app.use('/api', withdraw);
app.use('/api', minesRouter)
app.use('/api', matchRouter);
app.use('/api', avaitorRouter);
app.use('/api', crashAvaitorRouter);
app.use('/api', titliWinnerRouter);
app.use("/api", marketLogicRoutes);
app.use("/", cricketMarketRoutes);
app.use("/", sessionResultRoutes);
let liveData = {
  matches: [],
  odds: {},
};

// Fetch ongoing matches every second
const fetchOngoingMatches = async () => {
  try {
    const response = await axios.post(
      "https://api.btx99.com/v1/sports/matchList",
      {},
      {
        headers: {
          Authorization: "Bearer YOUR_VALID_TOKEN_HERE", // Replace with a valid token
          Accept: "application/json",
          Origin: "https://btx99.com",
          Referer: "https://btx99.com/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0",
        },
      }
    );
    liveData.matches = response.data.data.map((match) => ({
      eventId: match.eventId,
      matchName: match.matchName,
      marketId: match.marketId,
      scoreIframe: match.scoreIframe,
    }));
    io.emit("updateMatches", liveData.matches);
  } catch (error) {
    console.error("Error fetching ongoing matches:", error.message);
  }
};

// Fetch odds for each market ID
const fetchOdds = async () => {
  try {
    const marketIds = liveData.matches.map((match) => match.marketId);
    if (marketIds.length === 0) return;

    for (const marketId of marketIds) {
      const response = await axios.get(
        `https://vigcache.crickexpo.in/v2/api/oddsDataNew?market_id=${marketId}`,
        {
          headers: {
            accept: 'application/json, text/plain, /',
            'accept-language': 'en-US,en;q=0.9,en-IN;q=0.8',
            origin: 'https://btx99.com',
            referer: 'https://btx99.com/',
            'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Microsoft Edge";v="134"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0',
          },
        }
      );

      if (response.data.result) {
        const matchData = liveData.matches.find(match => match.marketId === marketId);
        const matchName = matchData ? matchData.matchName : `Market ${marketId}`;
        liveData.odds[marketId] = {
          matchName,
          matchOdds: response.data.result.team_data || [],
          fancyMarkets: response.data.result.session || [],
          commissionFancy: response.data.result.commission_fancy_data || [],
          noCommissionFancy: response.data.result.no_commission_fancy_data || [],
        };
      }
    }
    io.emit("updateOdds", liveData.odds);
  } catch (error) {
    console.error("Error fetching odds:", error.message);
  }
};

// Run functions every second
setInterval(fetchOngoingMatches, 1000);
setInterval(fetchOdds, 1000);

// API Route: Fetch odds from backend cache
app.get("/api/odds", (req, res) => {
  const { market_id } = req.query;
  if (!market_id || !liveData.odds[market_id]) {
    return res.status(404).json({ error: "No odds available" });
  }
  res.json(liveData.odds[market_id]);
});

// WebSocket: Live Score & Odds Updates
io.on("connection", (socket) => {
  console.log("Client connected");
  socket.emit("updateMatches", liveData.matches);
  socket.emit("updateOdds", liveData.odds);
  socket.on("disconnect", () => console.log("Client disconnected"));
});

// ✅ Endpoint: Get Match List
app.get('/api/match-list', async (req, res) => {
  const cacheKey = 'match-list';
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log('✅ Serving match-list from cache');
    return res.json(cachedData);
  }

  try {
    // Ensure we have valid tokens before making the API call
    if (tokenManager.tokens.some(token => !token)) {
      console.log('⚠ Some tokens are missing, attempting renewal...');
      await tokenManager.renewAllTokens();
    }
    
    const data = await fetchData('https://gobook9.com/api/exchange/odds/eventType/4');
    
    if (!data || !data.result) {
      console.error('❌ Invalid data received from API:', data);
      return res.status(500).json({ error: 'Invalid data received from API' });
    }
    
    // Filter out any matches with tabGroupName "Premium Cricket"
    const filteredData = data.result.filter(match => match.tabGroupName !== 'Premium Cricket');
    
    const transformedData = filteredData.map(transformMarketData);

    cache.set(cacheKey, transformedData, 30); // Cache for 30 seconds
    console.log('✅ Serving match-list from API');
    res.json(transformedData);
  } catch (error) {
    console.error('❌ Error fetching match list:', error.message);
    
    // Clear cache on error to force fresh data on next request
    cache.del(cacheKey);
    
    // Try to renew tokens on error
    tokenManager.renewAllTokens().catch(e => console.error('❌ Token renewal failed:', e.message));
    
    res.status(500).json({ error: 'Failed to fetch match list', message: error.message });
  }
});

// ✅ Endpoint to Get Match Details by groupById
app.get('/api/match-details/:groupById', async (req, res) => {
  const { groupById } = req.params;
  const cacheKey = `match-details-${groupById}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`✅ Serving match-details for ${groupById} from cache`);
    return res.json(cachedData);
  }

  try {
    console.log(`🔎 Fetching details for groupById: ${groupById}`);
    
    // Ensure we have valid tokens before making API calls
    if (tokenManager.tokens.some(token => !token)) {
      console.log('⚠ Some tokens are missing, attempting renewal...');
      await tokenManager.renewAllTokens();
    }
    
    // First try to get match details with the d-sma-event API format
    try {
      const data = await fetchData(`https://gobook9.com/api/exchange/odds/d-sma-event/4/${groupById}`);
      
      if (data && data.result) {
        // Filter out markets with tabGroupName "Premium Cricket"
        const filteredMarkets = data.result.filter(market => market.tabGroupName !== 'Premium Cricket');
        
        cache.set(cacheKey, filteredMarkets, 2); // Cache for 2 seconds
        
        console.log(`✅ Serving ${filteredMarkets.length} markets for match ${groupById} using d-sma-event API`);
        return res.json(filteredMarkets);
      }
    } catch (specificError) {
      console.log(`⚠ d-sma-event API failed: ${specificError.message}. Trying alternative...`);
    }
    
    // Second attempt: Try the direct event API
    try {
      const data = await fetchData(`https://gobook9.com/api/exchange/odds/event/${groupById}`);
      
      if (data && data.result && data.result.length > 0) {
        // Filter out markets with tabGroupName "Premium Cricket"
        const filteredMarkets = data.result.filter(market => market.tabGroupName !== 'Premium Cricket');
        
        cache.set(cacheKey, filteredMarkets, 2); // Cache for 2 seconds
        
        console.log(`✅ Serving ${filteredMarkets.length} markets for match ${groupById} using event API`);
        return res.json(filteredMarkets);
      }
    } catch (secondError) {
      console.log(`⚠ Event API failed: ${secondError.message}. Trying fallback...`);
    }

    // Fallback: Get all matches and filter by groupById
    const allData = await fetchData('https://gobook9.com/api/exchange/odds/eventType/4');
    
    if (!allData || !allData.result) {
      return res.status(500).json({ error: 'Invalid data received from API' });
    }
    
    // Find the match with the matching groupById and filter Premium Cricket
    const matchDetails = allData.result
      .filter(match => String(match.groupById) === String(groupById))
      .filter(match => match.tabGroupName !== 'Premium Cricket');

    if (!matchDetails || matchDetails.length === 0) {
      console.log(`❌ No match found for groupById: ${groupById}`);
      return res.status(404).json({ error: 'Match not found' });
    }

    cache.set(cacheKey, matchDetails, 2); // Cache for 2 seconds
    console.log(`✅ Serving ${matchDetails.length} markets for match ${groupById} (via fallback)`);
    return res.json(matchDetails);
  } catch (error) {
    console.error(`❌ Error fetching match details:`, error.message);
    
    // Clear cache on error to force fresh data on next request
    cache.del(cacheKey);
    
    // Try to renew tokens on error
    tokenManager.renewAllTokens().catch(e => console.error('❌ Token renewal failed:', e.message));
    
    res.status(500).json({ error: 'Failed to fetch match details', message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
});
