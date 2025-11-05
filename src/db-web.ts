// Web-compatible SQLite database adapter using sql.js
import initSqlJs, { Database } from 'sql.js';

// Adapter to match expo-sqlite API
export interface SQLiteDatabase {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string, params?: any[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: any[]): Promise<T[]>;
  runAsync(sql: string, params?: any[]): Promise<{ lastInsertRowId: number; changes: number }>;
  withTransactionAsync<T>(fn: () => Promise<T>): Promise<T>;
}

let sqlJsInstance: typeof initSqlJs | null = null;
const DB_STORAGE_KEY = 'liftlog_db';

async function getSqlJs() {
  if (!sqlJsInstance) {
    sqlJsInstance = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });
  }
  return sqlJsInstance;
}

async function loadDatabase(): Promise<Database> {
  const SQL = await getSqlJs();
  
  // Try to load from localStorage
  const savedDb = localStorage.getItem(DB_STORAGE_KEY);
  if (savedDb) {
    try {
      const uint8Array = Uint8Array.from(atob(savedDb), (c) => c.charCodeAt(0));
      return new SQL.Database(uint8Array);
    } catch (error) {
      console.warn('[DB] Failed to load database from localStorage, creating new one:', error);
    }
  }
  
  return new SQL.Database();
}

function saveDatabase(db: Database): void {
  try {
    const data = db.export();
    const base64 = btoa(String.fromCharCode(...data));
    localStorage.setItem(DB_STORAGE_KEY, base64);
  } catch (error) {
    console.error('[DB] Failed to save database to localStorage:', error);
  }
}

class WebSQLiteDatabase implements SQLiteDatabase {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async execAsync(sql: string): Promise<void> {
    // sql.js exec() handles multi-statement SQL
    this.db.exec(sql);
    saveDatabase(this.db);
  }

  async getFirstAsync<T>(sql: string, params?: any[]): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    if (params) {
      stmt.bind(params);
    }
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result as T | null;
  }

  async getAllAsync<T>(sql: string, params?: any[]): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    if (params) {
      stmt.bind(params);
    }
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }

  async runAsync(sql: string, params?: any[]): Promise<{ lastInsertRowId: number; changes: number }> {
    const stmt = this.db.prepare(sql);
    if (params) {
      stmt.bind(params);
    }
    stmt.step();
    const changes = this.db.getRowsModified();
    // Get last insert row ID - sql.js doesn't have a direct method, so we query it
    let lastInsertRowId = 0;
    try {
      const result = this.db.exec('SELECT last_insert_rowid() as id');
      if (result.length > 0 && result[0].values.length > 0) {
        lastInsertRowId = result[0].values[0][0] as number || 0;
      }
    } catch (error) {
      // If query fails, lastInsertRowId remains 0
      console.warn('[DB] Failed to get last insert row ID:', error);
    }
    stmt.free();
    saveDatabase(this.db);
    return {
      lastInsertRowId,
      changes,
    };
  }

  async withTransactionAsync<T>(fn: () => Promise<T>): Promise<T> {
    try {
      this.db.exec('BEGIN TRANSACTION');
      const result = await fn();
      this.db.exec('COMMIT');
      saveDatabase(this.db);
      return result;
    } catch (error) {
      // Only rollback if a transaction is active
      try {
        this.db.exec('ROLLBACK');
        saveDatabase(this.db);
      } catch (rollbackError) {
        // Ignore rollback errors if no transaction is active
        console.warn('[DB] Rollback failed (transaction may not be active):', rollbackError);
      }
      throw error;
    }
  }
}

export async function openDatabaseAsync(dbName: string): Promise<SQLiteDatabase> {
  const db = await loadDatabase();
  return new WebSQLiteDatabase(db);
}

