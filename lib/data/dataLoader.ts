import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { TransactionDistrict, RentalIndexDistrict, SupplyDistrict, SaleRateDistrict, Project } from './types';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

export class DataManager {
  private static instance: DataManager;
  
  public transactions: TransactionDistrict[] = [];
  public rentalIndices: RentalIndexDistrict[] = [];
  public supply: SupplyDistrict[] = [];
  public saleRates: SaleRateDistrict[] = [];
  public projects: Project[] = [];

  private constructor() {}

  public static async getInstance(): Promise<DataManager> {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
      await DataManager.instance.loadData();
    }
    return DataManager.instance;
  }

  private async loadData() {
    this.transactions = await this.parseCSV<TransactionDistrict>('TRANSACTIONS_DISTRICT.csv');
    this.rentalIndices = await this.parseCSV<RentalIndexDistrict>('RENTAL_INDEX_DISTRICT.csv');
    this.supply = await this.parseCSV<SupplyDistrict>('SUPPLY_DISTRICT.csv');
    this.saleRates = await this.parseCSV<SaleRateDistrict>('SALE_RATES_DISTRICT.csv');
    this.projects = await this.parseCSV<Project>('PROJECT.csv');
    console.log('Data loaded successfully');
  }

  private async parseCSV<T>(filename: string): Promise<T[]> {
    const filePath = path.join(DATA_DIR, filename);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data } = Papa.parse(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
      return data as T[];
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      return [];
    }
  }
}
