import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { recordPayment } from '../features/payments/paymentSlice';
import { X, QrCode, CheckCircle, CreditCard, Banknote } from 'lucide-react';

function PaymentModal({ isOpen, onClose, chit, amount, month, onSuccess }) {
    const dispatch = useDispatch();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [paymentMode, setPaymentMode] = useState('online'); // 'online' or 'cash'

    // Handle null or undefined amount
    const paymentAmount = amount || 0;

    if (!isOpen || !chit) return null;

    const handlePayment = async () => {
        setIsProcessing(true);

        // Simulate payment processing delay
        setTimeout(async () => {
            const paymentData = {
                chitId: chit._id,
                amount: paymentAmount,
                month: month,
                type: 'payment',
                status: 'completed',
                paymentMode: paymentMode // Include payment mode
            };

            await dispatch(recordPayment(paymentData));
            setIsProcessing(false);
            setIsSuccess(true);

            // Close modal after showing success
            setTimeout(() => {
                setIsSuccess(false);
                onClose();
                if (onSuccess) onSuccess(); // Call parent callback to refresh data
            }, 2000);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold text-slate-800">Make Payment</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 text-center">
                    {isSuccess ? (
                        <div className="py-8">
                            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                            <h4 className="text-xl font-bold text-slate-800 mb-2">Payment Successful!</h4>
                            <p className="text-slate-500">Your {paymentMode} payment of ₹{paymentAmount.toLocaleString()} has been recorded.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <p className="text-sm text-slate-500 mb-1">Payment for</p>
                                <h4 className="text-xl font-bold text-slate-800">{chit.name}</h4>
                                <p className="text-sm text-slate-500 mt-1">Month {month}</p>
                            </div>

                            {/* Payment Mode Selection */}
                            <div className="mb-6">
                                <p className="text-sm font-medium text-slate-700 mb-3">Select Payment Mode</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setPaymentMode('online')}
                                        className={`p-4 rounded-lg border-2 transition ${paymentMode === 'online'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <CreditCard className={`mx-auto mb-2 ${paymentMode === 'online' ? 'text-blue-600' : 'text-slate-400'}`} size={32} />
                                        <p className={`text-sm font-medium ${paymentMode === 'online' ? 'text-blue-600' : 'text-slate-600'}`}>
                                            Online
                                        </p>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMode('cash')}
                                        className={`p-4 rounded-lg border-2 transition ${paymentMode === 'cash'
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <Banknote className={`mx-auto mb-2 ${paymentMode === 'cash' ? 'text-green-600' : 'text-slate-400'}`} size={32} />
                                        <p className={`text-sm font-medium ${paymentMode === 'cash' ? 'text-green-600' : 'text-slate-600'}`}>
                                            Cash
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* QR Code - Show for Cash payments */}
                            {paymentMode === 'cash' && (
                                <div className="bg-slate-100 p-6 rounded-lg mb-6 inline-block">
                                    <QrCode size={120} className="text-slate-800 mx-auto" />
                                    <p className="text-xs text-slate-500 mt-2">Scan QR Code to Pay Cash</p>
                                    <p className="text-xs text-slate-400 mt-1">Pay to Organizer</p>
                                </div>
                            )}

                            {/* Amount Due */}
                            <div className="mb-6">
                                <p className="text-sm text-slate-500 mb-1">Amount Due</p>
                                <p className="text-3xl font-bold text-blue-600">₹{paymentAmount.toLocaleString()}</p>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className={`w-full py-3 rounded-md text-white font-medium transition ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {isProcessing ? 'Processing Payment...' : `Confirm ${paymentMode === 'cash' ? 'Cash' : 'Online'} Payment`}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PaymentModal;
