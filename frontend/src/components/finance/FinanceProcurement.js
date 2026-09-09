import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShoppingCart } from 'lucide-react';

import { getRole } from '../../auth';
import FinanceLayout from './FinanceLayout';

/**
 * Legacy finance procurement path — supplier tenders live in the Procurement portal.
 * Finance requisitions under /api/finance/procurement remain available to the API;
 * the UI for tenders/suppliers/contracts is the dedicated department portal.
 */
export default function FinanceProcurement() {
  const role = getRole();
  const isAdmin = role === 'admin' || role === 'super_admin';

  return (
    <FinanceLayout
      title="Procurement"
      subtitle="Supplier tenders, bids, contracts, and spend analytics moved to the Procurement portal."
    >
      <section className="max-w-2xl rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-8 shadow-sm">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8f8f8] text-[#e41e1f]">
          <ShoppingCart size={22} />
        </div>
        {isAdmin ? (
          <>
            <h2 className="text-lg font-bold text-[#1f1f1f]">Open Procurement portal</h2>
            <p className="mt-2 text-sm text-[#8b8b8b]">
              Tenders, suppliers, contracts, integrity ledger, and spend analytics are managed in
              the dedicated Procurement department portal.
            </p>
            <Link
              to="/procurement"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f]"
            >
              Open Procurement portal
              <ExternalLink size={16} />
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-[#1f1f1f]">Managed by Procurement</h2>
            <p className="mt-2 text-sm text-[#8b8b8b]">
              Supplier tenders are managed in the Procurement portal — ask a procurement officer or
              admin.
            </p>
          </>
        )}
      </section>
    </FinanceLayout>
  );
}
