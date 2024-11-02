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
  writeBatch,
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
    let categoryData: any;
    let remaining: number;
  
    await runTransaction(db, async (transaction) => {
      const categoryRef = doc(db, 'categories', expense.categoryId);
      const categoryDoc = await transaction.get(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Category not found');
      }

      categoryData = categoryDoc.data();
      const currentSpent = categoryData.spent || 0;
      const newSpent = currentSpent + expense.amount;
      remaining = categoryData.budget - newSpent;

      transaction.update(categoryRef, {
        spent: newSpent,
      });
    });

    // Add the expense document
    const expenseRef = await addDoc(collection(db, 'expenses'), {
      ...expense,
      userId,
      createdAt: serverTimestamp(),
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

/* export const sendSMSNotification = async (
  phoneNumber: string,
  categoryName: string,
  spent: number,
  remaining: number
) => {
  try {
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        categoryName,
        spent,
        remaining
      }),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to send SMS');
    }

    await addDoc(collection(db, 'messages'), {
      to: phoneNumber,
      body: `Budget Update: You spent $${spent.toFixed(2)} on ${categoryName}. $${remaining.toFixed(2)} remaining in this category.`,
      sid: data.sid,
      status: 'sent',
      createdAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('Failed to send SMS notification');
  }
}; */

export const updateCategory = async (userId: string, categoryId: string, updates: Partial<Category>) => {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return {
      id: categoryId,
      ...updates,
    };
  } catch (error) {
    console.error('Error updating category:', error);
    throw new Error('Failed to update category');
  }
};

export const deleteCategory = async (userId: string, categoryId: string) => {
  try {
    // Start a batch operation
    const batch = writeBatch(db);
    
    // Delete the category
    const categoryRef = doc(db, 'categories', categoryId);
    batch.delete(categoryRef);
    
    // Delete associated expenses
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      where('categoryId', '==', categoryId)
    );
    const expensesDocs = await getDocs(expensesQuery);
    expensesDocs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Commit the batch
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw new Error('Failed to delete category');
  }
};

export const deleteExpense = async (userId: string, expenseId: string, categoryId: string, amount: number) => {
  try {
    await runTransaction(db, async (transaction) => {
      // Delete the expense
      const expenseRef = doc(db, 'expenses', expenseId);
      transaction.delete(expenseRef);
      
      // Update category spent amount
      const categoryRef = doc(db, 'categories', categoryId);
      const categoryDoc = await transaction.get(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Category not found');
      }
      
      const currentSpent = categoryDoc.data().spent || 0;
      transaction.update(categoryRef, {
        spent: currentSpent - amount,
      });
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw new Error('Failed to delete expense');
  }
};

export const getUserCategoryById = async (userId: string, categoryId: string): Promise<Category> => {
  try {
    const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
    if (!categoryDoc.exists() || categoryDoc.data().userId !== userId) {
      throw new Error('Category not found');
    }
    
    return {
      id: categoryDoc.id,
      name: categoryDoc.data().name,
      budget: categoryDoc.data().budget,
      spent: categoryDoc.data().spent || 0,
    };
  } catch (error) {
    console.error('Error getting category:', error);
    throw new Error('Failed to fetch category');
  }
};

export const getUserExpensesByCategory = async (userId: string, categoryId: string): Promise<Expense[]> => {
  try {
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      where('categoryId', '==', categoryId)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      categoryId: doc.data().categoryId,
      amount: doc.data().amount,
      description: doc.data().description,
      date: doc.data().date,
    }));
  } catch (error) {
    console.error('Error getting category expenses:', error);
    throw new Error('Failed to fetch expenses');
  }
};

export const updateExpense = async (userId: string, expenseId: string, updates: Partial<Expense>) => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    await updateDoc(expenseRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return {
      id: expenseId,
      ...updates,
    };
  } catch (error) {
    console.error('Error updating expense:', error);
    throw new Error('Failed to update expense');
  }
};