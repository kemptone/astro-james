import { useEffect, useState } from "preact/hooks";
import database, { DB_NAME, DB_STORE_NAME, DB_VERSION } from "./database.tsx";

interface Recording {
  audioURL: string;
  timestamp: number;
  id: number;
}

export default () => {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [refreshId, refreshDB] = useState(1);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream);
      recorder.addEventListener("dataavailable", handleDataAvailable);
      setRecorder(recorder);
    });
  }, []);

  useEffect(() => {
    // opens the connection to the IndexDB database

    database((db) => {
      const tx = db.transaction(DB_STORE_NAME, "readonly");
      // object store
      const store = tx.objectStore(DB_STORE_NAME);
      const request = store.openCursor();
      const audios: Recording[] = [];
      // deno-lint-ignore no-explicit-any
      request.onsuccess = (event: any) => {
        const cursor: IDBCursorWithValue = event.target.result;
        if (cursor) {
          audios.push({
            audioURL: URL.createObjectURL(cursor.value.blob),
            timestamp: cursor.value.timestamp,
            id: cursor.value.id,
          });
          cursor.continue();
        } else {
          setRecordings(audios);
        }
        console.count("how many");
      };

      // deno-lint-ignore no-explicit-any
      tx.onerror = (event: any) => {
        console.error(
          "Failed to read recordings from IndexedDB:",
          event.currentTarget.error,
        );
      };
    });
  }, [refreshId]);

  const startRecording = () => {
    recorder?.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recorder?.stop();
    setIsRecording(false);
  };

  const handleDataAvailable = (e: BlobEvent) => {
    const blob = e.data;
    // setAudioURL(URL.createObjectURL(blob));
    saveAudio(blob);
  };

  const deleteRecording = (id: number) => {
    database((db) => {
      const tx = db.transaction(DB_STORE_NAME, "readwrite");
      const store = tx.objectStore(DB_STORE_NAME);
      const request = store.getKey(id);
      request.onsuccess = (event: any) => {
        const key = event.target.result;
        if (key !== undefined) {
          store.delete(key);
        }

        tx.oncomplete = () => {
          refreshDB(Math.random());
        };

        tx.onerror = () => {
          refreshDB(Math.random());
        };
      };
    });
  };

  const saveAudio = (blob: Blob) => {
    database((db) => {
      const tx = db.transaction(DB_STORE_NAME, "readwrite");
      const store = tx.objectStore(DB_STORE_NAME);
      const timestamp = Date.now();
      const data = { blob, timestamp };

      store.add(data);

      tx.oncomplete = () => {
        console.log("Audio saved to IndexedDB:", data);
        setRecordings((prev) => {
          const thing = {
            audioURL: URL.createObjectURL(data.blob),
            timestamp: data.timestamp,
            id: Math.random(),
          };

          return [
            ...prev,
            thing,
          ];
        });
        // refreshDB(Math.random());
      };
      tx.onerror = (event: any) => {
        console.error(
          "Failed to save audio to IndexedDB:",
          event.currentTarget.error,
        );
      };
    });
  };

  return {
    recorder,
    setRecorder,
    recordings,
    setRecordings,
    isRecording,
    setIsRecording,
    startRecording,
    stopRecording,
    handleDataAvailable,
    saveAudio,
    deleteRecording,
  };
};
