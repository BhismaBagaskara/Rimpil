import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { InventoryItem } from '../types';
import { Search, Download, Filter, ArrowUpDown, Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export default function InventoryTable() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem, direction: 'asc' | 'desc' } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);

  const syncToSheets = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync-inventory-to-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory: filteredData.map(item => ({
            ...item,
            lastUpdated: format(item.lastUpdated.toDate(), 'yyyy-MM-dd HH:mm')
          }))
        })
      });
      const result = await response.json();
      if (result.success) {
        alert('Inventory berhasil disinkronkan ke Google Sheets!');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      alert('Gagal sinkronisasi: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const path = 'inventory';
    const q = query(collection(db, path));
    const unsub = onSnapshot(q, (snapshot) => {
      setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsub();
  }, []);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const path = `inventory/${deleteId}`;
    try {
      await deleteDoc(doc(db, 'inventory', deleteId));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setIsDeleting(false);
    }
  };

  const sortedData = [...inventory].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const requestSort = (key: keyof InventoryItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const exportToCSV = () => {
    const headers = ['Merek', 'Motif', 'Jenis', 'Shading', 'Grade', 'Pallete', 'Quantity', 'Last Updated'];
    const rows = filteredData.map(item => [
      item.merek,
      item.namaMotif,
      item.jenis,
      item.shading,
      item.grade,
      item.pallete,
      item.quantity,
      format(item.lastUpdated.toDate(), 'yyyy-MM-dd HH:mm')
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_report_${format(new Date(), 'yyyyMMdd')}.csv`);
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
      {/* Table Header */}
      <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Data Actual Inventory</h2>
          <p className="text-sm text-neutral-500 mt-1">Total {filteredData.length} item unik dalam stok</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Cari data..."
              className="pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-neutral-900/5 outline-none w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={syncToSheets}
            disabled={isSyncing}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2"
            title="Sync to Google Sheets"
          >
            {isSyncing ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            <span className="text-xs font-bold hidden md:inline">Sync Sheets</span>
          </button>
          <button 
            onClick={exportToCSV}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-left">
              <TableHeader label="Merek" onClick={() => requestSort('merek')} />
              <TableHeader label="Nama Motif" onClick={() => requestSort('namaMotif')} />
              <TableHeader label="Jenis" onClick={() => requestSort('jenis')} />
              <TableHeader label="Shading" onClick={() => requestSort('shading')} />
              <TableHeader label="Grade" onClick={() => requestSort('grade')} />
              <TableHeader label="Line" onClick={() => requestSort('line')} />
              <TableHeader label="Pallete" onClick={() => requestSort('pallete')} />
              <TableHeader label="Quantity" onClick={() => requestSort('quantity')} />
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Last Updated</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold">{item.merek}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">{item.namaMotif}</td>
                  <td className="px-6 py-4 text-sm">{item.jenis}</td>
                  <td className="px-6 py-4 text-sm">{item.shading}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] font-bold">
                      {item.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">{item.line}</td>
                  <td className="px-6 py-4 text-sm font-mono">{item.pallete}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={item.quantity < 10 ? "text-red-500 font-bold" : "font-bold"}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-neutral-500">
                    {format(item.lastUpdated.toDate(), 'dd MMM yyyy, HH:mm')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Hapus Item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-neutral-500">
                  Tidak ada data ditemukan
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
                <h3 className="text-xl font-bold">Konfirmasi Hapus</h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                Apakah Anda yakin ingin menghapus item ini dari inventaris? Tindakan ini tidak dapat dibatalkan.
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
