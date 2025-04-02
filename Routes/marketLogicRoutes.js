const express = require('express');

const { placeBet, getUserBets , getwalletandexposure,getUniqueMatchesAndLabels,submitNewDeclaration,fatchrecentresultdeclation, updateResult, resetAllData} = require('../controller/marketLogicController');
const router = express.Router();


router.post('/laggai_khai_bets', placeBet);
router.get('/laggai_khai_getuserbet/:userId', getUserBets);
router.get('/getwalletandexposure/:userId', getwalletandexposure);
router.get('/admin/unique-matches-labels', getUniqueMatchesAndLabels);
router.post('/admin/new-declaration', submitNewDeclaration);
router.get('/admin/fatchrecentresultdeclation', fatchrecentresultdeclation);
router.post('/admin/matchodds/resultdeclaration', updateResult);
router.post('/admin/matchodds/resetAllData', resetAllData);
module.exports = router;
