import React, { useState } from 'react';
import { X, Printer, Share2, Check, CheckCircle2 } from 'lucide-react';
import { FeePayment } from '../types';
import { QrCodeSvg } from './QrCodeSvg';

interface DigitalReceiptModalProps {
  payment: FeePayment | null;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  payment,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!payment) return null;

  const handleCopyShareText = () => {
    const shareMsg = [
      `*VidyaKosh Study Library — Official Fee Receipt*`,
      `Receipt No: ${payment.id}`,
      `Member: ${payment.memberName} (${payment.memberId})`,
      `Seat: ${payment.seatCode || 'Unassigned'} | Locker: ${payment.lockerCode || 'None'}`,
      `Plan: ${payment.plan} (${payment.months} Month${payment.months > 1 ? 's' : ''})`,
      `Validity: ${payment.validFrom} to ${payment.validUntil}`,
      `Amount Paid: ₹${payment.totalPaid.toLocaleString('en-IN')} via ${payment.mode}`,
      `Status: Verified & Paid`,
    ].join('\n');

    navigator.clipboard?.writeText(shareMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden my-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-900">Verified Digital Fee Receipt</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{payment.id}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
            aria-label="Close receipt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable receipt content */}
        <div id="printable-area" className="p-6 space-y-5 bg-white">
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                VidyaKosh Study Hall & Reading Library
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                2nd Floor, Knowledge Plaza, Old Rajendra Nagar · Helpline: +91 98110 44200
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-mono tabular-nums">
                <span>Receipt: {payment.id}</span>
                <span aria-hidden="true">·</span>
                <span>Date: {payment.date}</span>
              </div>
            </div>
            <div className="shrink-0 border border-slate-200 rounded-lg p-1.5 bg-white">
              <QrCodeSvg
                value={`VIDYAKOSH|${payment.id}|${payment.memberId}|INR:${payment.totalPaid}|UNTIL:${payment.validUntil}`}
                size={68}
              />
            </div>
          </div>

          {/* Member & Seat Info */}
          <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <p className="text-slate-500">Student / Member Details</p>
              <p className="text-sm font-semibold text-slate-900">{payment.memberName}</p>
              <p className="text-slate-600 font-mono tabular-nums">
                {payment.memberId} · +91 {payment.memberPhone}
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-slate-500">Assigned Desk & Validity</p>
              <p className="text-sm font-semibold text-slate-900 font-mono tabular-nums">
                Seat {payment.seatCode || 'Unassigned'}
                {payment.lockerCode ? ` · Locker ${payment.lockerCode}` : ''}
              </p>
              <p className="text-emerald-700 font-mono tabular-nums font-medium">
                {payment.validFrom} → {payment.validUntil}
              </p>
            </div>
          </div>

          {/* Fee Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
              <span>Fee Particulars</span>
              <span>Amount (₹)</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-700">
                Study Desk Fee — {payment.plan} Plan ({payment.months} Month
                {payment.months > 1 ? 's' : ''})
              </span>
              <span className="font-mono tabular-nums text-slate-900">
                ₹{payment.baseAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-700">
                Personal Locker Add-on {payment.lockerCode ? `(${payment.lockerCode})` : '(None)'}
              </span>
              <span className="font-mono tabular-nums text-slate-900">
                ₹{payment.lockerFee.toLocaleString('en-IN')}
              </span>
            </div>
            {payment.discount > 0 && (
              <div className="flex items-center justify-between text-xs py-1 text-emerald-700">
                <span>Long-Term Plan Concession / Discount</span>
                <span className="font-mono tabular-nums">
                  -₹{payment.discount.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-sm font-semibold text-slate-900">
              <span>Net Total Received</span>
              <span className="text-base font-mono tabular-nums text-emerald-700">
                ₹{payment.totalPaid.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Payment metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2 font-mono tabular-nums">
              <span>Mode: {payment.mode}</span>
              {payment.transactionRef && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Ref: {payment.transactionRef}</span>
                </>
              )}
            </div>
            <span className="text-emerald-700 font-medium"> Digitally Signed · Paid in Full</span>
          </div>

          {payment.remarks && (
            <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-2">
              Note: {payment.remarks}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            onClick={handleCopyShareText}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied WhatsApp Receipt Text</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy for WhatsApp / SMS</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
