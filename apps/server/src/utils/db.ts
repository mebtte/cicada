import * as sqlite3 from 'sqlite3';

export enum EventType {
  PROFILE = 'profile',
}
type EventTypeMapListener = {
  [EventType.PROFILE]: (sql: string, ms: number) => void;
};

class DB {
  db: sqlite3.Database;

  constructor(filePath: string) {
    this.db = new sqlite3.Database(filePath);
  }

  listen<ET extends EventType>(
    eventType: ET,
    listener: EventTypeMapListener[ET],
  ) {
    this.db.addListener(eventType, listener);
    return () => this.db.removeListener(eventType, listener);
  }

  run(sql: string, params?: unknown[]) {
    return new Promise<void>((resolve, reject) =>
      this.db.run(sql, params, (error) => (error ? reject(error) : resolve())),
    );
  }

  get<Row>(sql: string, params?: unknown[]) {
    return new Promise<Row | null>((resolve, reject) =>
      this.db.get(sql, params, (error: Error | null, row?: Row) =>
        error ? reject(error) : resolve(row || null),
      ),
    );
  }

  all<Row>(sql: string, params?: unknown[]) {
    return new Promise<Row[]>((resolve, reject) =>
      this.db.all(sql, params, (error, rows) =>
        error ? reject(error) : resolve(rows as Row[]),
      ),
    );
  }
}

export default DB;
