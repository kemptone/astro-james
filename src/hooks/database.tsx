export const DB_NAME = "audio";
export const DB_VERSION = 4;
export const DB_STORE_NAME = "recordings2";

// Open the database
// let db;

export default (
  callback: (
    db: IDBDatabase,
  ) => void,
) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  // Handle errors when opening the database
  request.onerror = function (event) {
    console.error("Failed to open database:", event.target.errorCode);
  };

  // Create the database schema
  request.onupgradeneeded = function (event) {
    const db = (event.currentTarget as IDBOpenDBRequest).result;
    const store = db.createObjectStore(DB_STORE_NAME, {
      keyPath: "id",
      autoIncrement: true,
    });
    store.createIndex("timestamp", "timestamp", { unique: false });

    // const db = event.target.result;
    // // Create a table
    // const table = db.createObjectStore(DB_STORE_NAME, { autoIncrement: true });
    // // Add indexes to the table if necessary
    // // table.createIndex("name", "name", { unique: false });
    // console.log("Database created and table added:", db.name);
    // callback(db);
  };

  // Handle success when opening the database
  request.onsuccess = function (event) {
    callback(event.target.result);
  };
};
