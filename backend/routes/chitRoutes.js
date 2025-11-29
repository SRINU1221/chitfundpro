const express = require('express');
const router = express.Router();
const {
    createChit,
    getChits,
    getChit,
    joinChit,
    updateMemberStatus,
    startChit,
    updateChit,
    deleteChit,
    removeMember,
    advanceToNextMonth,
} = require('../controllers/chitController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, getChits).post(protect, createChit);
router.route('/:id').get(protect, getChit).put(protect, updateChit).delete(protect, deleteChit);
router.route('/:id/join').post(protect, joinChit);
router.route('/:id/members/:userId').put(protect, updateMemberStatus).delete(protect, removeMember);
router.route('/:id/start').put(protect, startChit);
router.route('/:id/advance-month').post(protect, advanceToNextMonth);

module.exports = router;
