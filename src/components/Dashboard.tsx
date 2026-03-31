import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { InventoryItem, Transaction } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { motion } from 'motion/react';
import { Package, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const invPath = 'inventory';
    const qInv = query(collection(db, invPath));
    const unsubInv = onSnapshot(qInv, (snapshot) => {
      setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, invPath);
    });

    const transPath = 'transactions';
    const qTrans = query(collection(db, transPath), orderBy('timestamp', 'desc'), limit(50));
    const unsubTrans = onSnapshot(qTrans, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, transPath);
    });

    return () => {
      unsubInv();
      unsubTrans();
    };
  }, []);

  const totalStock = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const totalInput = transactions.filter(t => t.type === 'input').reduce((acc, t) => acc + t.quantity, 0);
  const totalOutput = transactions.filter(t => t.type === 'output').reduce((acc, t) => acc + t.quantity, 0);

  const brandData = Object.entries(
    inventory.reduce((acc, item) => {
      acc[item.merek] = (acc[item.merek] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const recentTransData = transactions.slice(0, 10).map(t => ({
    time: format(t.timestamp.toDate(), 'HH:mm'),
    quantity: t.quantity,
    type: t.type
  })).reverse();

  const COLORS = ['#000000', '#404040', '#737373', '#a3a3a3', '#d4d4d4'];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Stock" 
          value={totalStock} 
          icon={Package} 
          trend="+12%" 
          color="neutral"
        />
        <StatCard 
          title="Total Input" 
          value={totalInput} 
          icon={ArrowUpRight} 
          trend="+5%" 
          color="green"
        />
        <StatCard 
          title="Total Output" 
          value={totalOutput} 
          icon={ArrowDownRight} 
          trend="+8%" 
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Brand Distribution */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-neutral-400" />
            Distribusi Stok per Merek
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={brandData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {brandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-neutral-400" />
            Aktivitas Terkini
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentTransData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f5f5f5' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                  {recentTransData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.type === 'input' ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <h3 className="text-xl font-bold">Transaksi Terakhir</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-left">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Waktu</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Tipe</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Merek</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Motif</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm">{format(t.timestamp.toDate(), 'dd MMM, HH:mm')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      t.type === 'input' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{t.merek}</td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{t.namaMotif}</td>
                  <td className="px-6 py-4 text-sm font-bold">{t.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
          <Icon size={24} className="text-neutral-900 dark:text-white" />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
          color === 'green' ? 'bg-green-100 text-green-700' : 
          color === 'red' ? 'bg-red-100 text-red-700' : 
          'bg-neutral-100 text-neutral-700'
        }`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
        <h4 className="text-4xl font-bold tracking-tight mt-1">{value.toLocaleString()}</h4>
      </div>
    </motion.div>
  );
}
