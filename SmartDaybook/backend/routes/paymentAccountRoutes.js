const express = require('express');
const router = express.Router();
const {
    getPaymentAccounts,
    createPaymentAccount,
    updatePaymentAccount,
    deletePaymentAccount,
    setDefaultAccount
} = require('../controllers/paymentAccountController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getPaymentAccounts)
    .post(protect, createPaymentAccount);

router.route('/:id')
    .put(protect, updatePaymentAccount)
    .delete(protect, deletePaymentAccount);

router.put('/:id/set-default', protect, setDefaultAccount);

module.exports = router;
