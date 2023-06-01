import { Component, h } from "preact";

class AudioRecorder extends Component {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private recorderNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private audioChunks: Float32Array[] = [];
  private silenceThreshold = -50;

  startRecording = async () => {
    try {
      // Request permission to access the user's microphone
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create an AudioContext object
      this.audioContext = new AudioContext();

      // Create a MediaStreamAudioSourceNode from the audio stream
      const sourceNode = this.audioContext.createMediaStreamSource(this.stream);

      // Create a ScriptProcessorNode to capture the audio data and store it in a buffer
      this.recorderNode = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.recorderNode.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        this.audioChunks.push(inputData);
      };

      // Use an AnalyserNode to detect long moments of silence
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Connect the nodes
      sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.recorderNode);
      this.recorderNode.connect(this.audioContext.destination);
    } catch (error) {
      console.error("Error starting audio recording:", error);
    }
  };

  stopRecording = async () => {
    try {
      // Stop the audio recording and clean up
      this.stream?.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
      this.recorderNode?.disconnect();
      this.analyserNode?.disconnect();
      this.audioContext = null;

      // Determine the threshold for silence and break the audio data into parts
      const mergedData = new Float32Array(
        this.audioChunks.reduce((acc, chunk) => acc + chunk.length, 0),
      );
      let offset = 0;
      this.audioChunks.forEach((chunk) => {
        mergedData.set(chunk, offset);
        offset += chunk.length;
      });
      const threshold = this.calculateSilenceThreshold(mergedData);
      const audioChunks = this.splitAudioBySilence(mergedData, threshold);

      // Create an AudioBuffer object from the processed audio data using the AudioContext interface
      const audioBuffer = this.audioContext.createBuffer(
        1,
        mergedData.length,
        this.audioContext.sampleRate,
      );
      const audioData = audioBuffer.getChannelData(0);
      audioData.set(mergedData);

      // Store the AudioBuffer object in the local browser database using the IndexedDB API
      const db = await this.openDatabase();
      const transaction = db.transaction("audio", "readwrite");
      const store = transaction.objectStore("audio");
      const request = store.add(audioBuffer, new Date().getTime());
      request.onerror = (event) => {
        console.error("Error storing audio in database:", event.target.error);
      };
    } catch (error) {
      console.error("Error stopping audio recording:", error);
    }
  };

  calculateSilenceThreshold(data: Float32Array) {
    const values = data.filter((value) => value !== 0);
    const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
    const variance =
      values.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) /
      values.length;
    const standardDeviation = Math.sqrt(variance);
    return mean - standardDeviation * 2;
  }

  splitAudioBySilence(data: Float32Array, threshold: number) {
    const chunks = [];
    let chunk = new Float32Array(0);
    let isSilent = true;
    for (let i = 0; i < data.length; i++) {
      if (isSilent && data[i] > threshold) {
        isSilent = false;
      }
      if (!isSilent && data[i] < threshold) {
        isSilent = true;
        chunks.push(chunk);
        chunk = new Float32Array(0);
      }
      chunk = appendToArray(chunk, data[i]);
    }
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    return chunks;
  }

  async openDatabase() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("audioDatabase");
      request.onerror = (event) => {
        console.error("Error opening database:", event?.target?.error);
        reject(event?.target?.error);
      };
      request.onsuccess = (event) => {
        resolve(event?.target?.result);
      };
      request.onupgradeneeded = (event) => {
        const db = event?.target?.result;
        const store = db.createObjectStore("audio", { keyPath: "timestamp" });
        store.createIndex("timestamp", "timestamp", { unique: true });
      };
    });
  }

  render() {
    return (
      <div style={{ marginBlock: "300px" }}>
        <button onClick={this.startRecording}>Start Recording</button>
        <button onClick={this.stopRecording}>Stop Recording</button>
      </div>
    );
  }
}

function appendToArray(array: Float32Array, value: number) {
  const newArray = new Float32Array(array.length + 1);
  newArray.set(array);
  newArray[newArray.length - 1] = value;
  return newArray;
}

export default AudioRecorder;
