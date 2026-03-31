import { Timestamp } from 'firebase/firestore';

export interface InventoryItem {
  id: string;
  merek: string;
  jenis: string;
  namaMotif: string;
  shading: string;
  grade: string;
  line: string;
  pallete: string;
  quantity: number;
  lastUpdated: Timestamp;
}

export interface Transaction {
  id: string;
  type: 'input' | 'output';
  timestamp: Timestamp;
  line: string;
  pallete: string;
  merek: string;
  jenis: string;
  namaMotif: string;
  shading: string;
  grade: string;
  quantity: number;
  namaPengambil?: string;
  posisi?: string;
  namaPenerima?: string;
}

export const BRANDS = [
  'Laverna', 'Eos', 'Valda', 'Rota', 'Mensah', 'Charissa', 
  'Olivera', 'Althea', 'Ara', 'Aurora', 'Carina', 'Carlo', 
  'Core', 'Mahesa', 'Remo', 'Rexton', 'Salvadore', 'Valerio'
];

export const GRADES = ['EXP', 'STD', 'ECO'];
export const JENIS = ['HT', 'GP', 'Option'];
export const PALLETES = [
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6',
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6',
  'D1', 'D2', 'D3', 'D4', 'D5', 'D6',
  'E1', 'E2', 'E3', 'E4', 'E5', 'E6',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6'
];
