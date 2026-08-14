const db = require('../config/db');

// @desc    Get all hospital follow-up records & summary for logged-in user
// @route   GET /api/hospital/follow-ups
exports.getFollowUps = async (req, res) => {
    try {
        const userId = req.user.id;

        const [records] = await db.query(
            `SELECT h.*, 
                    pa.account_name, pa.account_type, pa.bank_name as account_bank_name, pa.upi_id as account_upi_id
             FROM hospital_followups h
             LEFT JOIN payment_accounts pa ON h.payment_account_id = pa.id
             WHERE h.user_id = ?
             ORDER BY h.next_visit_date ASC, h.visit_date DESC, h.id DESC`,
            [userId]
        );

        const todayStr = new Date().toISOString().split('T')[0];

        let upcomingCount = 0;
        let totalInsuranceApproved = 0;
        let totalBillAmount = 0;
        const patientsSet = new Set();
        const hospitalsSet = new Set();
        const doctorsSet = new Set();

        records.forEach(r => {
            if (r.patient_name) patientsSet.add(r.patient_name.trim());
            if (r.hospital_name) hospitalsSet.add(r.hospital_name.trim());
            if (r.doctor_name) doctorsSet.add(r.doctor_name.trim());

            if (r.next_visit_date) {
                const nextStr = new Date(r.next_visit_date).toISOString().split('T')[0];
                if (nextStr >= todayStr) upcomingCount++;
            }

            totalInsuranceApproved += Number(r.insurance_approved_amount || 0);
            totalBillAmount += Number(r.total_bill_amount || 0);
        });

        res.json({
            success: true,
            summary: {
                total_count: records.length,
                upcoming_count: upcomingCount,
                total_bill_amount: totalBillAmount,
                total_insurance_approved: totalInsuranceApproved,
                patient_count: patientsSet.size
            },
            patients: Array.from(patientsSet).sort(),
            hospitals: Array.from(hospitalsSet).sort(),
            doctors: Array.from(doctorsSet).sort(),
            data: records
        });
    } catch (error) {
        console.error('Error fetching hospital follow-ups:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Create a new hospital follow-up record
// @route   POST /api/hospital/follow-ups
exports.createFollowUp = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            patient_name,
            visit_date,
            hospital_name,
            doctor_name,
            next_visit_date,
            total_bill_amount,
            payment_mode,
            payment_account_id,
            self_pay_amount,
            payment_method,
            remarks,
            insurance_company,
            insurance_approved_amount,
            lab_result_file,
            prescription_file
        } = req.body;

        if (!patient_name || !visit_date || !hospital_name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide patient_name, visit_date, and hospital_name.'
            });
        }

        const [result] = await db.query(
            `INSERT INTO hospital_followups 
                (user_id, patient_name, visit_date, hospital_name, doctor_name, next_visit_date, total_bill_amount, payment_mode, payment_account_id, self_pay_amount, payment_method, remarks, insurance_company, insurance_approved_amount, lab_result_file, prescription_file)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                patient_name.trim(),
                visit_date,
                hospital_name.trim(),
                doctor_name ? doctor_name.trim() : null,
                next_visit_date || null,
                Number(total_bill_amount || 0),
                payment_mode || 'self_pay',
                payment_account_id ? Number(payment_account_id) : null,
                Number(self_pay_amount || 0),
                payment_method || null,
                remarks ? remarks.trim() : null,
                insurance_company ? insurance_company.trim() : null,
                Number(insurance_approved_amount || 0),
                lab_result_file || null,
                prescription_file || null
            ]
        );

        res.status(201).json({
            success: true,
            id: result.insertId,
            message: 'Follow-up record created successfully'
        });
    } catch (error) {
        console.error('Error creating hospital follow-up:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update a hospital follow-up record
// @route   PUT /api/hospital/follow-ups/:id
exports.updateFollowUp = async (req, res) => {
    try {
        const userId = req.user.id;
        const recordId = req.params.id;
        const {
            patient_name,
            visit_date,
            hospital_name,
            doctor_name,
            next_visit_date,
            total_bill_amount,
            payment_mode,
            payment_account_id,
            self_pay_amount,
            payment_method,
            remarks,
            insurance_company,
            insurance_approved_amount,
            lab_result_file,
            prescription_file
        } = req.body;

        const [existing] = await db.query(
            'SELECT * FROM hospital_followups WHERE id = ? AND user_id = ?',
            [recordId, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Record not found or unauthorized' });
        }

        await db.query(
            `UPDATE hospital_followups
             SET patient_name = ?, visit_date = ?, hospital_name = ?, doctor_name = ?, next_visit_date = ?, 
                 total_bill_amount = ?, payment_mode = ?, payment_account_id = ?, self_pay_amount = ?, payment_method = ?,
                 remarks = ?, insurance_company = ?, insurance_approved_amount = ?, lab_result_file = ?, prescription_file = ?
             WHERE id = ? AND user_id = ?`,
            [
                patient_name.trim(),
                visit_date,
                hospital_name.trim(),
                doctor_name ? doctor_name.trim() : null,
                next_visit_date || null,
                Number(total_bill_amount || 0),
                payment_mode || 'self_pay',
                payment_account_id ? Number(payment_account_id) : null,
                Number(self_pay_amount || 0),
                payment_method || null,
                remarks ? remarks.trim() : null,
                insurance_company ? insurance_company.trim() : null,
                Number(insurance_approved_amount || 0),
                lab_result_file !== undefined ? lab_result_file : existing[0].lab_result_file,
                prescription_file !== undefined ? prescription_file : existing[0].prescription_file,
                recordId,
                userId
            ]
        );

        res.json({ success: true, message: 'Follow-up record updated successfully' });
    } catch (error) {
        console.error('Error updating hospital follow-up:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a hospital follow-up record
// @route   DELETE /api/hospital/follow-ups/:id
exports.deleteFollowUp = async (req, res) => {
    try {
        const userId = req.user.id;
        const recordId = req.params.id;

        const [result] = await db.query(
            'DELETE FROM hospital_followups WHERE id = ? AND user_id = ?',
            [recordId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Record not found or unauthorized' });
        }

        res.json({ success: true, message: 'Follow-up record deleted successfully' });
    } catch (error) {
        console.error('Error deleting hospital follow-up:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
