import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';

export async function migrateExpenses() {
  const batch = writeBatch(db);
  const expensesRef = collection(db, 'expenses');
  const snapshot = await getDocs(expensesRef);
  
  let count = 0;
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (!data.month && data.date) {
      batch.update(doc.ref, {
        month: format(new Date(data.date), 'yyyy-MM')
      });
      count++;
    }
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`Updated ${count} expenses with month field`);
  }
} 