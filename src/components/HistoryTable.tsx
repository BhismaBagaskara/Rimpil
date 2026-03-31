import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Transaction } from '../types';
import { Search, Download, ArrowUpDown, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { deleteDoc, doc } from 'firebase/firestore';

interface HistoryTableProps {
  type: 'input' | 'output';
}

export default function HistoryTable({ type }: HistoryTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction, direction: 'asc' | 'desc' } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const path = 'transactions';
    const q = query(
      collection(db, path), 
      where('type', '==', type),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsub();
  }, [type]);

  const sortedData = [...transactions].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = a[key];
    const valB = b[key];
    if (valA === undefined || valB === undefined) return 0;
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const requestSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const path = `transactions/${deleteId}`;
    try {
      await deleteDoc(doc(db, 'transactions', deleteId));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Waktu', 'Merek', 'Motif', 'Jenis', 'Shading', 'Grade', 'Line', 'Pallete', 'Qty'];
    if (type === 'output') headers.push('Pengambil', 'Posisi', 'Penerima');
    
    const rows = filteredData.map(t => {
      const row = [
        format(t.timestamp.toDate(), 'yyyy-MM-dd HH:mm'),
        t.merek,
        t.namaMotif,
        t.jenis,
        t.shading,
        t.grade,
        t.line,
        t.pallete,
        t.quantity
      ];
      if (type === 'output') {
        row.push(t.namaPengambil || '', t.posisi || '', t.namaPenerima || '');
      }
      return row;
    });
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `riwayat_${type}_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Riwayat {type === 'input' ? 'Barang Masuk' : 'Barang Keluar'}</h2>
          <p className="text-sm text-neutral-500 mt-1">Total {filteredData.length} transaksi ditemukan</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Cari riwayat..."
              className="pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-neutral-900/5 outline-none w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={exportToCSV}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-left">
              <TableHeader label="Waktu" onClick={() => requestSort('timestamp')} />
              <TableHeader label="Merek" onClick={() => requestSort('merek')} />
              <TableHeader label="Nama Motif" onClick={() => requestSort('namaMotif')} />
              <TableHeader label="Line" onClick={() => requestSort('line')} />
              <TableHeader label="Pallete" onClick={() => requestSort('pallete')} />
              <TableHeader label="Qty" onClick={() => requestSort('quantity')} />
              {type === 'output' && (
                <>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Pengambil</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Penerima</th>
                </>
              )}
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filteredData.length > 0 ? (
              filteredData.map((t) => (
                <tr key={t.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 text-xs text-neutral-500">
                    {format(t.timestamp.toDate(), 'dd MMM yyyy, HH:mm')}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">{t.merek}</td>
                  <td className="px-6 py-4 text-sm">{t.namaMotif}</td>
                  <td className="px-6 py-4 text-sm font-mono">{t.line}</td>
                  <td className="px-6 py-4 text-sm font-mono">{t.pallete}</td>
                  <td className="px-6 py-4 text-sm font-bold">{t.quantity}</td>
                  {type === 'output' && (
                    <>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium">{t.namaPengambil}</div>
                        <div className="text-xs text-neutral-400">{t.posisi}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500">{t.namaPenerima || '-'}</td>
                    </>
                  )}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setDeleteId(t.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Hapus Riwayat"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={type === 'output' ? 9 : 7} className="px-6 py-12 text-center text-neutral-500">
                  Tidak ada riwayat ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex items-center gap-4 text-red-600 mb-6">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold">Hapus Riwayat</h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                Apakah Anda yakin ingin menghapus catatan transaksi ini? Data stok di inventory tidak akan berubah, hanya catatan riwayat ini yang dihapus.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Menghapus...
                    </>
                  ) : (
                    'Hapus'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TableHeader({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <th 
      className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500 cursor-pointer hover:text-neutral-900 dark:hover:text-white transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} />
      </div>
    </th>
  );
}
