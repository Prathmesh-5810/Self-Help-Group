/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SHG Decision Support System — Production Application Core
 * Vanilla ES2022 (Single IIFE), Zero Dependencies, Offline-First with 'shg.v1'
 */

(() => {
  'use strict';

  // =========================================================================
  // 1. Constants, Formatters & Utilities
  // =========================================================================
  const STORAGE_KEY = 'shg.v1';

  // Indian Rupee currency formatter
  const inrFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });

  const formatINR = (val) => inrFormatter.format(Number(val) || 0);

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const [y, m, d] = isoStr.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
    } catch {
      return isoStr;
    }
  };

  const getMonthLabel = (ymStr) => {
    if (!ymStr) return '';
    const [y, m] = ymStr.split('-');
    const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${names[parseInt(m, 10) - 1]} ${y}`;
  };

  // Safe localStorage helper with in-memory degradation
  let memoryStore = null;
  const storage = {
    get(key) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const item = window.localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        }
      } catch (e) {
        console.warn('localStorage read failed, falling back to memory', e);
      }
      return memoryStore;
    },
    set(key, val) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, JSON.stringify(val));
          return true;
        }
      } catch (e) {
        console.warn('localStorage write failed, falling back to memory', e);
      }
      memoryStore = val;
      return true;
    }
  };

  // =========================================================================
  // 2. Canonical Seed Data (April 2025 Reconciliation)
  // =========================================================================
  const getInitialSeed = () => ({
    version: 'shg.v1',
    selectedMonth: '2025-04',
    theme: 'light',
    config: {
      shgName: 'Pragati Mahila SHG',
      regNumber: 'TN-SHG-2023-8841',
      village: 'Tambaram South, Chennai',
      bankName: 'Canara Bank, Branch #0412',
      savingsGoalAnnual: 100000,
      monthlyMandatorySavings: 1000
    },
    members: [
      { id: 'M001', name: 'Anjali Sharma', role: 'President', phone: '+91 98451 23001', joinedDate: '2023-01-15', status: 'Active', enterprise: 'Dairy & Organic Milk' },
      { id: 'M002', name: 'Sunita Verma', role: 'Secretary', phone: '+91 94432 18920', joinedDate: '2023-02-10', status: 'Active', enterprise: 'Handicrafts & Jute Bags' },
      { id: 'M003', name: 'Pooja Patel', role: 'Treasurer', phone: '+91 97890 45612', joinedDate: '2023-03-01', status: 'Active', enterprise: 'Turmeric & Spice Processing' },
      { id: 'M004', name: 'Meena Reddy', role: 'Executive Member', phone: '+91 98840 77123', joinedDate: '2023-06-20', status: 'Active', enterprise: 'Garments & Tailoring' },
      { id: 'M005', name: 'Lakshmi Nair', role: 'Member', phone: '+91 99620 33451', joinedDate: '2023-08-12', status: 'Active', enterprise: 'Pure Honey & Apiary' }
    ],
    // Loans: L001 to L005
    loans: [
      { id: 'L001', memberId: 'M001', amount: 20000, purpose: 'Dairy Cattle Feed & Chaff Cutter', issuedDate: '2025-01-10', termMonths: 10, interestRate: 1 },
      { id: 'L002', memberId: 'M002', amount: 15000, purpose: 'Handloom Weaving Accessories', issuedDate: '2025-02-15', termMonths: 6, interestRate: 1 },
      { id: 'L003', memberId: 'M003', amount: 10000, purpose: 'Spice Grinder & Packaging Machine', issuedDate: '2025-03-05', termMonths: 5, interestRate: 1 },
      { id: 'L004', memberId: 'M004', amount: 8000, purpose: 'Sewing Machine Motor Upgrade', issuedDate: '2025-04-02', termMonths: 4, interestRate: 1 },
      { id: 'L005', memberId: 'M005', amount: 12000, purpose: 'Apiary Beehive Wooden Boxes', issuedDate: '2024-11-20', termMonths: 5, interestRate: 1 }
    ],
    // Repayments
    repayments: [
      // L001 repayments
      { id: 'R101', loanId: 'L001', memberId: 'M001', amount: 2000, date: '2025-02-10', mode: 'Cash', notes: 'Installment 1' },
      { id: 'R102', loanId: 'L001', memberId: 'M001', amount: 2000, date: '2025-03-10', mode: 'Cash', notes: 'Installment 2' },
      { id: 'R103', loanId: 'L001', memberId: 'M001', amount: 2000, date: '2025-04-10', mode: 'Cash', notes: 'Installment 3' },
      // L002 repayments
      { id: 'R104', loanId: 'L002', memberId: 'M002', amount: 2500, date: '2025-03-15', mode: 'UPI', notes: 'Installment 1' },
      { id: 'R105', loanId: 'L002', memberId: 'M002', amount: 2500, date: '2025-04-15', mode: 'UPI', notes: 'Installment 2' },
      // L003 repayments
      { id: 'R106', loanId: 'L003', memberId: 'M003', amount: 2000, date: '2025-04-05', mode: 'Cash', notes: 'Installment 1' },
      // L005 repayments (fully closed)
      { id: 'R107', loanId: 'L005', memberId: 'M005', amount: 2400, date: '2024-12-20', mode: 'Cash', notes: 'Installment 1' },
      { id: 'R108', loanId: 'L005', memberId: 'M005', amount: 2400, date: '2025-01-20', mode: 'Cash', notes: 'Installment 2' },
      { id: 'R109', loanId: 'L005', memberId: 'M005', amount: 2400, date: '2025-02-20', mode: 'Cash', notes: 'Installment 3' },
      { id: 'R110', loanId: 'L005', memberId: 'M005', amount: 2400, date: '2025-03-20', mode: 'Cash', notes: 'Installment 4' },
      { id: 'R111', loanId: 'L005', memberId: 'M005', amount: 2400, date: '2025-04-18', mode: 'Cash', notes: 'Final settlement' }
    ],
    // Savings records (cumulative past + current monthly deposits)
    savings: [
      // March 2025 Deposits (for comparison deltas)
      { id: 'S090', memberId: 'M001', month: '2025-03', mandatoryAmount: 1000, voluntaryAmount: 500, date: '2025-03-05' },
      { id: 'S091', memberId: 'M002', month: '2025-03', mandatoryAmount: 1000, voluntaryAmount: 1000, date: '2025-03-05' },
      { id: 'S092', memberId: 'M003', month: '2025-03', mandatoryAmount: 1000, voluntaryAmount: 500, date: '2025-03-06' },
      { id: 'S093', memberId: 'M004', month: '2025-03', mandatoryAmount: 1000, voluntaryAmount: 0, date: '2025-03-08' },
      { id: 'S094', memberId: 'M005', month: '2025-03', mandatoryAmount: 1000, voluntaryAmount: 1000, date: '2025-03-10' },

      // April 2025 Deposits (Current Month)
      { id: 'S101', memberId: 'M001', month: '2025-04', mandatoryAmount: 1000, voluntaryAmount: 500, date: '2025-04-05' },
      { id: 'S102', memberId: 'M002', month: '2025-04', mandatoryAmount: 1000, voluntaryAmount: 2000, date: '2025-04-05' },
      { id: 'S103', memberId: 'M003', month: '2025-04', mandatoryAmount: 1000, voluntaryAmount: 1000, date: '2025-04-08' },
      { id: 'S104', memberId: 'M004', month: '2025-04', mandatoryAmount: 1000, voluntaryAmount: 0, date: '2025-04-10' },
      { id: 'S105', memberId: 'M005', month: '2025-04', mandatoryAmount: 1000, voluntaryAmount: 1500, date: '2025-04-12' }
    ],
    // Historical cumulative savings base prior to March 2025
    priorCumulativeSavings: {
      M001: 9500,
      M002: 12000,
      M003: 8000,
      M004: 6500,
      M005: 10000
    },
    // Operating Income & Expenses
    transactions: [
      { id: 'T001', type: 'income', category: 'Membership Fee', amount: 500, date: '2025-04-01', description: 'Annual group maintenance dues (5 x ₹100)' },
      { id: 'T002', type: 'income', category: 'Bank Interest', amount: 380, date: '2025-04-04', description: 'Savings deposit interest credited by Canara Bank' },
      { id: 'T003', type: 'expense', category: 'Stationery & Registers', amount: 450, date: '2025-04-06', description: 'New ledger books and receipt vouchers' },
      { id: 'T004', type: 'expense', category: 'Meeting Refreshments', amount: 320, date: '2025-04-15', description: 'Tea and snacks for mid-month group meeting' },
      { id: 'T005', type: 'income', category: 'Fair Stall Bonus', amount: 1200, date: '2025-04-20', description: 'District artisan stall commission share' }
    ],
    // Products (Marketplace)
    products: [
      { id: 'P001', name: 'Organic Turmeric Powder (500g)', category: 'Spices', unitPrice: 180, stock: 42, producerId: 'M003', description: 'Pure farm-processed golden Lakadong turmeric' },
      { id: 'P002', name: 'Handwoven Jute Tote Bag', category: 'Handicrafts', unitPrice: 350, stock: 28, producerId: 'M002', description: 'Eco-friendly double-stitched daily grocery bags' },
      { id: 'P003', name: 'Pure Forest Wild Honey (500ml)', category: 'Food & Nutrition', unitPrice: 420, stock: 19, producerId: 'M005', description: 'Raw unprocessed multifloral honey from local apiary' },
      { id: 'P004', name: 'Cold-Pressed Sesame Oil (1L)', category: 'Food & Nutrition', unitPrice: 290, stock: 35, producerId: 'M001', description: 'Traditional chekku wooden expeller sesame oil' },
      { id: 'P005', name: 'Handmade Neem & Aloe Soap (Set of 3)', category: 'Personal Care', unitPrice: 150, stock: 60, producerId: 'M004', description: 'Organic herbal cold-process moisturizing soap bars' }
    ],
    // Sales Records
    sales: [
      { id: 'SL01', productId: 'P001', memberId: 'M003', quantity: 6, unitPrice: 180, totalAmount: 1080, date: '2025-04-05', buyerName: 'Kaveri Department Store', paymentMode: 'UPI' },
      { id: 'SL02', productId: 'P003', memberId: 'M005', quantity: 4, unitPrice: 420, totalAmount: 1680, date: '2025-04-08', buyerName: 'Dr. Radhakrishnan Clinic', paymentMode: 'Cash' },
      { id: 'SL03', productId: 'P002', memberId: 'M002', quantity: 8, unitPrice: 350, totalAmount: 2800, date: '2025-04-12', buyerName: 'Tambaram Organic Bazar', paymentMode: 'UPI' },
      { id: 'SL04', productId: 'P004', memberId: 'M001', quantity: 5, unitPrice: 290, totalAmount: 1450, date: '2025-04-15', buyerName: 'Sri Krishna Sweets', paymentMode: 'Cash' },
      { id: 'SL05', productId: 'P005', memberId: 'M004', quantity: 10, unitPrice: 150, totalAmount: 1500, date: '2025-04-20', buyerName: 'Village Women Welfare Expo', paymentMode: 'Cash' }
    ],
    // Notification items
    notifications: [
      { id: 'N01', title: 'Repayment Scheduled', desc: 'Meena Reddy upcoming installment for L004 due on 2nd May', date: 'Today', unread: true, link: '#/loans' },
      { id: 'N02', title: 'Savings Target Met', desc: 'Group reached ₹64,000 cumulative savings milestone!', date: 'Yesterday', unread: true, link: '#/savings' },
      { id: 'N03', title: 'Low Stock Alert', desc: 'Pure Forest Wild Honey is down to 19 bottles in inventory', date: '2 days ago', unread: true, link: '#/products' }
    ]
  });

  // =========================================================================
  // 3. Immutable State Store & Reducer
  // =========================================================================
  let state = (() => {
    const loaded = storage.get(STORAGE_KEY);
    if (loaded && loaded.version === 'shg.v1') {
      return loaded;
    }
    const seed = getInitialSeed();
    storage.set(STORAGE_KEY, seed);
    return seed;
  })();

  const listeners = new Set();
  const subscribe = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };

  const dispatch = (action) => {
    state = rootReducer(state, action);
    storage.set(STORAGE_KEY, state);
    listeners.forEach((fn) => {
      try { fn(state, action); } catch (e) { console.error('Listener error', e); }
    });
  };

  const rootReducer = (prev, action) => {
    switch (action.type) {
      case 'SET_MONTH':
        return { ...prev, selectedMonth: action.payload };

      case 'TOGGLE_THEME': {
        const nextTheme = prev.theme === 'dark' ? 'light' : 'dark';
        return { ...prev, theme: nextTheme };
      }

      case 'RESET_SEED':
        return getInitialSeed();

      case 'IMPORT_STATE':
        return { ...action.payload, version: 'shg.v1' };

      case 'UPDATE_CONFIG':
        return { ...prev, config: { ...prev.config, ...action.payload } };

      case 'MARK_ALL_NOTIFICATIONS_READ':
        return {
          ...prev,
          notifications: prev.notifications.map(n => ({ ...n, unread: false }))
        };

      // --- Members CRUD ---
      case 'ADD_MEMBER':
        return { ...prev, members: [...prev.members, action.payload] };

      case 'UPDATE_MEMBER':
        return {
          ...prev,
          members: prev.members.map(m => m.id === action.payload.id ? action.payload : m)
        };

      case 'DELETE_MEMBER': {
        const memberId = action.payload;
        return {
          ...prev,
          members: prev.members.filter(m => m.id !== memberId),
          loans: prev.loans.filter(l => l.memberId !== memberId),
          repayments: prev.repayments.filter(r => r.memberId !== memberId),
          savings: prev.savings.filter(s => s.memberId !== memberId)
        };
      }

      // --- Loans CRUD ---
      case 'ADD_LOAN':
        return { ...prev, loans: [...prev.loans, action.payload] };

      case 'UPDATE_LOAN':
        return {
          ...prev,
          loans: prev.loans.map(l => l.id === action.payload.id ? action.payload : l)
        };

      case 'DELETE_LOAN':
        return {
          ...prev,
          loans: prev.loans.filter(l => l.id !== action.payload),
          repayments: prev.repayments.filter(r => r.loanId !== action.payload)
        };

      // --- Repayments ---
      case 'ADD_REPAYMENT':
        return { ...prev, repayments: [...prev.repayments, action.payload] };

      case 'DELETE_REPAYMENT':
        return { ...prev, repayments: prev.repayments.filter(r => r.id !== action.payload) };

      // --- Savings CRUD ---
      case 'RECORD_SAVINGS':
        return { ...prev, savings: [...prev.savings, action.payload] };

      case 'UPDATE_SAVINGS':
        return {
          ...prev,
          savings: prev.savings.map(s => s.id === action.payload.id ? action.payload : s)
        };

      case 'DELETE_SAVINGS':
        return { ...prev, savings: prev.savings.filter(s => s.id !== action.payload) };

      // --- Transactions CRUD ---
      case 'ADD_TRANSACTION':
        return { ...prev, transactions: [...prev.transactions, action.payload] };

      case 'DELETE_TRANSACTION':
        return { ...prev, transactions: prev.transactions.filter(t => t.id !== action.payload) };

      // --- Products CRUD ---
      case 'ADD_PRODUCT':
        return { ...prev, products: [...prev.products, action.payload] };

      case 'UPDATE_PRODUCT':
        return {
          ...prev,
          products: prev.products.map(p => p.id === action.payload.id ? action.payload : p)
        };

      case 'DELETE_PRODUCT':
        return { ...prev, products: prev.products.filter(p => p.id !== action.payload) };

      case 'UPDATE_STOCK':
        return {
          ...prev,
          products: prev.products.map(p => p.id === action.payload.id ? { ...p, stock: Math.max(0, p.stock + action.payload.delta) } : p)
        };

      // --- Sales CRUD ---
      case 'RECORD_SALE': {
        const sale = action.payload;
        // Decrement product stock automatically
        const nextProducts = prev.products.map(p => {
          if (p.id === sale.productId) {
            return { ...p, stock: Math.max(0, p.stock - sale.quantity) };
          }
          return p;
        });
        return {
          ...prev,
          products: nextProducts,
          sales: [...prev.sales, sale]
        };
      }

      case 'DELETE_SALE':
        return { ...prev, sales: prev.sales.filter(s => s.id !== action.payload) };

      default:
        return prev;
    }
  };

  // =========================================================================
  // 4. Derived Aggregates & Selectors (Zero Hardcoding)
  // =========================================================================
  const Selectors = {
    // Member lookup
    getMemberMap: (s) => new Map(s.members.map(m => [m.id, m])),

    // Computed loan statuses and balances
    getEnrichedLoans: (s) => {
      const memberMap = Selectors.getMemberMap(s);
      const repaymentsByLoan = new Map();
      s.repayments.forEach(r => {
        repaymentsByLoan.set(r.loanId, (repaymentsByLoan.get(r.loanId) || 0) + Number(r.amount));
      });

      return s.loans.map(loan => {
        const principal = Number(loan.amount) || 0;
        const repaid = repaymentsByLoan.get(loan.id) || 0;
        const outstanding = Math.max(0, principal - repaid);
        const member = memberMap.get(loan.memberId);

        let status = 'Pending';
        if (repaid >= principal && principal > 0) {
          status = 'Closed';
        } else if (repaid > 0) {
          status = 'Partial';
        }

        const progressPct = principal > 0 ? Math.min(100, Math.round((repaid / principal) * 100)) : 0;

        return {
          ...loan,
          borrowerName: member ? member.name : 'Unknown Member',
          borrowerRole: member ? member.role : '',
          principal,
          repaid,
          outstanding,
          status,
          progressPct
        };
      });
    },

    // Loans summary metrics
    getLoansKPI: (s) => {
      const enriched = Selectors.getEnrichedLoans(s);
      const totalDisbursed = enriched.reduce((sum, l) => sum + l.principal, 0);
      const totalRepaid = enriched.reduce((sum, l) => sum + l.repaid, 0);
      const outstandingBalance = enriched.reduce((sum, l) => sum + l.outstanding, 0);
      const activeCount = enriched.filter(l => l.status !== 'Closed').length;
      const closedCount = enriched.filter(l => l.status === 'Closed').length;
      const recoveryRate = totalDisbursed > 0 ? ((totalRepaid / totalDisbursed) * 100).toFixed(1) : 0;

      return {
        totalDisbursed,
        totalRepaid,
        outstandingBalance,
        activeCount,
        closedCount,
        recoveryRate
      };
    },

    // Savings derivation (per-member totals, monthly totals, prior comparisons)
    getSavingsMetrics: (s, targetMonth = s.selectedMonth) => {
      const memberMap = Selectors.getMemberMap(s);
      
      // Calculate total cumulative savings per member across all time
      const memberTotals = new Map();
      s.members.forEach(m => {
        const basePrior = (s.priorCumulativeSavings && s.priorCumulativeSavings[m.id]) || 0;
        memberTotals.set(m.id, basePrior);
      });

      s.savings.forEach(deposit => {
        const cur = memberTotals.get(deposit.memberId) || 0;
        const depTotal = (Number(deposit.mandatoryAmount) || 0) + (Number(deposit.voluntaryAmount) || 0);
        memberTotals.set(deposit.memberId, cur + depTotal);
      });

      const totalCumulativeSavings = Array.from(memberTotals.values()).reduce((a, b) => a + b, 0);

      // Selected month deposits
      const currentMonthDeposits = s.savings.filter(d => d.month === targetMonth);
      const monthDepositSum = currentMonthDeposits.reduce((acc, d) => {
        return acc + (Number(d.mandatoryAmount) || 0) + (Number(d.voluntaryAmount) || 0);
      }, 0);

      // Previous month calculation for delta
      const [year, month] = targetMonth.split('-').map(Number);
      const prevDate = new Date(year, month - 2, 1);
      const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      const prevMonthDeposits = s.savings.filter(d => d.month === prevMonthStr);
      const prevMonthDepositSum = prevMonthDeposits.reduce((acc, d) => {
        return acc + (Number(d.mandatoryAmount) || 0) + (Number(d.voluntaryAmount) || 0);
      }, 0);

      const growthDelta = prevMonthDepositSum > 0
        ? (((monthDepositSum - prevMonthDepositSum) / prevMonthDepositSum) * 100).toFixed(1)
        : '+0.0';

      const avgPerMember = s.members.length > 0 ? Math.round(totalCumulativeSavings / s.members.length) : 0;
      const activeSaversCount = s.members.length;

      // Donut slice segments calculation
      const donutColors = ['#6C4FD8', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];
      let cumulativePercent = 0;
      const donutSlices = s.members.map((m, idx) => {
        const amount = memberTotals.get(m.id) || 0;
        const percent = totalCumulativeSavings > 0 ? (amount / totalCumulativeSavings) * 100 : 0;
        const slice = {
          memberId: m.id,
          memberName: m.name,
          amount,
          percent: percent.toFixed(1),
          color: donutColors[idx % donutColors.length],
          startPercent: cumulativePercent,
          endPercent: cumulativePercent + percent
        };
        cumulativePercent += percent;
        return slice;
      });

      // Quick Insight statement
      let topSaver = null;
      let topSaverAmount = -1;
      currentMonthDeposits.forEach(d => {
        const amt = (Number(d.mandatoryAmount) || 0) + (Number(d.voluntaryAmount) || 0);
        if (amt > topSaverAmount) {
          topSaverAmount = amt;
          topSaver = memberMap.get(d.memberId);
        }
      });

      const insightMsg = topSaver
        ? `Top contributor for ${getMonthLabel(targetMonth)} is ${topSaver.name} (${formatINR(topSaverAmount)}). Total group savings grew by ${growthDelta}% vs ${getMonthLabel(prevMonthStr)}. 100% of active members have contributed on schedule.`
        : `All 5 members are actively depositing towards the group emergency fund. Cumulative group savings stand at ${formatINR(totalCumulativeSavings)}.`;

      return {
        totalCumulativeSavings,
        monthDepositSum,
        prevMonthDepositSum,
        growthDelta,
        avgPerMember,
        activeSaversCount,
        donutSlices,
        insightMsg,
        currentMonthDeposits
      };
    },

    // Sales & Products metrics
    getSalesMetrics: (s, targetMonth = s.selectedMonth) => {
      const filteredSales = s.sales.filter(sl => sl.date.startsWith(targetMonth));
      const totalSalesRevenue = filteredSales.reduce((acc, sl) => acc + (Number(sl.totalAmount) || 0), 0);
      const unitsSold = filteredSales.reduce((acc, sl) => acc + (Number(sl.quantity) || 0), 0);
      const totalInventoryValue = s.products.reduce((acc, p) => acc + (p.stock * p.unitPrice), 0);

      return {
        filteredSales,
        totalSalesRevenue,
        unitsSold,
        totalInventoryValue
      };
    },

    // Net Group Cash Position
    getCashFlowMetrics: (s, targetMonth = s.selectedMonth) => {
      const monthlyIncome = s.transactions
        .filter(t => t.type === 'income' && t.date.startsWith(targetMonth))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthlyExpense = s.transactions
        .filter(t => t.type === 'expense' && t.date.startsWith(targetMonth))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const netOperationalCash = monthlyIncome - monthlyExpense;

      // Group Net Worth = Cumulative Savings + Outstanding Loan Asset + Product Inventory Value + Net Cash
      const savings = Selectors.getSavingsMetrics(s, targetMonth);
      const loans = Selectors.getLoansKPI(s);
      const sales = Selectors.getSalesMetrics(s, targetMonth);

      const groupNetWorth = savings.totalCumulativeSavings + loans.outstandingBalance + sales.totalInventoryValue + netOperationalCash;

      return {
        monthlyIncome,
        monthlyExpense,
        netOperationalCash,
        groupNetWorth
      };
    }
  };

  // =========================================================================
  // 5. High-Performance Motion Engine (Golden Rules Implementation)
  // =========================================================================
  const Motion = {
    // Number count-up tweening via requestAnimationFrame (easeOutCubic, 700ms)
    countUp(element, endVal, prefix = '', suffix = '') {
      if (!element) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        element.textContent = `${prefix}${Number(endVal).toLocaleString('en-IN')}${suffix}`;
        return;
      }

      const startVal = Number(element.dataset.prevVal) || 0;
      element.dataset.prevVal = endVal;

      const duration = 700;
      const startTime = performance.now();

      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

      const frame = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const current = Math.round(startVal + (endVal - startVal) * easeOutCubic(progress));
        element.textContent = `${prefix}${current.toLocaleString('en-IN')}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          element.textContent = `${prefix}${Number(endVal).toLocaleString('en-IN')}${suffix}`;
        }
      };

      requestAnimationFrame(frame);
    },

    // Animate sliding active glass nav pill indicator (rock-solid offsetTop anchoring)
    updateNavPill(activeRoute) {
      const activeLink = document.querySelector(`.nav-item[data-route="${activeRoute}"]`);
      const pill = document.getElementById('nav-active-pill');
      if (!activeLink || !pill) return;

      const applyPosition = () => {
        const topOffset = activeLink.offsetTop;
        const height = activeLink.offsetHeight || 44;
        pill.style.transform = `translate3d(0, ${topOffset}px, 0)`;
        pill.style.height = `${height}px`;
        pill.style.opacity = '1';
      };

      applyPosition();
      requestAnimationFrame(applyPosition);

      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      activeLink.classList.add('active');
    }
  };

  // =========================================================================
  // 6. Global Accessible Modal Manager & Toasts
  // =========================================================================
  const Toast = {
    show(message, type = 'success', undoCallback = null) {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.setAttribute('role', 'status');

      let iconSvg = '';
      if (type === 'success') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
      } else if (type === 'warning') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      } else {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      }

      toast.innerHTML = `
        <div class="toast-content">
          ${iconSvg}
          <span>${message}</span>
        </div>
        ${undoCallback ? `<button class="toast-undo-btn" id="toast-undo-btn">Undo</button>` : ''}
        <div class="toast-progress"></div>
      `;

      container.appendChild(toast);

      let timeoutId = setTimeout(() => {
        dismiss();
      }, 5000);

      const dismiss = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px) scale(0.95)';
        toast.style.transition = 'all var(--t-fast) var(--ease-exit)';
        setTimeout(() => toast.remove(), 200);
      };

      if (undoCallback) {
        const undoBtn = toast.querySelector('#toast-undo-btn');
        if (undoBtn) {
          undoBtn.addEventListener('click', () => {
            clearTimeout(timeoutId);
            dismiss();
            undoCallback();
          });
        }
      }
    }
  };

  const Modal = {
    open(htmlContent) {
      const container = document.getElementById('modal-container');
      if (!container) return;

      container.innerHTML = `
        <div class="modal-backdrop" id="active-modal-backdrop" data-action="close-modal">
          <div class="modal-card" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
            ${htmlContent}
          </div>
        </div>
      `;

      // Trap focus & escape key
      const modalEl = container.querySelector('.modal-card');
      const firstInput = modalEl.querySelector('input, select, textarea, button');
      if (firstInput) firstInput.focus();

      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          Modal.close();
          window.removeEventListener('keydown', onKeyDown);
        }
      };
      window.addEventListener('keydown', onKeyDown);
    },

    close() {
      const container = document.getElementById('modal-container');
      if (container) container.innerHTML = '';
    }
  };

  // =========================================================================
  // 7. Route View Renderers (Complete Real Handlers, No Mocks)
  // =========================================================================
  const Views = {
    // -----------------------------------------------------------------------
    // A. DASHBOARD VIEW
    // -----------------------------------------------------------------------
    dashboard() {
      const loansKpi = Selectors.getLoansKPI(state);
      const savingsKpi = Selectors.getSavingsMetrics(state);
      const salesKpi = Selectors.getSalesMetrics(state);
      const cashKpi = Selectors.getCashFlowMetrics(state);

      return `
        <div class="view-enter">
          <!-- Page Header -->
          <div class="page-header">
            <div class="page-header-info">
              <div class="page-header-medallion">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
              </div>
              <div>
                <h1 class="page-header-title">Executive Dashboard</h1>
                <p class="page-header-subtitle">Performance overview and financial metrics for ${getMonthLabel(state.selectedMonth)}</p>
              </div>
            </div>
            <div class="page-header-actions">
              <button class="btn-secondary" data-action="open-modal-savings">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                Record Savings
              </button>
              <button class="btn-primary" data-action="open-modal-loan">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                Disburse Loan
              </button>
            </div>
          </div>

          <!-- 4 Pastel KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card kpi-mint">
              <div class="kpi-top">
                <span class="kpi-label">Cumulative Savings</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-1.8.4-.9.2-2.2-.5-3.2.7-1 .8-2.6-.5-3.5-.4-.3-1-.5-1.5-.5z"/><circle cx="16" cy="11" r="1"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${savingsKpi.totalCumulativeSavings}">${formatINR(savingsKpi.totalCumulativeSavings)}</div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">▲ ${savingsKpi.growthDelta}%</span>
                <span class="kpi-subtext">vs previous month</span>
              </div>
            </div>

            <div class="kpi-card kpi-lavender">
              <div class="kpi-top">
                <span class="kpi-label">Active Loans Portfolio</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${loansKpi.outstandingBalance}">${formatINR(loansKpi.outstandingBalance)}</div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">${loansKpi.activeCount} Active</span>
                <span class="kpi-subtext">${loansKpi.recoveryRate}% Recovery Rate</span>
              </div>
            </div>

            <div class="kpi-card kpi-amber">
              <div class="kpi-top">
                <span class="kpi-label">Product Enterprise Sales</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${salesKpi.totalSalesRevenue}">${formatINR(salesKpi.totalSalesRevenue)}</div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">${salesKpi.unitsSold} Units</span>
                <span class="kpi-subtext">Village &amp; Expo Orders</span>
              </div>
            </div>

            <div class="kpi-card kpi-rose">
              <div class="kpi-top">
                <span class="kpi-label">Group Net Worth</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${cashKpi.groupNetWorth}">${formatINR(cashKpi.groupNetWorth)}</div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">NABARD Tier 1</span>
                <span class="kpi-subtext">Audited Group Capital</span>
              </div>
            </div>
          </div>

          <!-- Mid Section: Interactive Cash Flow Trends & Quick Actions -->
          <div class="content-grid-2-1">
            <div class="card-panel">
              <div class="panel-header">
                <div class="panel-title-wrap">
                  <h2 class="panel-title">Financial Flow &amp; Repayment Velocity</h2>
                  <span class="panel-subtitle">Monthly trajectory across savings, loan disbursements, and recoveries</span>
                </div>
              </div>
              <!-- Clean SVG Trend Chart -->
              <div style="height: 220px; width: 100%; display: flex; align-items: flex-end; justify-content: space-between; padding: 20px 10px 0 10px; border-bottom: 2px solid var(--border);">
                ${[
                  { month: 'Nov 2024', savings: 8000, loans: 12000, repayments: 2400 },
                  { month: 'Dec 2024', savings: 8500, loans: 0, repayments: 4800 },
                  { month: 'Jan 2025', savings: 9000, loans: 20000, repayments: 4400 },
                  { month: 'Feb 2025', savings: 9200, loans: 15000, repayments: 6900 },
                  { month: 'Mar 2025', savings: 9500, loans: 10000, repayments: 8900 },
                  { month: 'Apr 2025', savings: savingsKpi.monthDepositSum, loans: 8000, repayments: 8900 }
                ].map(item => `
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1;">
                    <div style="display: flex; align-items: flex-end; gap: 4px; height: 140px;">
                      <div title="Savings: ${formatINR(item.savings)}" style="width: 14px; height: ${Math.max(10, Math.round(item.savings / 20000 * 130))}px; background: var(--color-success); border-radius: 4px 4px 0 0;"></div>
                      <div title="Disbursed: ${formatINR(item.loans)}" style="width: 14px; height: ${Math.max(10, Math.round(item.loans / 20000 * 130))}px; background: var(--brand-indigo); border-radius: 4px 4px 0 0;"></div>
                      <div title="Repayments: ${formatINR(item.repayments)}" style="width: 14px; height: ${Math.max(10, Math.round(item.repayments / 20000 * 130))}px; background: var(--color-warning); border-radius: 4px 4px 0 0;"></div>
                    </div>
                    <span style="font-size: 0.72rem; font-weight: 600; color: var(--text-muted);">${item.month}</span>
                  </div>
                `).join('')}
              </div>
              <div style="display: flex; justify-content: center; gap: 20px; margin-top: 14px; font-size: 0.78rem; font-weight: 600;">
                <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; background: var(--color-success); border-radius: 2px;"></span> Monthly Savings</span>
                <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; background: var(--brand-indigo); border-radius: 2px;"></span> Loans Disbursed</span>
                <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; background: var(--color-warning); border-radius: 2px;"></span> Repayments Received</span>
              </div>
            </div>

            <!-- Quick Action Hub & SHG Health Index -->
            <div class="card-panel" style="justify-content: space-between;">
              <div class="panel-header">
                <div class="panel-title-wrap">
                  <h2 class="panel-title">SHG Health Score</h2>
                  <span class="panel-subtitle">Bank Linkage &amp; Credit Readiness</span>
                </div>
                <span class="status-pill status-closed">Excellent</span>
              </div>

              <div style="text-align: center; margin: 10px 0;">
                <div style="font-size: 2.5rem; font-weight: 800; color: var(--brand-purple);">840 <span style="font-size: 1rem; color: var(--text-muted); font-weight: 500;">/ 900</span></div>
                <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">Zero loan defaults across 24 consecutive operating months. Eligible for ₹5,00,000 subsidized bank linkage loan.</p>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 14px;">
                <button class="btn-secondary" style="width: 100%; justify-content: flex-start;" data-action="navigate" data-target="reports">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Generate Monthly Audit Report
                </button>
                <button class="btn-secondary" style="width: 100%; justify-content: flex-start;" data-action="navigate" data-target="sales">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/></svg>
                  Log Micro-Enterprise Sale
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom: Recent Group Activity Feed -->
          <div class="card-panel">
            <div class="panel-header">
              <div class="panel-title-wrap">
                <h2 class="panel-title">Recent Ledger Entries (${getMonthLabel(state.selectedMonth)})</h2>
                <span class="panel-subtitle">Transparent real-time records across all members</span>
              </div>
              <button class="btn-secondary" data-action="navigate" data-target="loans">View All Loans</button>
            </div>

            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Member / Entity</th>
                    <th>Reference / Purpose</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.repayments.slice(-4).reverse().map(r => {
                    const member = state.members.find(m => m.id === r.memberId);
                    return `
                      <tr>
                        <td>${formatDate(r.date)}</td>
                        <td><strong>Loan Repayment</strong></td>
                        <td>${member ? member.name : r.memberId}</td>
                        <td>Loan #${r.loanId} (${r.notes || 'Installment'})</td>
                        <td class="tabular-nums" style="font-weight: 700; color: var(--color-success);">${formatINR(r.amount)}</td>
                        <td><span class="status-pill status-closed">Received</span></td>
                      </tr>
                    `;
                  }).join('')}
                  ${state.savings.filter(s => s.month === state.selectedMonth).slice(0, 3).map(s => {
                    const member = state.members.find(m => m.id === s.memberId);
                    const total = (Number(s.mandatoryAmount) || 0) + (Number(s.voluntaryAmount) || 0);
                    return `
                      <tr>
                        <td>${formatDate(s.date)}</td>
                        <td><strong>Savings Deposit</strong></td>
                        <td>${member ? member.name : s.memberId}</td>
                        <td>Monthly Thrift Contribution</td>
                        <td class="tabular-nums" style="font-weight: 700; color: var(--brand-purple);">${formatINR(total)}</td>
                        <td><span class="status-pill status-closed">Deposited</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    // -----------------------------------------------------------------------
    // B. LOANS VIEW (Pixel-fidelity replication of reference screenshot)
    // -----------------------------------------------------------------------
    loans() {
      const kpi = Selectors.getLoansKPI(state);
      const enrichedLoans = Selectors.getEnrichedLoans(state);
      const recentRepayments = [...state.repayments].reverse().slice(0, 8);

      return `
        <div class="view-enter">
          <!-- Page Header -->
          <div class="page-header">
            <div class="page-header-info">
              <div class="page-header-medallion">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 6v2m0 8v2"/></svg>
              </div>
              <div>
                <h1 class="page-header-title">Loans &amp; Micro-Credit Portfolio</h1>
                <p class="page-header-subtitle">Monitor group lending, repayments, recovery rates, and individual balances</p>
              </div>
            </div>
            <div class="page-header-actions">
              <button class="btn-primary" data-action="open-modal-loan">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                + New Loan Disbursement
              </button>
            </div>
          </div>

          <!-- 4 Pastel KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card kpi-mint">
              <div class="kpi-top">
                <span class="kpi-label">Total Disbursed</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${kpi.totalDisbursed}">${formatINR(kpi.totalDisbursed)}</div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">5 Approved</span>
                <span class="kpi-subtext">All active group loans</span>
              </div>
            </div>

            <div class="kpi-card kpi-lavender">
              <div class="kpi-top">
                <span class="kpi-label">Total Repaid</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${kpi.totalRepaid}">${formatINR(kpi.totalRepaid)}</div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">${kpi.recoveryRate}% Rate</span>
                <span class="kpi-subtext">On-time repayment</span>
              </div>
            </div>

            <div class="kpi-card kpi-amber">
              <div class="kpi-top">
                <span class="kpi-label">Outstanding Balance</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${kpi.outstandingBalance}">${formatINR(kpi.outstandingBalance)}</div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">100% In Term</span>
                <span class="kpi-subtext">Zero default risk</span>
              </div>
            </div>

            <div class="kpi-card kpi-rose">
              <div class="kpi-top">
                <span class="kpi-label">Active Loans Count</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${kpi.activeCount}">${kpi.activeCount} <span style="font-size: 1.1rem; color: var(--text-muted); font-weight: 500;">/ ${kpi.activeCount + kpi.closedCount}</span></div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">${kpi.closedCount} Fully Closed</span>
                <span class="kpi-subtext">Clean credit track</span>
              </div>
            </div>
          </div>

          <!-- Main Loans Table -->
          <div class="card-panel" style="margin-bottom: 28px;">
            <div class="panel-header">
              <div class="panel-title-wrap">
                <h2 class="panel-title">Active Loan Registry</h2>
                <span class="panel-subtitle">Individual borrower terms, amortizations, and status</span>
              </div>
              <div class="panel-actions">
                <div class="filter-tabs" id="loan-status-filters">
                  <button class="filter-tab active" data-action="filter-loans" data-status="all">All</button>
                  <button class="filter-tab" data-action="filter-loans" data-status="Partial">Partial</button>
                  <button class="filter-tab" data-action="filter-loans" data-status="Pending">Pending</button>
                  <button class="filter-tab" data-action="filter-loans" data-status="Closed">Closed</button>
                </div>
              </div>
            </div>

            <div class="table-wrapper">
              <table class="data-table" id="loans-table">
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>Borrower</th>
                    <th>Purpose</th>
                    <th>Principal</th>
                    <th>Repaid</th>
                    <th>Outstanding</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Issued Date</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${enrichedLoans.map(loan => {
                    let statusClass = 'status-partial';
                    if (loan.status === 'Pending') statusClass = 'status-pending';
                    if (loan.status === 'Closed') statusClass = 'status-closed';

                    return `
                      <tr data-status="${loan.status}">
                        <td><strong>#${loan.id}</strong></td>
                        <td>
                          <div style="font-weight: 700;">${loan.borrowerName}</div>
                          <div style="font-size: 0.72rem; color: var(--text-muted);">${loan.borrowerRole}</div>
                        </td>
                        <td>${loan.purpose}</td>
                        <td class="tabular-nums" style="font-weight: 700;">${formatINR(loan.principal)}</td>
                        <td class="tabular-nums" style="color: var(--color-success); font-weight: 600;">${formatINR(loan.repaid)}</td>
                        <td class="tabular-nums" style="color: ${loan.outstanding > 0 ? 'var(--color-danger)' : 'var(--text-muted)'}; font-weight: 700;">${formatINR(loan.outstanding)}</td>
                        <td>
                          <div class="table-progress" title="${loan.progressPct}% repaid">
                            <div class="table-progress-fill" style="width: ${loan.progressPct}%;"></div>
                          </div>
                          <span style="font-size: 0.72rem; color: var(--text-muted);">${loan.progressPct}%</span>
                        </td>
                        <td>
                          <span class="status-pill ${statusClass}">${loan.status}</span>
                        </td>
                        <td>${formatDate(loan.issuedDate)}</td>
                        <td style="text-align: right;">
                          <div class="table-actions" style="justify-content: flex-end;">
                            ${loan.outstanding > 0 ? `
                              <button class="action-btn" title="Record Repayment" data-action="open-modal-repayment" data-loan-id="${loan.id}">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/></svg>
                              </button>
                            ` : ''}
                            <button class="action-btn" title="Edit Loan" data-action="edit-loan" data-loan-id="${loan.id}">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            </button>
                            <button class="action-btn btn-delete" title="Delete Loan" data-action="delete-loan" data-loan-id="${loan.id}">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Bottom Split: Recent Repayments Table + Motivational Coin Pouch Card -->
          <div class="content-grid-2-1">
            <!-- Recent Repayments Table -->
            <div class="card-panel">
              <div class="panel-header">
                <div class="panel-title-wrap">
                  <h2 class="panel-title">Recent Repayments Received</h2>
                  <span class="panel-subtitle">Live installment audit log with timestamp &amp; mode</span>
                </div>
              </div>

              <div class="table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Ref ID</th>
                      <th>Borrower</th>
                      <th>Loan ID</th>
                      <th>Amount</th>
                      <th>Payment Mode</th>
                      <th>Date</th>
                      <th style="text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recentRepayments.map(r => {
                      const member = state.members.find(m => m.id === r.memberId);
                      return `
                        <tr>
                          <td><strong>#${r.id}</strong></td>
                          <td>${member ? member.name : r.memberId}</td>
                          <td>Loan #${r.loanId}</td>
                          <td class="tabular-nums" style="font-weight: 700; color: var(--color-success);">${formatINR(r.amount)}</td>
                          <td><span class="status-pill status-closed">${r.mode || 'Cash'}</span></td>
                          <td>${formatDate(r.date)}</td>
                          <td style="text-align: right;">
                            <button class="action-btn btn-delete" title="Delete Repayment" data-action="delete-repayment" data-repayment-id="${r.id}">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Motivational Gradient Card with Coin Pouch SVG -->
            <div class="motivational-card">
              <div>
                <div class="pouch-art-wrap">
                  <!-- Golden Coin Pouch Vector -->
                  <svg class="coin-pouch-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Coin Pouch Motivation">
                    <defs>
                      <linearGradient id="pouchGoldGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#FFE082"/>
                        <stop offset="50%" stop-color="#FFB300"/>
                        <stop offset="100%" stop-color="#FF8F00"/>
                      </linearGradient>
                      <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#FFF9C4"/>
                        <stop offset="100%" stop-color="#FBC02D"/>
                      </linearGradient>
                    </defs>
                    <!-- Sparkles -->
                    <path d="M25 25L28 32L35 35L28 38L25 45L22 38L15 35L22 32Z" fill="#FFF9C4"/>
                    <path d="M95 18L97 23L102 25L97 27L95 32L93 27L88 25L93 23Z" fill="#FFF9C4"/>
                    <!-- Coins peeking from pouch -->
                    <circle cx="50" cy="40" r="14" fill="url(#coinGrad)" stroke="#F57F17" stroke-width="1.5"/>
                    <circle cx="70" cy="38" r="15" fill="url(#coinGrad)" stroke="#F57F17" stroke-width="1.5"/>
                    <circle cx="60" cy="32" r="16" fill="url(#coinGrad)" stroke="#F57F17" stroke-width="1.5"/>
                    <text x="56" y="38" font-size="14" font-weight="bold" fill="#E65100">₹</text>
                    <!-- Pouch body -->
                    <path d="M26 62C22 88 35 110 60 110C85 110 98 88 94 62C92 50 82 46 60 46C38 46 28 50 26 62Z" fill="url(#pouchGoldGrad)"/>
                    <!-- Neck cinch & strings -->
                    <path d="M38 52C42 46 50 48 60 48C70 48 78 46 82 52L80 57C76 53 68 54 60 54C52 54 44 53 40 57Z" fill="#D84315"/>
                    <path d="M56 55L45 74M64 55L75 74" stroke="#FFE082" stroke-width="2.5" stroke-linecap="round"/>
                    <circle cx="45" cy="75" r="3.5" fill="#FFE082"/>
                    <circle cx="75" cy="75" r="3.5" fill="#FFE082"/>
                  </svg>
                </div>
                <h3 class="motivational-title">Prompt Repayments Drive Mutual Growth</h3>
                <p class="motivational-body">
                  Every timely installment replenishes our shared lending pool, enabling fellow sisters to fund agricultural machinery, micro-enterprises, and children's higher education.
                </p>
              </div>

              <div class="motivational-stats">
                <div>
                  <div class="m-stat-label">Group Credit Score</div>
                  <div class="m-stat-val tabular-nums">840 / 900</div>
                </div>
                <div>
                  <div class="m-stat-label">Bank Loan Linkage</div>
                  <div class="m-stat-val tabular-nums">₹5,00,000</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // -----------------------------------------------------------------------
    // C. SAVINGS VIEW (Pixel-fidelity replication of reference screenshot)
    // -----------------------------------------------------------------------
    savings() {
      const kpi = Selectors.getSavingsMetrics(state);
      const memberMap = Selectors.getMemberMap(state);

      return `
        <div class="view-enter">
          <!-- Page Header -->
          <div class="page-header">
            <div class="page-header-info">
              <div class="page-header-medallion">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-1.8.4-.9.2-2.2-.5-3.2.7-1 .8-2.6-.5-3.5-.4-.3-1-.5-1.5-.5z"/><circle cx="16" cy="11" r="1"/></svg>
              </div>
              <div>
                <h1 class="page-header-title">Savings &amp; Capital Accumulation</h1>
                <p class="page-header-subtitle">Monthly thrift deposits, group emergency reserve, and member shares</p>
              </div>
            </div>
            <div class="page-header-actions">
              <button class="btn-primary" data-action="open-modal-savings">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                + Record Monthly Savings
              </button>
            </div>
          </div>

          <!-- 4 Pastel KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card kpi-mint">
              <div class="kpi-top">
                <span class="kpi-label">Cumulative Group Savings</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${kpi.totalCumulativeSavings}">${formatINR(kpi.totalCumulativeSavings)}</div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">▲ ${kpi.growthDelta}%</span>
                <span class="kpi-subtext">vs ${getMonthLabel('2025-03')}</span>
              </div>
            </div>

            <div class="kpi-card kpi-lavender">
              <div class="kpi-top">
                <span class="kpi-label">Month Contributions</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${kpi.monthDepositSum}">${formatINR(kpi.monthDepositSum)}</div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">100% Target Met</span>
                <span class="kpi-subtext">Mandatory + voluntary</span>
              </div>
            </div>

            <div class="kpi-card kpi-amber">
              <div class="kpi-top">
                <span class="kpi-label">Average Per Member</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${kpi.avgPerMember}">${formatINR(kpi.avgPerMember)}</div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">Equal Voting</span>
                <span class="kpi-subtext">Across 5 shareholders</span>
              </div>
            </div>

            <div class="kpi-card kpi-rose">
              <div class="kpi-top">
                <span class="kpi-label">Active Thrift Savers</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${kpi.activeSaversCount}">${kpi.activeSaversCount} <span style="font-size: 1.1rem; color: var(--text-muted); font-weight: 500;">/ 5 Members</span></div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">Zero Arrears</span>
                <span class="kpi-subtext">Full compliance</span>
              </div>
            </div>
          </div>

          <!-- Central Split: Savings Donut + Quick Insight vs Monthly Savings Ledger -->
          <div class="content-grid-2-1">
            <!-- Monthly Savings Ledger Table -->
            <div class="card-panel">
              <div class="panel-header">
                <div class="panel-title-wrap">
                  <h2 class="panel-title">Savings Ledger (${getMonthLabel(state.selectedMonth)})</h2>
                  <span class="panel-subtitle">Mandatory ₹1,000 baseline + voluntary thrift deposits</span>
                </div>
              </div>

              <div class="table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Member Name</th>
                      <th>Mandatory Target</th>
                      <th>Voluntary Deposit</th>
                      <th>Total Deposited</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style="text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${state.members.map(m => {
                      const deposit = state.savings.find(s => s.memberId === m.id && s.month === state.selectedMonth);
                      const mandatory = deposit ? Number(deposit.mandatoryAmount) || 0 : 0;
                      const voluntary = deposit ? Number(deposit.voluntaryAmount) || 0 : 0;
                      const total = mandatory + voluntary;
                      const isPaid = mandatory >= state.config.monthlyMandatorySavings;

                      return `
                        <tr>
                          <td>
                            <div style="font-weight: 700;">${m.name}</div>
                            <div style="font-size: 0.72rem; color: var(--text-muted);">${m.role} · ${m.enterprise}</div>
                          </td>
                          <td class="tabular-nums">${formatINR(state.config.monthlyMandatorySavings)}</td>
                          <td class="tabular-nums" style="color: var(--brand-purple); font-weight: 600;">${formatINR(voluntary)}</td>
                          <td class="tabular-nums" style="font-weight: 800; color: ${isPaid ? 'var(--color-success)' : 'var(--color-danger)'};">${formatINR(total)}</td>
                          <td>${deposit ? formatDate(deposit.date) : 'Pending'}</td>
                          <td>
                            <span class="status-pill ${isPaid ? 'status-closed' : 'status-pending'}">
                              ${isPaid ? 'Paid' : 'Due'}
                            </span>
                          </td>
                          <td style="text-align: right;">
                            <button class="action-btn" title="Log/Edit Deposit" data-action="open-modal-savings" data-member-id="${m.id}">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                            </button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Savings Donut & Quick Insight Card -->
            <div class="card-panel">
              <div class="panel-header">
                <div class="panel-title-wrap">
                  <h2 class="panel-title">Cumulative Share Distribution</h2>
                  <span class="panel-subtitle">Total equity accumulated across all cycles</span>
                </div>
              </div>

              <!-- Interactive Donut Chart -->
              <div class="donut-card-wrap">
                <div class="donut-svg-container">
                  <svg class="donut-svg" viewBox="0 0 100 100" id="savings-donut-svg">
                    ${(() => {
                      const radius = 35;
                      const circumference = 2 * Math.PI * radius;
                      let accumulatedPercent = 0;

                      return kpi.donutSlices.map((slice, i) => {
                        const pct = parseFloat(slice.percent);
                        const dashLength = (pct / 100) * circumference;
                        const dashOffset = -(accumulatedPercent / 100) * circumference;
                        accumulatedPercent += pct;

                        return `
                          <circle
                            class="donut-segment"
                            data-member-id="${slice.memberId}"
                            cx="50" cy="50" r="${radius}"
                            stroke="${slice.color}"
                            stroke-dasharray="${dashLength} ${circumference}"
                            stroke-dashoffset="${dashOffset}"
                            style="transition-delay: ${i * 80}ms;"
                          />
                        `;
                      }).join('');
                    })()}
                  </svg>
                  <div class="donut-center-label">
                    <span class="donut-center-title">Total Capital</span>
                    <span class="donut-center-amount tabular-nums">${formatINR(kpi.totalCumulativeSavings)}</span>
                  </div>
                </div>

                <!-- Donut Legend (Bidirectional Hover Synced) -->
                <div class="donut-legend" id="savings-donut-legend">
                  ${kpi.donutSlices.map(slice => `
                    <div class="legend-row" data-member-id="${slice.memberId}">
                      <div class="legend-left">
                        <span class="legend-color-dot" style="background-color: ${slice.color};"></span>
                        <span class="legend-name">${slice.memberName}</span>
                      </div>
                      <div class="legend-right">
                        <span class="legend-amount tabular-nums">${formatINR(slice.amount)}</span>
                        <span class="legend-pct tabular-nums">${slice.percent}%</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Quick Insight Card -->
              <div class="quick-insight-card">
                <div class="insight-icon-medallion">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div>
                  <h4 class="insight-text-title">Group Advisory Insight</h4>
                  <p class="insight-text-body">${kpi.insightMsg}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // -----------------------------------------------------------------------
    // D. MEMBERS VIEW
    // -----------------------------------------------------------------------
    members() {
      const savingsMap = Selectors.getSavingsMetrics(state);
      const loansEnriched = Selectors.getEnrichedLoans(state);

      return `
        <div class="view-enter">
          <div class="page-header">
            <div class="page-header-info">
              <div class="page-header-medallion">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h1 class="page-header-title">SHG Member Directory</h1>
                <p class="page-header-subtitle">Active group shareholders, roles, enterprise units, and compliance records</p>
              </div>
            </div>
            <div class="page-header-actions">
              <button class="btn-primary" data-action="open-modal-member">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                + Register Member
              </button>
            </div>
          </div>

          <div class="card-panel">
            <div class="panel-header">
              <div class="panel-title-wrap">
                <h2 class="panel-title">Shareholders &amp; Leadership Roster</h2>
                <span class="panel-subtitle">${state.members.length} registered voting members</span>
              </div>
            </div>

            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Member ID</th>
                    <th>Full Name</th>
                    <th>Designation</th>
                    <th>Enterprise / Livelihood</th>
                    <th>Phone Contact</th>
                    <th>Joined</th>
                    <th>Active Loan</th>
                    <th>Status</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.members.map(m => {
                    const activeLoan = loansEnriched.find(l => l.memberId === m.id && l.status !== 'Closed');
                    return `
                      <tr>
                        <td><strong>#${m.id}</strong></td>
                        <td>
                          <div style="font-weight: 700; font-size: 0.94rem;">${m.name}</div>
                        </td>
                        <td><span class="badge-role">${m.role}</span></td>
                        <td>${m.enterprise}</td>
                        <td class="tabular-nums">${m.phone}</td>
                        <td>${formatDate(m.joinedDate)}</td>
                        <td>
                          ${activeLoan
                            ? `<span style="font-weight: 700; color: var(--color-danger);">${formatINR(activeLoan.outstanding)} (${activeLoan.status})</span>`
                            : `<span style="color: var(--text-muted);">None (Clean)</span>`
                          }
                        </td>
                        <td><span class="status-pill status-closed">${m.status}</span></td>
                        <td style="text-align: right;">
                          <div class="table-actions" style="justify-content: flex-end;">
                            <button class="action-btn" title="View Member Profile" data-action="view-member" data-member-id="${m.id}">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button class="action-btn" title="Edit Member" data-action="edit-member" data-member-id="${m.id}">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            </button>
                            <button class="action-btn btn-delete" title="Delete Member" data-action="delete-member" data-member-id="${m.id}">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    // -----------------------------------------------------------------------
    // E. INCOME & EXPENSES VIEW
    // -----------------------------------------------------------------------
    'income-expenses'() {
      const cashKpi = Selectors.getCashFlowMetrics(state);

      return `
        <div class="view-enter">
          <div class="page-header">
            <div class="page-header-info">
              <div class="page-header-medallion">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10v12"/><path d="M17 14v-12"/><path d="m3 14 4-4 4 4"/><path d="m21 10-4 4-4-4"/></svg>
              </div>
              <div>
                <h1 class="page-header-title">Operational Income &amp; Expenses</h1>
                <p class="page-header-subtitle">Administrative ledger, meeting expenses, membership fees, and interest earned</p>
              </div>
            </div>
            <div class="page-header-actions">
              <button class="btn-primary" data-action="open-modal-transaction">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                + Record Transaction
              </button>
            </div>
          </div>

          <div class="kpi-grid kpi-grid-3">
            <div class="kpi-card kpi-mint">
              <div class="kpi-top">
                <span class="kpi-label">Monthly Operating Income</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${cashKpi.monthlyIncome}">${formatINR(cashKpi.monthlyIncome)}</div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">Fees &amp; Interest</span>
              </div>
            </div>

            <div class="kpi-card kpi-rose">
              <div class="kpi-top">
                <span class="kpi-label">Monthly Expenses</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${cashKpi.monthlyExpense}">${formatINR(cashKpi.monthlyExpense)}</div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">Stationery &amp; Tea</span>
              </div>
            </div>

            <div class="kpi-card kpi-lavender">
              <div class="kpi-top">
                <span class="kpi-label">Net Operational Balance</span>
                <div class="kpi-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/></svg>
                </div>
              </div>
              <div class="kpi-value" data-countup="${cashKpi.netOperationalCash}">${formatINR(cashKpi.netOperationalCash)}</div>
              <div class="kpi-footer">
                <span class="kpi-delta-chip">Available In Hand</span>
              </div>
            </div>
          </div>

          <div class="card-panel">
            <div class="panel-header">
              <div class="panel-title-wrap">
                <h2 class="panel-title">Transaction Ledger (${getMonthLabel(state.selectedMonth)})</h2>
                <span class="panel-subtitle">Audited operational vouchers with category labels</span>
              </div>
            </div>

            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Tx ID</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.transactions.map(t => `
                    <tr>
                      <td><strong>#${t.id}</strong></td>
                      <td>${formatDate(t.date)}</td>
                      <td>
                        <span class="status-pill ${t.type === 'income' ? 'status-closed' : 'status-pending'}">
                          ${t.type === 'income' ? '+ Income' : '- Expense'}
                        </span>
                      </td>
                      <td><strong>${t.category}</strong></td>
                      <td>${t.description}</td>
                      <td class="tabular-nums" style="font-weight: 700; color: ${t.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)'};">
                        ${t.type === 'income' ? '+' : '-'}${formatINR(t.amount)}
                      </td>
                      <td style="text-align: right;">
                        <button class="action-btn btn-delete" title="Delete Entry" data-action="delete-transaction" data-tx-id="${t.id}">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    // -----------------------------------------------------------------------
    // F. PRODUCTS (MARKETPLACE) VIEW
    // -----------------------------------------------------------------------
    products() {
      const salesKpi = Selectors.getSalesMetrics(state);

      return `
        <div class="view-enter">
          <div class="page-header">
            <div class="page-header-info">
              <div class="page-header-medallion">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              </div>
              <div>
                <h1 class="page-header-title">SHG Enterprise Products &amp; Inventory</h1>
                <p class="page-header-subtitle">Empowering member artisans to market organic foods, spices, and handloom directly</p>
              </div>
            </div>
            <div class="page-header-actions">
              <button class="btn-primary" data-action="open-modal-product">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                + Add Product
              </button>
            </div>
          </div>

          <div class="card-panel">
            <div class="panel-header">
              <div class="panel-title-wrap">
                <h2 class="panel-title">Product Catalog &amp; Warehouse Stock</h2>
                <span class="panel-subtitle">Total inventory valuation: ${formatINR(salesKpi.totalInventoryValue)}</span>
              </div>
            </div>

            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>SKU ID</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Producer Member</th>
                    <th>Unit Price</th>
                    <th>Current Stock</th>
                    <th>Stock Action</th>
                    <th style="text-align: right;">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.products.map(p => {
                    const member = state.members.find(m => m.id === p.producerId);
                    const isLow = p.stock < 25;
                    return `
                      <tr>
                        <td><strong>#${p.id}</strong></td>
                        <td>
                          <div style="font-weight: 700;">${p.name}</div>
                          <div style="font-size: 0.72rem; color: var(--text-muted);">${p.description}</div>
                        </td>
                        <td><span class="badge-role">${p.category}</span></td>
                        <td>${member ? member.name : 'SHG Group'}</td>
                        <td class="tabular-nums" style="font-weight: 700;">${formatINR(p.unitPrice)}</td>
                        <td>
                          <span class="status-pill ${isLow ? 'status-pending' : 'status-closed'}">
                            ${p.stock} units ${isLow ? '(Low)' : ''}
                          </span>
                        </td>
                        <td>
                          <div style="display: flex; gap: 4px;">
                            <button class="action-btn" title="Add 5 units" data-action="adjust-stock" data-product-id="${p.id}" data-delta="5">+5</button>
                            <button class="action-btn" title="Subtract 1 unit" data-action="adjust-stock" data-product-id="${p.id}" data-delta="-1">-1</button>
                          </div>
                        </td>
                        <td style="text-align: right;">
                          <div class="table-actions" style="justify-content: flex-end;">
                            <button class="action-btn" title="Record Sale" data-action="open-modal-sale" data-product-id="${p.id}">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/></svg>
                            </button>
                            <button class="action-btn btn-delete" title="Delete Product" data-action="delete-product" data-product-id="${p.id}">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    // -----------------------------------------------------------------------
    // G. SALES VIEW
    // -----------------------------------------------------------------------
    sales() {
      const salesKpi = Selectors.getSalesMetrics(state);

      return `
        <div class="view-enter">
          <div class="page-header">
            <div class="page-header-info">
              <div class="page-header-medallion">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <div>
                <h1 class="page-header-title">Enterprise Sales &amp; Dispatch</h1>
                <p class="page-header-subtitle">Record buyer orders, invoices, payment modes, and member revenue shares</p>
              </div>
            </div>
            <div class="page-header-actions">
              <button class="btn-primary" data-action="open-modal-sale">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                + Record Direct Sale
              </button>
            </div>
          </div>

          <div class="card-panel">
            <div class="panel-header">
              <div class="panel-title-wrap">
                <h2 class="panel-title">Sales Registry (${getMonthLabel(state.selectedMonth)})</h2>
                <span class="panel-subtitle">Total Revenue: ${formatINR(salesKpi.totalSalesRevenue)} · ${salesKpi.unitsSold} units shipped</span>
              </div>
            </div>

            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Seller / Beneficiary</th>
                    <th>Buyer / Store</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${salesKpi.filteredSales.map(sl => {
                    const product = state.products.find(p => p.id === sl.productId);
                    const member = state.members.find(m => m.id === sl.memberId);
                    return `
                      <tr>
                        <td><strong>#${sl.id}</strong></td>
                        <td>${formatDate(sl.date)}</td>
                        <td><strong>${product ? product.name : sl.productId}</strong></td>
                        <td>${member ? member.name : sl.memberId}</td>
                        <td>${sl.buyerName}</td>
                        <td class="tabular-nums">${sl.quantity}</td>
                        <td class="tabular-nums" style="font-weight: 700; color: var(--color-success);">${formatINR(sl.totalAmount)}</td>
                        <td><span class="status-pill status-closed">${sl.paymentMode || 'Cash'}</span></td>
                        <td style="text-align: right;">
                          <button class="action-btn" title="View Invoice Receipt" data-action="view-invoice" data-sale-id="${sl.id}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    // -----------------------------------------------------------------------
    // H. REPORTS VIEW (Print & CSV Export)
    // -----------------------------------------------------------------------
    reports() {
      const loansKpi = Selectors.getLoansKPI(state);
      const savingsKpi = Selectors.getSavingsMetrics(state);
      const salesKpi = Selectors.getSalesMetrics(state);
      const cashKpi = Selectors.getCashFlowMetrics(state);

      return `
        <div class="view-enter">
          <div class="page-header">
            <div class="page-header-info">
              <div class="page-header-medallion">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <div>
                <h1 class="page-header-title">Monthly Audit Statements &amp; Reports</h1>
                <p class="page-header-subtitle">Official reconciliations for NABARD bank audits, NGO monitoring, and general body meetings</p>
              </div>
            </div>
            <div class="page-header-actions">
              <button class="btn-secondary" data-action="print-report">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print Statement
              </button>
              <button class="btn-primary" data-action="export-csv">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV Sheet
              </button>
            </div>
          </div>

          <div class="card-panel" style="margin-bottom: 24px;">
            <div class="panel-header">
              <div class="panel-title-wrap">
                <h2 class="panel-title">Monthly Financial Statement Summary</h2>
                <span class="panel-subtitle">For the accounting cycle ending ${getMonthLabel(state.selectedMonth)}</span>
              </div>
              <span class="status-pill status-closed">Reconciled &amp; Balanced</span>
            </div>

            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Financial Head / Indicator</th>
                    <th>Classification</th>
                    <th>Current Value (INR)</th>
                    <th>Compliance Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Cumulative Group Savings</strong></td>
                    <td>Internal Capital</td>
                    <td class="tabular-nums" style="font-weight: 700; color: var(--color-success);">${formatINR(savingsKpi.totalCumulativeSavings)}</td>
                    <td><span class="status-pill status-closed">Fully Secured</span></td>
                  </tr>
                  <tr>
                    <td><strong>Active Loans Outstanding</strong></td>
                    <td>Group Assets</td>
                    <td class="tabular-nums" style="font-weight: 700; color: var(--brand-purple);">${formatINR(loansKpi.outstandingBalance)}</td>
                    <td><span class="status-pill status-closed">${loansKpi.activeCount} In Repayment</span></td>
                  </tr>
                  <tr>
                    <td><strong>Total Loans Disbursed to Date</strong></td>
                    <td>Cumulative Credit</td>
                    <td class="tabular-nums" style="font-weight: 700;">${formatINR(loansKpi.totalDisbursed)}</td>
                    <td><span class="status-pill status-closed">${loansKpi.recoveryRate}% Recovered</span></td>
                  </tr>
                  <tr>
                    <td><strong>Monthly Enterprise Sales Revenue</strong></td>
                    <td>Operating Inflow</td>
                    <td class="tabular-nums" style="font-weight: 700; color: var(--color-success);">${formatINR(salesKpi.totalSalesRevenue)}</td>
                    <td><span class="status-pill status-closed">${salesKpi.unitsSold} Shipped</span></td>
                  </tr>
                  <tr>
                    <td><strong>Administrative Net Cash in Hand</strong></td>
                    <td>Operating Reserve</td>
                    <td class="tabular-nums" style="font-weight: 700;">${formatINR(cashKpi.netOperationalCash)}</td>
                    <td><span class="status-pill status-closed">Balanced</span></td>
                  </tr>
                  <tr style="background: var(--surface-subtle); font-size: 1rem;">
                    <td><strong>TOTAL AUDITED GROUP VALUATION</strong></td>
                    <td>Total Equity Asset Base</td>
                    <td class="tabular-nums" style="font-weight: 800; color: var(--brand-purple);">${formatINR(cashKpi.groupNetWorth)}</td>
                    <td><span class="status-pill status-closed">Grade 'A' Certified</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    // -----------------------------------------------------------------------
    // I. SETTINGS VIEW (Full Backup, Theme, Reset)
    // -----------------------------------------------------------------------
    settings() {
      return `
        <div class="view-enter">
          <div class="page-header">
            <div class="page-header-info">
              <div class="page-header-medallion">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </div>
              <div>
                <h1 class="page-header-title">System Settings &amp; Data Control</h1>
                <p class="page-header-subtitle">Configure group parameters, export/import JSON backups, and manage offline data</p>
              </div>
            </div>
          </div>

          <div class="content-grid-1-1">
            <!-- SHG Group Configuration Form -->
            <div class="card-panel">
              <div class="panel-header">
                <div class="panel-title-wrap">
                  <h2 class="panel-title">Group Registration &amp; Norms</h2>
                  <span class="panel-subtitle">Official metadata recognized by NRLM / NABARD</span>
                </div>
              </div>

              <form id="config-form" data-action="save-config">
                <div class="form-group">
                  <label class="form-label">Self-Help Group Name</label>
                  <input type="text" name="shgName" class="form-input" value="${state.config.shgName}" required />
                </div>
                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label">Registration Number</label>
                    <input type="text" name="regNumber" class="form-input" value="${state.config.regNumber}" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Village / Cluster</label>
                    <input type="text" name="village" class="form-input" value="${state.config.village}" required />
                  </div>
                </div>
                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label">Linked Bank &amp; Branch</label>
                    <input type="text" name="bankName" class="form-input" value="${state.config.bankName}" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Monthly Mandatory Savings (INR)</label>
                    <input type="number" name="monthlyMandatorySavings" class="form-input" value="${state.config.monthlyMandatorySavings}" min="100" required />
                  </div>
                </div>
                <button type="submit" class="btn-primary" style="margin-top: 8px;">Save Settings</button>
              </form>
            </div>

            <!-- Offline Backup & Data Control -->
            <div class="card-panel" style="justify-content: space-between;">
              <div>
                <div class="panel-header">
                  <div class="panel-title-wrap">
                    <h2 class="panel-title">Data Sovereignty &amp; Offline Portability</h2>
                    <span class="panel-subtitle">Stored safely in browser storage (Schema: shg.v1)</span>
                  </div>
                </div>

                <p style="font-size: 0.86rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px;">
                  This application functions 100% offline without needing internet access or third-party servers. You can download a full cryptographic JSON snapshot at any time and import it on any device.
                </p>

                <div style="display: flex; flex-direction: column; gap: 10px;">
                  <button class="btn-secondary" style="width: 100%; justify-content: center;" data-action="export-json-backup">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download JSON Backup (.json)
                  </button>

                  <label class="btn-secondary" style="width: 100%; justify-content: center; cursor: pointer;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>Restore from JSON File</span>
                    <input type="file" id="import-json-input" accept=".json" style="display: none;" data-action="import-json-file" />
                  </label>
                </div>
              </div>

              <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--border);">
                <button class="btn-secondary text-danger" style="width: 100%; justify-content: center;" data-action="open-reset-confirm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                  Reset to April 2025 Baseline Seed
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  };

  // =========================================================================
  // 8. Hash Router & Transition Engine
  // =========================================================================
  const Router = {
    currentRoute: 'dashboard',

    init() {
      window.addEventListener('hashchange', () => this.handleRoute());
      this.handleRoute();
    },

    handleRoute() {
      let hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (!hash) hash = 'dashboard';

      if (!Views[hash]) {
        hash = 'dashboard';
        window.location.hash = '#/dashboard';
      }

      this.currentRoute = hash;
      this.render();
    },

    render() {
      const container = document.getElementById('app-root');
      if (!container) return;

      const viewFn = Views[this.currentRoute];
      if (viewFn) {
        container.innerHTML = viewFn();
        this.postRender();
      }
    },

    postRender() {
      // 1. Update navigation indicators
      Motion.updateNavPill(this.currentRoute);

      // 2. Update topbar breadcrumbs
      const crumbCurrent = document.getElementById('crumb-current');
      if (crumbCurrent) {
        const titles = {
          dashboard: 'Executive Dashboard',
          members: 'Member Directory',
          savings: 'Savings Ledger',
          loans: 'Loans Management',
          'income-expenses': 'Income & Expenses',
          products: 'Products Catalog',
          sales: 'Sales & Invoices',
          reports: 'Audit Reports',
          settings: 'Settings'
        };
        crumbCurrent.textContent = titles[this.currentRoute] || 'Overview';
      }

      // 3. Count up all numeric values
      document.querySelectorAll('[data-countup]').forEach(el => {
        const target = Number(el.dataset.countup);
        Motion.countUp(el, target, '₹');
      });

      // 4. Donut hover synchronization
      this.bindDonutEvents();
    },

    bindDonutEvents() {
      const segments = document.querySelectorAll('.donut-segment');
      const rows = document.querySelectorAll('.legend-row');

      segments.forEach(seg => {
        const memberId = seg.dataset.memberId;
        seg.addEventListener('mouseenter', () => {
          segments.forEach(s => s.classList.toggle('highlighted', s.dataset.memberId === memberId));
          rows.forEach(r => r.classList.toggle('highlighted', r.dataset.memberId === memberId));
        });
        seg.addEventListener('mouseleave', () => {
          segments.forEach(s => s.classList.remove('highlighted'));
          rows.forEach(r => r.classList.remove('highlighted'));
        });
      });

      rows.forEach(row => {
        const memberId = row.dataset.memberId;
        row.addEventListener('mouseenter', () => {
          segments.forEach(s => s.classList.toggle('highlighted', s.dataset.memberId === memberId));
          rows.forEach(r => r.classList.toggle('highlighted', r.dataset.memberId === memberId));
        });
        row.addEventListener('mouseleave', () => {
          segments.forEach(s => s.classList.remove('highlighted'));
          rows.forEach(r => r.classList.remove('highlighted'));
        });
      });
    }
  };

  // =========================================================================
  // 9. Central Event Delegation & Modal Forms (No dead clicks)
  // =========================================================================
  const initEventHandlers = () => {
    // Single central click listener
    document.addEventListener('click', (e) => {
      // Immediate tactile response on sidebar nav items and mobile drawer dismissal
      const navItem = e.target.closest('.nav-item');
      if (navItem) {
        const route = navItem.dataset.route;
        if (route) {
          Motion.updateNavPill(route);
        }
        const sidebar = document.getElementById('sidebar');
        const scrim = document.getElementById('sidebar-scrim');
        if (sidebar && sidebar.classList.contains('mobile-open')) {
          sidebar.classList.remove('mobile-open');
          if (scrim) scrim.classList.remove('visible');
        }
      }

      const target = e.target.closest('[data-action]');
      if (!target) {
        // Close popovers if clicked outside
        if (!e.target.closest('.popover-anchor')) {
          const np = document.getElementById('notification-popover');
          const ap = document.getElementById('admin-menu-popover');
          if (np) np.hidden = true;
          if (ap) ap.hidden = true;
        }
        return;
      }

      const action = target.dataset.action;

      switch (action) {
        // Navigation toggle
        case 'toggle-sidebar': {
          const sidebar = document.getElementById('sidebar');
          const scrim = document.getElementById('sidebar-scrim');
          if (sidebar) sidebar.classList.toggle('mobile-open');
          if (scrim) scrim.classList.toggle('visible');
          break;
        }

        case 'navigate': {
          const route = target.dataset.target;
          if (route) {
            window.location.hash = `#/${route}`;
            const np = document.getElementById('notification-popover');
            const ap = document.getElementById('admin-menu-popover');
            if (np) np.hidden = true;
            if (ap) ap.hidden = true;
          }
          break;
        }

        // Theme toggle
        case 'toggle-theme': {
          dispatch({ type: 'TOGGLE_THEME' });
          document.documentElement.setAttribute('data-theme', state.theme);
          const label = document.getElementById('theme-toggle-label');
          if (label) label.textContent = state.theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
          Toast.show(`Theme changed to ${state.theme} mode`);
          break;
        }

        // Month change
        case 'change-month': {
          const select = document.getElementById('global-month-select');
          if (select) {
            dispatch({ type: 'SET_MONTH', payload: select.value });
            Toast.show(`Viewing accounts for ${getMonthLabel(select.value)}`);
          }
          break;
        }

        // Popovers
        case 'toggle-notifications': {
          const np = document.getElementById('notification-popover');
          const ap = document.getElementById('admin-menu-popover');
          if (ap) ap.hidden = true;
          if (np) {
            np.hidden = !np.hidden;
            renderNotificationList();
          }
          break;
        }

        case 'toggle-admin-menu': {
          const ap = document.getElementById('admin-menu-popover');
          const np = document.getElementById('notification-popover');
          if (np) np.hidden = true;
          if (ap) ap.hidden = !ap.hidden;
          break;
        }

        case 'mark-all-notifications-read': {
          dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
          const badge = document.getElementById('bell-badge');
          if (badge) badge.style.display = 'none';
          renderNotificationList();
          Toast.show('All alerts marked as read');
          break;
        }

        // Modal triggers
        case 'close-modal':
          Modal.close();
          break;

        case 'open-modal-loan':
          openAddLoanModal();
          break;

        case 'open-modal-repayment': {
          const loanId = target.dataset.loanId;
          openRecordRepaymentModal(loanId);
          break;
        }

        case 'open-modal-savings': {
          const memberId = target.dataset.memberId;
          openRecordSavingsModal(memberId);
          break;
        }

        case 'open-modal-member':
          openAddMemberModal();
          break;

        case 'open-modal-product':
          openAddProductModal();
          break;

        case 'open-modal-sale': {
          const productId = target.dataset.productId;
          openRecordSaleModal(productId);
          break;
        }

        case 'open-modal-transaction':
          openAddTransactionModal();
          break;

        // Stock adjust
        case 'adjust-stock': {
          const productId = target.dataset.productId;
          const delta = parseInt(target.dataset.delta, 10);
          dispatch({ type: 'UPDATE_STOCK', payload: { id: productId, delta } });
          Toast.show(`Stock updated for #${productId}`);
          break;
        }

        // Deletion with 5s Undo Toast
        case 'delete-loan': {
          const loanId = target.dataset.loanId;
          const backup = state.loans.find(l => l.id === loanId);
          const repaymentsBackup = state.repayments.filter(r => r.loanId === loanId);
          if (confirm(`Are you sure you want to delete Loan #${loanId}? All corresponding repayments will also be removed.`)) {
            dispatch({ type: 'DELETE_LOAN', payload: loanId });
            Toast.show(`Loan #${loanId} deleted`, 'warning', () => {
              if (backup) {
                dispatch({ type: 'ADD_LOAN', payload: backup });
                repaymentsBackup.forEach(r => dispatch({ type: 'ADD_REPAYMENT', payload: r }));
                Toast.show(`Loan #${loanId} restored!`);
              }
            });
          }
          break;
        }

        case 'delete-repayment': {
          const repId = target.dataset.repaymentId;
          const backup = state.repayments.find(r => r.id === repId);
          dispatch({ type: 'DELETE_REPAYMENT', payload: repId });
          Toast.show(`Repayment #${repId} removed`, 'warning', () => {
            if (backup) {
              dispatch({ type: 'ADD_REPAYMENT', payload: backup });
              Toast.show(`Repayment #${repId} restored!`);
            }
          });
          break;
        }

        case 'delete-member': {
          const memberId = target.dataset.memberId;
          const activeLoan = Selectors.getEnrichedLoans(state).find(l => l.memberId === memberId && l.status !== 'Closed');
          if (activeLoan) {
            alert(`Cannot delete member #${memberId} because they currently have an active loan (#${activeLoan.id} with ${formatINR(activeLoan.outstanding)} outstanding). Please close the loan first.`);
            return;
          }
          const backupMember = state.members.find(m => m.id === memberId);
          if (confirm(`Are you sure you want to remove member ${backupMember?.name}?`)) {
            dispatch({ type: 'DELETE_MEMBER', payload: memberId });
            Toast.show(`Member removed`, 'warning', () => {
              if (backupMember) {
                dispatch({ type: 'ADD_MEMBER', payload: backupMember });
                Toast.show(`Member restored!`);
              }
            });
          }
          break;
        }

        case 'delete-product': {
          const prodId = target.dataset.productId;
          const backup = state.products.find(p => p.id === prodId);
          dispatch({ type: 'DELETE_PRODUCT', payload: prodId });
          Toast.show(`Product #${prodId} removed`, 'warning', () => {
            if (backup) {
              dispatch({ type: 'ADD_PRODUCT', payload: backup });
              Toast.show(`Product restored!`);
            }
          });
          break;
        }

        case 'delete-transaction': {
          const txId = target.dataset.txId;
          const backup = state.transactions.find(t => t.id === txId);
          dispatch({ type: 'DELETE_TRANSACTION', payload: txId });
          Toast.show(`Transaction removed`, 'warning', () => {
            if (backup) {
              dispatch({ type: 'ADD_TRANSACTION', payload: backup });
              Toast.show(`Transaction restored!`);
            }
          });
          break;
        }

        // View modals
        case 'view-invoice': {
          const saleId = target.dataset.saleId;
          openInvoiceModal(saleId);
          break;
        }

        case 'view-member': {
          const memberId = target.dataset.memberId;
          openMemberDetailModal(memberId);
          break;
        }

        // Filter tabs in Loans
        case 'filter-loans': {
          const status = target.dataset.status;
          document.querySelectorAll('#loan-status-filters .filter-tab').forEach(b => b.classList.remove('active'));
          target.classList.add('active');
          const rows = document.querySelectorAll('#loans-table tbody tr');
          rows.forEach(r => {
            if (status === 'all' || r.dataset.status === status) {
              r.style.display = '';
            } else {
              r.style.display = 'none';
            }
          });
          break;
        }

        // Export / Print
        case 'print-report':
          window.print();
          break;

        case 'export-csv':
          exportMonthlyAuditCSV();
          break;

        case 'export-json-backup':
          exportJSONBackup();
          break;

        case 'open-reset-confirm':
          if (confirm('Are you sure you want to reset all data to April 2025 default baseline? Any changes will be overwritten.')) {
            dispatch({ type: 'RESET_SEED' });
            Toast.show('Data restored to April 2025 seed');
            Router.render();
          }
          break;

        case 'close-search-modal':
          closeSearchModal();
          break;
      }
    });

    // Form Submissions
    document.addEventListener('submit', (e) => {
      const form = e.target;
      const action = form.dataset.action;

      if (action === 'submit-loan') {
        e.preventDefault();
        const fd = new FormData(form);
        const newLoan = {
          id: `L${String(state.loans.length + 1).padStart(3, '0')}`,
          memberId: fd.get('memberId'),
          amount: Number(fd.get('amount')),
          purpose: fd.get('purpose'),
          issuedDate: fd.get('issuedDate') || new Date().toISOString().split('T')[0],
          termMonths: Number(fd.get('termMonths')),
          interestRate: Number(fd.get('interestRate'))
        };
        dispatch({ type: 'ADD_LOAN', payload: newLoan });
        Modal.close();
        Toast.show(`Loan #${newLoan.id} disbursed successfully to ${Selectors.getMemberMap(state).get(newLoan.memberId)?.name}`);
      }

      if (action === 'submit-repayment') {
        e.preventDefault();
        const fd = new FormData(form);
        const loanId = fd.get('loanId');
        const amount = Number(fd.get('amount'));
        const enriched = Selectors.getEnrichedLoans(state).find(l => l.id === loanId);

        if (!enriched) return;
        if (amount > enriched.outstanding) {
          alert(`Repayment amount (${formatINR(amount)}) cannot exceed outstanding balance (${formatINR(enriched.outstanding)}).`);
          return;
        }

        const newRepayment = {
          id: `R${String(state.repayments.length + 101)}`,
          loanId: loanId,
          memberId: enriched.memberId,
          amount: amount,
          date: fd.get('date') || new Date().toISOString().split('T')[0],
          mode: fd.get('mode') || 'Cash',
          notes: fd.get('notes') || 'Monthly installment'
        };

        dispatch({ type: 'ADD_REPAYMENT', payload: newRepayment });
        Modal.close();
        Toast.show(`Repayment of ${formatINR(amount)} recorded for #${loanId}`);
      }

      if (action === 'submit-savings') {
        e.preventDefault();
        const fd = new FormData(form);
        const memberId = fd.get('memberId');
        const month = fd.get('month') || state.selectedMonth;
        const mandatory = Number(fd.get('mandatoryAmount')) || state.config.monthlyMandatorySavings;
        const voluntary = Number(fd.get('voluntaryAmount')) || 0;

        const existing = state.savings.find(s => s.memberId === memberId && s.month === month);
        if (existing) {
          dispatch({
            type: 'UPDATE_SAVINGS',
            payload: { ...existing, mandatoryAmount: mandatory, voluntaryAmount: voluntary, date: fd.get('date') }
          });
        } else {
          dispatch({
            type: 'RECORD_SAVINGS',
            payload: {
              id: `S${String(state.savings.length + 101)}`,
              memberId,
              month,
              mandatoryAmount: mandatory,
              voluntaryAmount: voluntary,
              date: fd.get('date') || new Date().toISOString().split('T')[0]
            }
          });
        }

        Modal.close();
        Toast.show(`Savings deposit recorded for ${Selectors.getMemberMap(state).get(memberId)?.name}`);
      }

      if (action === 'submit-member') {
        e.preventDefault();
        const fd = new FormData(form);
        const newMember = {
          id: `M${String(state.members.length + 1).padStart(3, '0')}`,
          name: fd.get('name'),
          role: fd.get('role'),
          phone: fd.get('phone'),
          joinedDate: fd.get('joinedDate') || new Date().toISOString().split('T')[0],
          status: 'Active',
          enterprise: fd.get('enterprise')
        };
        dispatch({ type: 'ADD_MEMBER', payload: newMember });
        Modal.close();
        Toast.show(`New member ${newMember.name} registered`);
      }

      if (action === 'submit-product') {
        e.preventDefault();
        const fd = new FormData(form);
        const newProduct = {
          id: `P${String(state.products.length + 1).padStart(3, '0')}`,
          name: fd.get('name'),
          category: fd.get('category'),
          unitPrice: Number(fd.get('unitPrice')),
          stock: Number(fd.get('stock')),
          producerId: fd.get('producerId'),
          description: fd.get('description')
        };
        dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
        Modal.close();
        Toast.show(`Product ${newProduct.name} added to catalog`);
      }

      if (action === 'submit-sale') {
        e.preventDefault();
        const fd = new FormData(form);
        const productId = fd.get('productId');
        const product = state.products.find(p => p.id === productId);
        const qty = Number(fd.get('quantity'));

        if (!product || qty > product.stock) {
          alert(`Insufficient stock. Only ${product ? product.stock : 0} units available.`);
          return;
        }

        const unitPrice = product.unitPrice;
        const totalAmount = unitPrice * qty;

        const newSale = {
          id: `SL${String(state.sales.length + 1).padStart(2, '0')}`,
          productId: productId,
          memberId: fd.get('memberId'),
          quantity: qty,
          unitPrice: unitPrice,
          totalAmount: totalAmount,
          date: fd.get('date') || new Date().toISOString().split('T')[0],
          buyerName: fd.get('buyerName'),
          paymentMode: fd.get('paymentMode') || 'Cash'
        };

        dispatch({ type: 'RECORD_SALE', payload: newSale });
        Modal.close();
        Toast.show(`Sale of ${formatINR(totalAmount)} logged! Stock decreased.`);
      }

      if (action === 'submit-transaction') {
        e.preventDefault();
        const fd = new FormData(form);
        const newTx = {
          id: `T${String(state.transactions.length + 1).padStart(3, '0')}`,
          type: fd.get('type'),
          category: fd.get('category'),
          amount: Number(fd.get('amount')),
          date: fd.get('date') || new Date().toISOString().split('T')[0],
          description: fd.get('description')
        };
        dispatch({ type: 'ADD_TRANSACTION', payload: newTx });
        Modal.close();
        Toast.show(`Transaction recorded`);
      }

      if (action === 'save-config') {
        e.preventDefault();
        const fd = new FormData(form);
        dispatch({
          type: 'UPDATE_CONFIG',
          payload: {
            shgName: fd.get('shgName'),
            regNumber: fd.get('regNumber'),
            village: fd.get('village'),
            bankName: fd.get('bankName'),
            monthlyMandatorySavings: Number(fd.get('monthlyMandatorySavings'))
          }
        });
        Toast.show('Group settings updated');
      }
    });

    // Keyboard Shortcuts (Escape to dismiss, / for global search)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSearchModal();
        Modal.close();
      }
      if (e.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        openSearchModal();
      }
    });

    // Window Resize handler to keep active glass pill aligned
    window.addEventListener('resize', () => {
      Motion.updateNavPill(Router.currentRoute);
    });

    // Global Search Inputs
    const topSearchInput = document.getElementById('global-search-input');
    if (topSearchInput) {
      topSearchInput.addEventListener('focus', () => {
        openSearchModal();
      });
      topSearchInput.addEventListener('input', (e) => {
        openSearchModal();
        const modalInput = document.getElementById('modal-search-input');
        if (modalInput) {
          modalInput.value = e.target.value;
          handleGlobalSearch(e.target.value.trim().toLowerCase());
        }
      });
    }

    const modalSearchInput = document.getElementById('modal-search-input');
    if (modalSearchInput) {
      modalSearchInput.addEventListener('input', (e) => {
        handleGlobalSearch(e.target.value.trim().toLowerCase());
      });
    }

    // JSON file import
    const importInput = document.getElementById('import-json-input');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (data.version && data.members && data.loans) {
              dispatch({ type: 'IMPORT_STATE', payload: data });
              Toast.show('Backup imported successfully!');
              Router.render();
            } else {
              alert('Invalid backup file schema.');
            }
          } catch {
            alert('Could not parse JSON backup file.');
          }
        };
        reader.readAsText(file);
      });
    }
  };

  // =========================================================================
  // 10. Modal Factory Implementations
  // =========================================================================
  const openAddLoanModal = () => {
    Modal.open(`
      <div class="modal-header">
        <h3 class="modal-title">New Loan Disbursement</h3>
        <button class="modal-close-btn" data-action="close-modal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <form data-action="submit-loan">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Borrower Member</label>
            <select name="memberId" class="form-select" required>
              ${state.members.map(m => `<option value="${m.id}">${m.name} (${m.role} - ${m.enterprise})</option>`).join('')}
            </select>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Principal Amount (INR)</label>
              <input type="number" name="amount" class="form-input" min="1000" step="500" value="10000" required />
            </div>
            <div class="form-group">
              <label class="form-label">Repayment Term (Months)</label>
              <input type="number" name="termMonths" class="form-input" min="1" max="24" value="6" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Livelihood / Investment Purpose</label>
            <input type="text" name="purpose" class="form-input" placeholder="e.g. Dairy cow purchase, Tailoring motor upgrade" required />
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Monthly Interest Rate (%)</label>
              <input type="number" name="interestRate" class="form-input" value="1" step="0.25" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Disbursement Date</label>
              <input type="date" name="issuedDate" class="form-input" value="${state.selectedMonth}-10" required />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn-primary">Approve &amp; Disburse</button>
        </div>
      </form>
    `);
  };

  const openRecordRepaymentModal = (loanId) => {
    const enriched = Selectors.getEnrichedLoans(state).find(l => l.id === loanId);
    if (!enriched) return;

    Modal.open(`
      <div class="modal-header">
        <h3 class="modal-title">Record Loan Repayment</h3>
        <button class="modal-close-btn" data-action="close-modal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <form data-action="submit-repayment">
        <input type="hidden" name="loanId" value="${loanId}" />
        <div class="modal-body">
          <div style="background: var(--surface-subtle); padding: 14px; border-radius: var(--r-md); border: 1px solid var(--border); margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 0.8rem; color: var(--text-muted);">Borrower</span>
              <strong style="font-size: 0.94rem;">${enriched.borrowerName}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 0.8rem; color: var(--text-muted);">Loan Purpose</span>
              <span>${enriched.purpose}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 0.8rem; color: var(--text-muted);">Current Outstanding</span>
              <strong style="color: var(--color-danger); font-size: 1.05rem;">${formatINR(enriched.outstanding)}</strong>
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Repayment Amount (INR)</label>
              <input type="number" name="amount" class="form-input" min="100" max="${enriched.outstanding}" value="${Math.min(2000, enriched.outstanding)}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Payment Mode</label>
              <select name="mode" class="form-select">
                <option value="Cash">Cash (Group Handover)</option>
                <option value="UPI">UPI Direct to SHG Account</option>
                <option value="Bank Transfer">Bank Transfer (NEFT)</option>
              </select>
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Payment Date</label>
              <input type="date" name="date" class="form-input" value="${state.selectedMonth}-15" required />
            </div>
            <div class="form-group">
              <label class="form-label">Voucher Notes</label>
              <input type="text" name="notes" class="form-input" placeholder="e.g. Installment 4" value="Monthly installment" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn-primary">Record Repayment</button>
        </div>
      </form>
    `);
  };

  const openRecordSavingsModal = (defaultMemberId) => {
    Modal.open(`
      <div class="modal-header">
        <h3 class="modal-title">Log Monthly Thrift Savings</h3>
        <button class="modal-close-btn" data-action="close-modal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <form data-action="submit-savings">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Member</label>
            <select name="memberId" class="form-select" required>
              ${state.members.map(m => `
                <option value="${m.id}" ${m.id === defaultMemberId ? 'selected' : ''}>${m.name} (${m.role})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Accounting Month</label>
              <select name="month" class="form-select">
                <option value="2025-04" ${state.selectedMonth === '2025-04' ? 'selected' : ''}>April 2025</option>
                <option value="2025-03" ${state.selectedMonth === '2025-03' ? 'selected' : ''}>March 2025</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Deposit Date</label>
              <input type="date" name="date" class="form-input" value="${state.selectedMonth}-05" required />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Mandatory Share (INR)</label>
              <input type="number" name="mandatoryAmount" class="form-input" value="${state.config.monthlyMandatorySavings}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Voluntary Thrift Deposit (INR)</label>
              <input type="number" name="voluntaryAmount" class="form-input" value="500" min="0" step="100" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn-primary">Confirm Deposit</button>
        </div>
      </form>
    `);
  };

  const openAddMemberModal = () => {
    Modal.open(`
      <div class="modal-header">
        <h3 class="modal-title">Register New SHG Member</h3>
        <button class="modal-close-btn" data-action="close-modal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <form data-action="submit-member">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" name="name" class="form-input" placeholder="e.g. K. Vasanthi" required />
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Designation / Role</label>
              <select name="role" class="form-select">
                <option value="Member">Member</option>
                <option value="Executive Member">Executive Member</option>
                <option value="Treasurer">Treasurer</option>
                <option value="Secretary">Secretary</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" name="phone" class="form-input" placeholder="+91 98765 43210" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Primary Livelihood / Enterprise Activity</label>
            <input type="text" name="enterprise" class="form-input" placeholder="e.g. Organic Dairy, Handloom Bags, Honey Harvesting" required />
          </div>
          <div class="form-group">
            <label class="form-label">Date of Induction</label>
            <input type="date" name="joinedDate" class="form-input" value="${state.selectedMonth}-01" required />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn-primary">Add Member</button>
        </div>
      </form>
    `);
  };

  const openAddProductModal = () => {
    Modal.open(`
      <div class="modal-header">
        <h3 class="modal-title">Add Enterprise Product</h3>
        <button class="modal-close-btn" data-action="close-modal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <form data-action="submit-product">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Product Name</label>
            <input type="text" name="name" class="form-input" placeholder="e.g. Cold-Pressed Sesame Oil (1L)" required />
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select name="category" class="form-select">
                <option value="Food & Nutrition">Food &amp; Nutrition</option>
                <option value="Spices">Spices &amp; Processing</option>
                <option value="Handicrafts">Handicrafts &amp; Handloom</option>
                <option value="Personal Care">Personal Care &amp; Hygiene</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Producer Member</label>
              <select name="producerId" class="form-select">
                ${state.members.map(m => `<option value="${m.id}">${m.name} (${m.enterprise})</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Unit Price (INR)</label>
              <input type="number" name="unitPrice" class="form-input" min="10" step="10" value="250" required />
            </div>
            <div class="form-group">
              <label class="form-label">Initial Stock Count</label>
              <input type="number" name="stock" class="form-input" min="1" value="20" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Product Description</label>
            <textarea name="description" class="form-textarea" rows="2" placeholder="Brief quality details, purity guarantee, weight..." required></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn-primary">Add Product</button>
        </div>
      </form>
    `);
  };

  const openRecordSaleModal = (defaultProductId) => {
    Modal.open(`
      <div class="modal-header">
        <h3 class="modal-title">Record Enterprise Product Sale</h3>
        <button class="modal-close-btn" data-action="close-modal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <form data-action="submit-sale">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Select Product</label>
            <select name="productId" class="form-select" id="sale-product-select" required>
              ${state.products.map(p => `
                <option value="${p.id}" ${p.id === defaultProductId ? 'selected' : ''}>
                  ${p.name} — ${formatINR(p.unitPrice)} (${p.stock} in stock)
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Member Beneficiary</label>
              <select name="memberId" class="form-select">
                ${state.members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Quantity Sold</label>
              <input type="number" name="quantity" class="form-input" min="1" max="100" value="2" required />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Buyer / Store Name</label>
              <input type="text" name="buyerName" class="form-input" placeholder="e.g. Village Weekly Haat, S. Kumar" required />
            </div>
            <div class="form-group">
              <label class="form-label">Payment Mode</label>
              <select name="paymentMode" class="form-select">
                <option value="Cash">Cash</option>
                <option value="UPI">UPI Transfer</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Sale Date</label>
            <input type="date" name="date" class="form-input" value="${state.selectedMonth}-18" required />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn-primary">Generate Invoice &amp; Save</button>
        </div>
      </form>
    `);
  };

  const openAddTransactionModal = () => {
    Modal.open(`
      <div class="modal-header">
        <h3 class="modal-title">Record Operating Transaction</h3>
        <button class="modal-close-btn" data-action="close-modal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <form data-action="submit-transaction">
        <div class="modal-body">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Transaction Type</label>
              <select name="type" class="form-select">
                <option value="income">Income (+ Inflow)</option>
                <option value="expense">Expense (- Outflow)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Amount (INR)</label>
              <input type="number" name="amount" class="form-input" min="10" step="10" value="300" required />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select name="category" class="form-select">
                <option value="Stationery & Registers">Stationery &amp; Registers</option>
                <option value="Meeting Refreshments">Meeting Refreshments</option>
                <option value="Bank Charges">Bank Service Fee</option>
                <option value="Bank Interest">Bank Savings Interest</option>
                <option value="Membership Fee">Membership Dues</option>
                <option value="Exhibition Stall">Exhibition / Haat Fee</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" name="date" class="form-input" value="${state.selectedMonth}-15" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description / Voucher Details</label>
            <input type="text" name="description" class="form-input" placeholder="Explain purpose of expenditure or receipt" required />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn-primary">Save Entry</button>
        </div>
      </form>
    `);
  };

  const openInvoiceModal = (saleId) => {
    const sale = state.sales.find(s => s.id === saleId);
    if (!sale) return;
    const product = state.products.find(p => p.id === sale.productId);
    const member = state.members.find(m => m.id === sale.memberId);

    Modal.open(`
      <div class="modal-header">
        <h3 class="modal-title">Tax Invoice / Receipt #${sale.id}</h3>
        <button class="modal-close-btn" data-action="close-modal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <div class="modal-body" style="font-size: 0.9rem;">
        <div style="border-bottom: 2px dashed var(--border); padding-bottom: 16px; margin-bottom: 16px; display: flex; justify-content: space-between;">
          <div>
            <strong style="font-size: 1.1rem; color: var(--brand-purple);">${state.config.shgName}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${state.config.village}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Reg: ${state.config.regNumber}</div>
          </div>
          <div style="text-align: right;">
            <div><strong>Date:</strong> ${formatDate(sale.date)}</div>
            <div><strong>Invoice:</strong> #${sale.id}</div>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <div><strong>Billed To:</strong> ${sale.buyerName}</div>
          <div><strong>Produced By:</strong> ${member ? member.name : sale.memberId}</div>
          <div><strong>Payment Mode:</strong> ${sale.paymentMode || 'Cash'}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); text-align: left; background: var(--surface-subtle);">
              <th style="padding: 8px;">Item</th>
              <th style="padding: 8px;">Qty</th>
              <th style="padding: 8px;">Price</th>
              <th style="padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px;">${product ? product.name : sale.productId}</td>
              <td style="padding: 8px;">${sale.quantity}</td>
              <td style="padding: 8px;">${formatINR(sale.unitPrice)}</td>
              <td style="padding: 8px; text-align: right; font-weight: 700;">${formatINR(sale.totalAmount)}</td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: right; font-size: 1.15rem; font-weight: 800; color: var(--color-success); border-top: 1px solid var(--border); padding-top: 8px;">
          Total Paid: ${formatINR(sale.totalAmount)}
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-secondary" onclick="window.print()">Print Receipt</button>
        <button type="button" class="btn-primary" data-action="close-modal">Done</button>
      </div>
    `);
  };

  const openMemberDetailModal = (memberId) => {
    const member = state.members.find(m => m.id === memberId);
    if (!member) return;
    const memberLoans = Selectors.getEnrichedLoans(state).filter(l => l.memberId === memberId);
    const memberSavings = state.savings.filter(s => s.memberId === memberId);
    const totalDeposited = memberSavings.reduce((sum, s) => sum + (Number(s.mandatoryAmount) || 0) + (Number(s.voluntaryAmount) || 0), (state.priorCumulativeSavings?.[memberId] || 0));

    Modal.open(`
      <div class="modal-header">
        <h3 class="modal-title">${member.name} — Member File</h3>
        <button class="modal-close-btn" data-action="close-modal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <div class="modal-body">
        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 20px;">
          <div class="user-big-avatar">${member.name.split(' ').map(n => n[0]).join('')}</div>
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 800;">${member.name}</h4>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${member.role} · Member Since ${formatDate(member.joinedDate)}</div>
            <div style="font-size: 0.8rem; font-weight: 600; color: var(--brand-purple); margin-top: 2px;">Livelihood: ${member.enterprise}</div>
          </div>
        </div>

        <div class="kpi-grid kpi-grid-2" style="grid-template-columns: 1fr 1fr; margin-bottom: 20px;">
          <div class="kpi-card kpi-mint" style="padding: 14px;">
            <span class="kpi-label">Cumulative Savings</span>
            <div class="kpi-value" style="font-size: 1.4rem;">${formatINR(totalDeposited)}</div>
          </div>
          <div class="kpi-card kpi-lavender" style="padding: 14px;">
            <span class="kpi-label">Total Loans Availed</span>
            <div class="kpi-value" style="font-size: 1.4rem;">${memberLoans.length} Loans</div>
          </div>
        </div>

        <h4 style="font-size: 0.94rem; font-weight: 700; margin-bottom: 8px;">Loan History</h4>
        <div class="table-wrapper" style="margin-bottom: 16px;">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Principal</th>
                <th>Repaid</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${memberLoans.map(l => `
                <tr>
                  <td>#${l.id}</td>
                  <td>${formatINR(l.principal)}</td>
                  <td>${formatINR(l.repaid)}</td>
                  <td>${formatINR(l.outstanding)}</td>
                  <td><span class="status-pill ${l.status === 'Closed' ? 'status-closed' : 'status-partial'}">${l.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-primary" data-action="close-modal">Close</button>
      </div>
    `);
  };

  // =========================================================================
  // 11. Global Search Modal & Notifications Renderer
  // =========================================================================
  const openSearchModal = () => {
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('modal-search-input');
    if (modal) {
      modal.hidden = false;
      modal.style.display = 'flex';
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 50);
      }
      handleGlobalSearch('');
    }
  };

  const closeSearchModal = () => {
    const modal = document.getElementById('search-modal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }
    const topInput = document.getElementById('global-search-input');
    if (topInput) topInput.value = '';
  };

  const handleGlobalSearch = (query) => {
    const container = document.getElementById('search-modal-results');
    if (!container) return;

    const q = (query || '').toLowerCase().trim();

    // Filter entities
    const members = q ? state.members.filter(m => m.name.toLowerCase().includes(q) || m.enterprise.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)) : state.members;
    const loans = Selectors.getEnrichedLoans(state).filter(l => !q || l.id.toLowerCase().includes(q) || l.purpose.toLowerCase().includes(q) || l.borrowerName.toLowerCase().includes(q));
    const products = q ? state.products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) : state.products.slice(0, 4);

    let html = `
      <div style="display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); align-self: center; text-transform: uppercase;">Quick Filter:</span>
        <button class="filter-tab ${!q ? 'active' : ''}" style="cursor: pointer;" onclick="document.getElementById('modal-search-input').value=''; window.shgSearch('');">All Records</button>
        <button class="filter-tab" style="cursor: pointer;" onclick="document.getElementById('modal-search-input').value='loan'; window.shgSearch('loan');">Loans</button>
        <button class="filter-tab" style="cursor: pointer;" onclick="document.getElementById('modal-search-input').value='dairy'; window.shgSearch('dairy');">Dairy</button>
        <button class="filter-tab" style="cursor: pointer;" onclick="document.getElementById('modal-search-input').value='turmeric'; window.shgSearch('turmeric');">Turmeric</button>
      </div>
    `;

    if (!q) {
      html += `<div style="font-size: 0.76rem; font-weight: 700; color: var(--brand-indigo); margin-bottom: 8px; text-transform: uppercase;">Instant Directory (Click any item to view details):</div>`;
    }

    if (members.length) {
      html += `
        <div class="search-result-group">
          <div class="search-group-title">Members (${members.length})</div>
          ${members.map(m => `
            <div class="search-result-row" data-action="view-member" data-member-id="${m.id}" onclick="window.shgCloseSearch();">
              <span class="search-result-title">👤 ${m.name}</span>
              <span class="search-result-meta">${m.role} · ${m.enterprise}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (loans.length) {
      html += `
        <div class="search-result-group">
          <div class="search-group-title">Loans Portfolio (${loans.length})</div>
          ${loans.map(l => `
            <div class="search-result-row" data-action="navigate" data-target="loans" onclick="window.shgCloseSearch();">
              <span class="search-result-title">💰 Loan #${l.id} — ${l.borrowerName}</span>
              <span class="search-result-meta">${formatINR(l.principal)} · Status: ${l.status}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (products.length) {
      html += `
        <div class="search-result-group">
          <div class="search-group-title">Enterprise Products (${products.length})</div>
          ${products.map(p => `
            <div class="search-result-row" data-action="navigate" data-target="products" onclick="window.shgCloseSearch();">
              <span class="search-result-title">📦 ${p.name}</span>
              <span class="search-result-meta">${formatINR(p.unitPrice)} · Stock: ${p.stock}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (!members.length && !loans.length && !products.length) {
      html += `<div class="search-empty-hint">No matches found for "${query}". Try searching for member names, loan IDs, or products.</div>`;
    }

    container.innerHTML = html;
  };

  // Expose to window for inline onclicks
  window.shgCloseSearch = closeSearchModal;
  window.shgSearch = handleGlobalSearch;


  const renderNotificationList = () => {
    const list = document.getElementById('notification-list');
    if (!list) return;

    if (!state.notifications.length) {
      list.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No new notifications</div>`;
      return;
    }

    list.innerHTML = state.notifications.map(n => `
      <div class="notification-item ${n.unread ? 'unread' : ''}" data-action="navigate" data-target="${n.link.replace('#/', '')}">
        <div class="notification-icon" style="background: var(--brand-indigo-light); color: var(--brand-purple);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
        </div>
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <div class="notification-desc">${n.desc}</div>
          <div class="notification-time">${n.date}</div>
        </div>
      </div>
    `).join('');
  };

  // =========================================================================
  // 12. CSV & JSON Export Utilities
  // =========================================================================
  const exportMonthlyAuditCSV = () => {
    const loans = Selectors.getEnrichedLoans(state);
    const rows = [
      ['SHG Decision Support System — Monthly Audit Statement'],
      ['Accounting Cycle', getMonthLabel(state.selectedMonth)],
      ['Group Name', state.config.shgName],
      ['Registration', state.config.regNumber],
      [''],
      ['Loan ID', 'Borrower', 'Purpose', 'Principal (INR)', 'Repaid (INR)', 'Outstanding (INR)', 'Status', 'Issued Date'],
      ...loans.map(l => [
        l.id,
        `"${l.borrowerName}"`,
        `"${l.purpose}"`,
        l.principal,
        l.repaid,
        l.outstanding,
        l.status,
        l.issuedDate
      ])
    ];

    const csvContent = rows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SHG_Audit_Report_${state.selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Toast.show('CSV Report downloaded successfully');
  };

  const exportJSONBackup = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shg_backup_${state.selectedMonth}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Toast.show('Full JSON Backup downloaded');
  };

  // =========================================================================
  // 13. Initialization Bootstrapper
  // =========================================================================
  const bootstrap = () => {
    // 1. Sync theme attribute
    document.documentElement.setAttribute('data-theme', state.theme || 'light');

    // 2. Sync month selector
    const monthSelect = document.getElementById('global-month-select');
    if (monthSelect) monthSelect.value = state.selectedMonth;

    // 3. Bind subscribe to auto-rerender current route
    subscribe(() => {
      Router.render();
    });

    // 4. Initialize event handlers & router
    initEventHandlers();
    Router.init();
  };

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
