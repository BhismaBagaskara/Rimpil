import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  Timestamp,
  increment,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { BRANDS, JENIS, GRADES, PALLETES, InventoryItem } from '../types';
import SearchableDropdown from './SearchableDropdown';
import { motion, AnimatePresence } from 'motion/react';
import { Save, ArrowRightCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const schema = z.object({
  line: z.string().min(1, 'Line is required'),
  pallete: z.string().min(1, 'Pallete is required'),
  merek: z.string().min(1, 'Brand is required'),
  jenis: z.string().min(1, 'Type is required'),
  namaMotif: z.string().min(1, 'Motif name is required'),
  shading: z.string().min(1, 'Shading is required'),
  grade: z.string().min(1, 'Grade is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  namaPengambil: z.string().optional(),
  posisi: z.string().optional(),
  namaPenerima: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface InventoryFormProps {
  type: 'input' | 'output';
}

export default function InventoryForm({ type }: InventoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: 1,
      line: '',
      pallete: '',
      merek: '',
      jenis: '',
      namaMotif: '',
      shading: '',
      grade: '',
    }
  });

  useEffect(() => {
    if (type === 'output') {
      const fetchInventory = async () => {
        const q = query(collection(db, 'inventory'), where('quantity', '>', 0));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
        setInventoryItems(items);
      };
      fetchInventory();
    }
  }, [type, success]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const timestamp = Timestamp.now();
      
      // 1. Create Transaction
      await addDoc(collection(db, 'transactions'), {
        ...data,
        type,
        timestamp
      });

      // 2. Update Inventory
      const itemKey = `${data.merek}-${data.namaMotif}-${data.jenis}-${data.shading}-${data.grade}-${data.line}-${data.pallete}`.replace(/\s+/g, '_');
      const inventoryRef = doc(db, 'inventory', itemKey);
      
      if (type === 'input') {
        await setDoc(inventoryRef, {
          merek: data.merek,
          jenis: data.jenis,
          namaMotif: data.namaMotif,
          shading: data.shading,
          grade: data.grade,
          line: data.line,
          pallete: data.pallete,
          quantity: increment(data.quantity),
          lastUpdated: timestamp
        }, { merge: true });
      } else {
        // Check if enough stock
        if (selectedItem && selectedItem.quantity < data.quantity) {
          throw new Error(`Insufficient stock. Available: ${selectedItem.quantity}`);
        }
        await updateDoc(inventoryRef, {
          quantity: increment(-data.quantity),
          lastUpdated: timestamp
        });
      }

      setSuccess(true);
      reset();
      setSelectedItem(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (itemString: string) => {
    const item = inventoryItems.find(i => 
      `${i.merek} | ${i.namaMotif} | ${i.shading} | ${i.line} | ${i.pallete} | Stock: ${i.quantity}` === itemString
    );
    if (item) {
      setSelectedItem(item);
      setValue('merek', item.merek);
      setValue('jenis', item.jenis);
      setValue('namaMotif', item.namaMotif);
      setValue('shading', item.shading);
      setValue('grade', item.grade);
      setValue('line', item.line);
      setValue('pallete', item.pallete);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl p-8 border border-neutral-200 dark:border-neutral-800"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {type === 'input' ? 'Input Barang Baru' : 'Pengeluaran Barang'}
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          {type === 'input' 
            ? 'Tambahkan stok barang baru ke dalam sistem inventory.' 
            : 'Catat pengeluaran barang dari gudang.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {type === 'output' && (
          <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <SearchableDropdown
              label="Pilih Barang dari Stok"
              placeholder="Cari Merek, Motif, atau Pallete..."
              options={inventoryItems.map(i => `${i.merek} | ${i.namaMotif} | ${i.shading} | ${i.line} | ${i.pallete} | Stock: ${i.quantity}`)}
              value={selectedItem ? `${selectedItem.merek} | ${selectedItem.namaMotif} | ${selectedItem.shading} | ${selectedItem.line} | ${selectedItem.pallete} | Stock: ${selectedItem.quantity}` : ''}
              onChange={handleItemSelect}
              required
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Line <span className="text-red-500">*</span></label>
            <input
              {...register('line')}
              placeholder="Contoh: Line 1"
              className={cn(
                "w-full px-4 py-3 bg-white dark:bg-neutral-900 border rounded-xl focus:ring-2 focus:ring-neutral-900/5 transition-all outline-none",
                errors.line ? "border-red-500" : "border-neutral-200 dark:border-neutral-800"
              )}
            />
            {errors.line && <p className="text-xs text-red-500">{errors.line.message}</p>}
          </div>

          <Controller
            name="pallete"
            control={control}
            render={({ field }) => (
              <SearchableDropdown
                label="Pallete"
                options={PALLETES}
                value={field.value}
                onChange={field.onChange}
                error={errors.pallete?.message}
                required
              />
            )}
          />

          <Controller
            name="merek"
            control={control}
            render={({ field }) => (
              <SearchableDropdown
                label="Merek (Brand)"
                options={BRANDS}
                value={field.value}
                onChange={field.onChange}
                error={errors.merek?.message}
                required
              />
            )}
          />

          <Controller
            name="jenis"
            control={control}
            render={({ field }) => (
              <SearchableDropdown
                label="Jenis"
                options={JENIS}
                value={field.value}
                onChange={field.onChange}
                error={errors.jenis?.message}
                required
              />
            )}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Nama Motif <span className="text-red-500">*</span></label>
            <input
              {...register('namaMotif')}
              placeholder="Masukkan nama motif"
              className={cn(
                "w-full px-4 py-3 bg-white dark:bg-neutral-900 border rounded-xl focus:ring-2 focus:ring-neutral-900/5 transition-all outline-none",
                errors.namaMotif ? "border-red-500" : "border-neutral-200 dark:border-neutral-800"
              )}
            />
            {errors.namaMotif && <p className="text-xs text-red-500">{errors.namaMotif.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Shading <span className="text-red-500">*</span></label>
            <input
              {...register('shading')}
              placeholder="Masukkan shading"
              className={cn(
                "w-full px-4 py-3 bg-white dark:bg-neutral-900 border rounded-xl focus:ring-2 focus:ring-neutral-900/5 transition-all outline-none",
                errors.shading ? "border-red-500" : "border-neutral-200 dark:border-neutral-800"
              )}
            />
            {errors.shading && <p className="text-xs text-red-500">{errors.shading.message}</p>}
          </div>

          <Controller
            name="grade"
            control={control}
            render={({ field }) => (
              <SearchableDropdown
                label="Grade"
                options={GRADES}
                value={field.value}
                onChange={field.onChange}
                error={errors.grade?.message}
                required
              />
            )}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Quantity <span className="text-red-500">*</span></label>
            <input
              type="number"
              {...register('quantity', { valueAsNumber: true })}
              className={cn(
                "w-full px-4 py-3 bg-white dark:bg-neutral-900 border rounded-xl focus:ring-2 focus:ring-neutral-900/5 transition-all outline-none",
                errors.quantity ? "border-red-500" : "border-neutral-200 dark:border-neutral-800"
              )}
            />
            {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
          </div>
        </div>

        {type === 'output' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Nama Pengambil Barang <span className="text-red-500">*</span></label>
              <input
                {...register('namaPengambil')}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Posisi (Jabatan) <span className="text-red-500">*</span></label>
              <input
                {...register('posisi')}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Nama Penerima/Pelanggan (Tentative)</label>
              <input
                {...register('namaPenerima')}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none"
              />
            </div>
          </div>
        )}

        <div className="pt-6">
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all duration-300 shadow-xl",
              type === 'input' 
                ? "bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100" 
                : "bg-primary-600 hover:bg-primary-700 bg-neutral-900",
              loading && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <>
                {type === 'input' ? <Save size={22} /> : <ArrowRightCircle size={22} />}
                Submit Data {type === 'input' ? 'Masuk' : 'Keluar'}
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl border border-green-100 dark:border-green-800"
            >
              <CheckCircle2 size={20} />
              <span className="font-medium">Data berhasil disimpan!</span>
            </motion.div>
          )}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl border border-red-100 dark:border-red-800"
            >
              <AlertCircle size={20} />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}
