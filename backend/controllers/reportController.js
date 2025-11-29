const PDFDocument = require('pdfkit');
const asyncHandler = require('express-async-handler');
const Chit = require('../models/Chit');
const Transaction = require('../models/Transaction');

// @desc    Generate monthly report PDF
// @route   GET /api/reports/chit/:chitId/month/:month/pdf
// @access  Private (Organizer only)
const generateMonthlyReport = asyncHandler(async (req, res) => {
    const { chitId, month } = req.params;

    const chit = await Chit.findById(chitId)
        .populate('organizer', 'name email')
        .populate('members.user', 'name email')
        .populate('lifts.member', 'name email');

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Check if user is organizer
    if (chit.organizer._id.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized - Only organizer can generate reports');
    }

    const monthNum = parseInt(month);
    if (monthNum < 1 || monthNum > chit.totalMonths) {
        res.status(400);
        throw new Error('Invalid month number');
    }

    // Get transactions for this month
    const transactions = await Transaction.find({
        chit: chitId,
        month: monthNum,
        type: 'payment',
        status: 'completed'
    }).populate('user', 'name email');

    // Get lift record for this month
    const liftRecord = chit.lifts.find(lr => lr.month === monthNum);

    // Calculate payment statistics
    const onlinePayments = transactions.filter(t => !t.paymentMode || t.paymentMode === 'online');
    const cashPayments = transactions.filter(t => t.paymentMode === 'cash');
    const totalOnline = onlinePayments.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalCash = cashPayments.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalCollected = totalOnline + totalCash;

    // Calculate monthly details
    const previousLiftersCount = monthNum - 1;
    const extraChargePerMonth = chit.extraChargePerMonth || 0;
    const totalPool = (chit.monthlyContribution * chit.totalMembers) + (previousLiftersCount * extraChargePerMonth);
    const commission = chit.commission || 0;
    const lifterPayout = totalPool - commission;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Handle errors in PDF stream
    doc.on('error', (err) => {
        console.error('PDF Generation Error:', err);
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${chit.name.replace(/\s+/g, '_')}_Month_${monthNum}_Report.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    try {
        // Add content
        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('CHIT FUND MONTHLY REPORT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text('='.repeat(80), { align: 'center' });
        doc.moveDown(2);

        // Chit Information
        doc.fontSize(12).font('Helvetica-Bold').text('CHIT INFORMATION');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Chit Name: ${chit.name}`);
        doc.text(`Month: ${monthNum} of ${chit.totalMonths}`);
        doc.text(`Report Generated: ${new Date().toLocaleDateString()}`);

        const organizerName = chit.organizer ? chit.organizer.name : 'Unknown';
        const organizerEmail = chit.organizer ? chit.organizer.email : 'Unknown';
        doc.text(`Organizer: ${organizerName} (${organizerEmail})`);
        doc.moveDown(2);

        // Lifter Information
        doc.fontSize(12).font('Helvetica-Bold').text('LIFTER INFORMATION');
        doc.fontSize(10).font('Helvetica');
        if (liftRecord && liftRecord.member) {
            doc.text(`Name: ${liftRecord.member.name}`);
            doc.text(`Email: ${liftRecord.member.email}`);
            doc.text(`Payout Amount: ₹${lifterPayout.toLocaleString()}`);
            doc.text(`Lift Date: ${new Date(liftRecord.liftedAt).toLocaleDateString()}`);
        } else {
            doc.text('No lifter selected for this month');
        }
        doc.moveDown(2);

        // Payment Summary
        doc.fontSize(12).font('Helvetica-Bold').text('PAYMENT SUMMARY');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Total Pool Value: ₹${totalPool.toLocaleString()}`);
        doc.text(`Commission: ₹${commission.toLocaleString()}`);
        doc.text(`Lifter Payout: ₹${lifterPayout.toLocaleString()}`);
        doc.moveDown();
        doc.text(`Total Collected: ₹${totalCollected.toLocaleString()}`);
        doc.text(`Online Payments: ₹${totalOnline.toLocaleString()} (${onlinePayments.length} transactions)`);
        doc.text(`Cash Payments: ₹${totalCash.toLocaleString()} (${cashPayments.length} transactions)`);
        doc.moveDown(2);

        // Extra Charges
        if (previousLiftersCount > 0) {
            doc.fontSize(12).font('Helvetica-Bold').text('EXTRA CHARGES');
            doc.fontSize(10).font('Helvetica');
            doc.text(`Previous Lifters: ${previousLiftersCount}`);
            doc.text(`Extra Charge per Lifter: ₹${extraChargePerMonth.toLocaleString()}`);
            doc.text(`Total Extra Collected: ₹${(previousLiftersCount * extraChargePerMonth).toLocaleString()}`);
            doc.moveDown(2);
        }

        // Transaction History
        doc.fontSize(12).font('Helvetica-Bold').text('TRANSACTION HISTORY');
        doc.moveDown();

        if (transactions.length > 0) {
            // Table header
            const tableTop = doc.y;
            const col1 = 50;
            const col2 = 150;
            const col3 = 300;
            const col4 = 400;
            const col5 = 500;

            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Date', col1, tableTop);
            doc.text('Member', col2, tableTop);
            doc.text('Mode', col3, tableTop);
            doc.text('Amount', col4, tableTop);
            doc.text('Status', col5, tableTop);

            doc.moveDown();
            let y = doc.y;

            // Table rows
            doc.fontSize(8).font('Helvetica');
            transactions.forEach((t, i) => {
                if (y > 700) { // New page if needed
                    doc.addPage();
                    y = 50;
                }

                const date = new Date(t.createdAt).toLocaleDateString();
                const name = t.user?.name || 'Unknown';
                const mode = (t.paymentMode || 'online').toUpperCase();
                const amount = `₹${t.totalAmount.toLocaleString()}`;
                const status = t.status;

                doc.text(date, col1, y);
                doc.text(name, col2, y, { width: 140, ellipsis: true });
                doc.text(mode, col3, y);
                doc.text(amount, col4, y);
                doc.text(status, col5, y);

                y += 20;
            });
        } else {
            doc.fontSize(10).font('Helvetica').text('No transactions found for this month');
        }

        doc.moveDown(2);

        // Member Payment Status
        doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').text('MEMBER PAYMENT STATUS');
        doc.moveDown();

        const memberTableTop = doc.y;
        const mcol1 = 50;
        const mcol2 = 200;
        const mcol3 = 350;
        const mcol4 = 480;

        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Name', mcol1, memberTableTop);
        doc.text('Email', mcol2, memberTableTop);
        doc.text('Status', mcol3, memberTableTop);
        doc.text('Amount', mcol4, memberTableTop);

        doc.moveDown();
        let my = doc.y;

        doc.fontSize(8).font('Helvetica');
        chit.members.forEach((member) => {
            if (my > 700) {
                doc.addPage();
                my = 50;
            }

            if (!member.user) {
                // Skip members with missing user data (deleted users)
                console.warn(`Skipping member with missing user data in chit ${chitId}`);
                return;
            }

            const memberTransaction = transactions.find(t => t.user && t.user._id.toString() === member.user._id.toString());
            const status = memberTransaction ? 'PAID' : 'PENDING';
            const amount = memberTransaction ? `₹${memberTransaction.totalAmount.toLocaleString()}` : '-';

            doc.text(member.user.name || 'Unknown', mcol1, my, { width: 140, ellipsis: true });
            doc.text(member.user.email || 'Unknown', mcol2, my, { width: 140, ellipsis: true });
            doc.text(status, mcol3, my);
            doc.text(amount, mcol4, my);

            my += 20;
        });

        // Footer
        doc.fontSize(8).font('Helvetica').text(
            `Generated by ChitFundPro on ${new Date().toLocaleString()}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
        );

        // Finalize PDF
        doc.end();
    } catch (error) {
        console.error('Error generating PDF content:', error);
        doc.end();
    }
});

module.exports = {
    generateMonthlyReport
};
