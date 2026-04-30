import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface MemorySession {
  id?: string;
  timestamp: any;
  input: string;
  agent1Analysis: any;
  agent2Output: any;
  agent3Output: any;
  ssfParams: any;
}

export const saveMemorySession = async (session: Omit<MemorySession, 'timestamp'>) => {
  try {
    await addDoc(collection(db, 'memories'), {
      ...session,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Firebase persistence failed:", err);
  }
};

export const subscribeToMemories = (callback: (memories: MemorySession[]) => void) => {
  const q = query(
    collection(db, 'memories'),
    orderBy('timestamp', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const memories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MemorySession[];
    callback(memories);
  });
};

export const clearMemories = async () => {
  try {
    console.log("MemoryService: Initiating archive dismantle...");
    const q = query(collection(db, 'memories'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("MemoryService: Archive already empty.");
      return;
    }

    console.log(`MemoryService: Found ${snapshot.size} entries to dismantle.`);
    const deletePromises = snapshot.docs.map(d => {
      console.log(`MemoryService: Dismantling entry ${d.id}`);
      return deleteDoc(doc(db, 'memories', d.id));
    });
    
    await Promise.all(deletePromises);
    console.log("MemoryService: Archive dismantled successfully.");
  } catch (err) {
    console.error("MemoryService: Archive dismantle FAILED:", err);
    throw err;
  }
};
