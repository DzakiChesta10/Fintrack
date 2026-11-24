'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  FileSpreadsheet,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Table,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCurrency } from '@/lib/money';

export default function ImportExportPage() {
  const [exportType, setExportType] = useState<'ALL' | 'THIS_MONTH'>('ALL');
  const [exportLoading, setExportLoading] = useState(false);

  // Import states
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    successCount?: number;
    errors?: string[];
  } | null>(null);

  // Sample CSV Download
  const handleDownloadSample = () => {
    const csvContent =
      'date,type,amount,category,wallet,notes\n' +
      '2026-11-20,EXPENSE,45000,Makanan & Minuman,Dompet Tunai,Nasi Padang siang\n' +
      '2026-11-21,EXPENSE,35000,Transportasi,GoPay / QRIS,Gojek ke kantor\n' +
      '2026-11-25,INCOME,8500000,Gaji Pokok,Rekening BCA Utama,Gaji Bulanan\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fintrack-sample-import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to CSV or Excel
  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExportLoading(true);
    try {
      const res = await fetch('/api/transactions?limit=1000');
      const data = await res.json();
      const transactions = data.transactions || [];

      if (transactions.length === 0) {
        alert('Tidak ada transaksi untuk diekspor');
        return;
      }

      // Format clean data
      const exportData = transactions.map((tx: any) => ({
        ID: tx.id,
        Tanggal: new Date(tx.date).toISOString().split('T')[0],
        Tipe: tx.type,
        Nominal: tx.amount,
        Dompet: tx.wallet?.name || '',
        DompetTujuan: tx.destinationWallet?.name || '',
        Kategori: tx.category?.name || '',
        Catatan: tx.notes || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi');

      const dateStr = new Date().toISOString().split('T')[0];
      if (format === 'xlsx') {
        XLSX.writeFile(workbook, `FinTrack-Laporan-${dateStr}.xlsx`);
      } else {
        XLSX.writeFile(workbook, `FinTrack-Laporan-${dateStr}.csv`);
      }
    } catch (e) {
      alert('Gagal mengekspor data');
    } finally {
      setExportLoading(false);
    }
  };

  // Handle file upload for CSV/XLSX
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        // Normalize rows
        const normalized = json.map((row) => ({
          date: row.date || row.Tanggal || row.Date || new Date().toISOString().split('T')[0],
          type: String(row.type || row.Tipe || row.Type || 'EXPENSE').toUpperCase(),
          amount: parseFloat(row.amount || row.Nominal || row.Jumlah || 0),
          category: row.category || row.Kategori || row.Category || 'Lainnya',
          wallet: row.wallet || row.Dompet || row.Wallet || 'Dompet Tunai',
          notes: row.notes || row.Catatan || row.Keterangan || '',
        }));

        setParsedRows(normalized);
      } catch (err) {
        alert('Gagal membaca file. Pastikan format CSV atau Excel valid.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    setImportLoading(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parsedRows }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengimpor data');
      }

      setImportResult({
        successCount: data.successCount,
        errors: data.errors,
      });

      // Clear rows after successful import
      setParsedRows([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
              <span>Ekspor & Impor Data Finansial</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cadangkan data ke Excel/CSV atau impor mutasi bank dengan pratinjau sebelum disimpan
            </p>
          </div>
        </div>

        {/* 2-Column Section: Export & Import */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Ekspor Data */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Download className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Ekspor Transaksi FinTrack
                </h3>
                <p className="text-[11px] text-slate-400">
                  Unduh seluruh histori transaksi dengan kategori dan dompet
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Pilih format ekspor yang Anda butuhkan. Dokumen Excel (.xlsx) menyertakan header kolom rapi siap olah di Microsoft Excel atau Google Sheets.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleExport('xlsx')}
                disabled={exportLoading}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Unduh Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => handleExport('csv')}
                disabled={exportLoading}
                className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>Unduh CSV</span>
              </button>
            </div>
          </div>

          {/* Card 2: Impor Data */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Impor Transaksi / Mutasi Bank
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mendukung file CSV dan Excel
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadSample}
                className="text-xs text-emerald-600 hover:underline font-semibold"
              >
                Unduh Template CSV
              </button>
            </div>

            <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors">
              <Upload className="w-7 h-7 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih File CSV / Excel (.xlsx)
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                {fileName ? `File terpilih: ${fileName}` : 'Klik atau seret file ke sini'}
              </span>
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Import Results Banner */}
        {importResult && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Berhasil mengimpor {importResult.successCount} transaksi ke dalam FinTrack!</span>
            </div>
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="text-[11px] text-rose-600 dark:text-rose-400 pl-6 space-y-0.5">
                {importResult.errors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview & Column Mapping Table */}
        {parsedRows.length > 0 && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-500" />
                  <span>Pratinjau Data Impor ({parsedRows.length} Baris)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Periksa keakuratan data sebelum disimpan ke database
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setParsedRows([])}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importLoading}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {importLoading ? 'Menyimpan...' : 'Konfirmasi & Simpan ke Database'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Tipe</th>
                    <th className="py-2.5 px-3">Nominal</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Dompet</th>
                    <th className="py-2.5 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedRows.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono">{row.date}</td>
                      <td className="py-2.5 px-3 font-semibold">{row.type}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="py-2.5 px-3">{row.category}</td>
                      <td className="py-2.5 px-3">{row.wallet}</td>
                      <td className="py-2.5 px-3 text-slate-400">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedRows.length > 10 && (
              <p className="text-[11px] text-slate-400 text-center">
                ...dan {parsedRows.length - 10} baris lainnya akan diimpor sekaligus.
              </p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
