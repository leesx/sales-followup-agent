const DB_NAME = "sales-followup-agent";
const DB_VERSION = 2;
const FOLLOWUPS_STORE = "followups";
const TASKS_STORE = "tasks";
const STAGES_STORE = "stageOverrides";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(FOLLOWUPS_STORE)) {
        const store = db.createObjectStore(FOLLOWUPS_STORE, { keyPath: "id" });
        store.createIndex("customerId", "customerId", { unique: false });
      }

      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        const store = db.createObjectStore(TASKS_STORE, { keyPath: "id" });
        store.createIndex("customerId", "customerId", { unique: false });
      }

      if (!db.objectStoreNames.contains(STAGES_STORE)) {
        db.createObjectStore(STAGES_STORE, { keyPath: "customerId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runStore(storeName, mode, action) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = action(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      }),
  );
}

function runStores(storeNames, mode, action) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeNames, mode);
        const stores = Object.fromEntries(storeNames.map((storeName) => [storeName, transaction.objectStore(storeName)]));

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };

        action(stores);
      }),
  );
}

export async function getFollowups() {
  return runStore(FOLLOWUPS_STORE, "readonly", (store) => store.getAll());
}

export async function saveFollowup(followup) {
  await runStore(FOLLOWUPS_STORE, "readwrite", (store) => store.put(followup));
  return followup;
}

export async function getTasks() {
  return runStore(TASKS_STORE, "readonly", (store) => store.getAll());
}

export async function getStageOverrides() {
  return runStore(STAGES_STORE, "readonly", (store) => store.getAll());
}

export async function saveTask(task) {
  await runStore(TASKS_STORE, "readwrite", (store) => store.put(task));
  return task;
}

export async function saveStageOverride(stageOverride) {
  await runStore(STAGES_STORE, "readwrite", (store) => store.put(stageOverride));
  return stageOverride;
}

export async function updateTaskStatus(taskId, status) {
  const tasks = await getTasks();
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return null;

  const updatedTask = {
    ...task,
    status,
    completedAt: status === "done" ? new Date().toISOString() : null,
  };
  await saveTask(updatedTask);
  return updatedTask;
}

export async function clearLocalData() {
  await runStores([FOLLOWUPS_STORE, TASKS_STORE, STAGES_STORE], "readwrite", (stores) => {
    stores[FOLLOWUPS_STORE].clear();
    stores[TASKS_STORE].clear();
    stores[STAGES_STORE].clear();
  });
}

export async function replaceLocalData({ followups = [], tasks = [], stageOverrides = [] }) {
  await runStores([FOLLOWUPS_STORE, TASKS_STORE, STAGES_STORE], "readwrite", (stores) => {
    stores[FOLLOWUPS_STORE].clear();
    stores[TASKS_STORE].clear();
    stores[STAGES_STORE].clear();

    followups.forEach((followup) => stores[FOLLOWUPS_STORE].put(followup));
    tasks.forEach((task) => stores[TASKS_STORE].put(task));
    stageOverrides.forEach((stageOverride) => stores[STAGES_STORE].put(stageOverride));
  });

  return { followups, tasks, stageOverrides };
}
