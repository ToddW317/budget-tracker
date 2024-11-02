import { 
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category, Expense } from '@/components/BudgetDashboard';

export const addCategory = async (userId: string, category: Omit<Category, 'id' | 'spent'>) => {
  try {
    const docRef = await addDoc(collection(db, 'categories'), {
      name: category.name,
      budget: category.budget,
      spent: 0,
      userId: userId,
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      name: category.name,
      budget: category.budget,
      spent: 0,
    };
  } catch (error) {
    console.error('Error adding category:', error);
    throw new Error('Failed to add category');
  }
};

export const addExpense = async (userId: string, expense: Omit<Expense, 'id'>) => {
  try {
    const expenseRef = await addDoc(collection(db, 'expenses'), {
      ...expense,
      userId,
      createdAt: serverTimestamp(),
    });

    await runTransaction(db, async (transaction) => {
      const categoryRef = doc(db, 'categories', expense.categoryId);
      const categoryDoc = await transaction.get(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Category not found');
      }

      const currentSpent = categoryDoc.data().spent || 0;
      transaction.update(categoryRef, {
        spent: currentSpent + expense.amount,
      });
    });

    return {
      id: expenseRef.id,
      ...expense,
    };
  } catch (error) {
    console.error('Error adding expense:', error);
    throw new Error('Failed to add expense');
  }
};

export const getUserCategories = async (userId: string): Promise<Category[]> => {
  try {
    const q = query(collection(db, 'categories'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      budget: doc.data().budget,
      spent: doc.data().spent || 0,
    }));
  } catch (error) {
    console.error('Error getting categories:', error);
    throw new Error('Failed to fetch categories');
  }
};

export const getUserExpenses = async (userId: string): Promise<Expense[]> => {
  try {
    const q = query(collection(db, 'expenses'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      categoryId: doc.data().categoryId,
      amount: doc.data().amount,
      description: doc.data().description,
      date: doc.data().date,
    }));
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw new Error('Failed to fetch expenses');
  }
}; 