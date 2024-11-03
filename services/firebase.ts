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
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category, Expense, Bill, Income, MonthlyBudget } from '@/components/BudgetDashboard';
import { formatDateForDB } from '@/utils/dates';
import { format } from 'date-fns';

export const addCategory = async (userId: string, category: Omit<Category, 'id' | 'spent'>) => {
  try {
    const docRef = await addDoc(collection(db, 'categories'), {
      name: category.name,
      budget: category.budget,
      spent: 0,
      userId,
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

      if (categoryDoc.data().userId !== userId) {
        throw new Error('Unauthorized');
      }

      categoryData = categoryDoc.data();
      const currentSpent = categoryData.spent || 0;
      const newSpent = currentSpent + expense.amount;
      remaining = categoryData.budget - newSpent;

      transaction.update(categoryRef, {
        spent: newSpent,
      });

      const expenseRef = doc(collection(db, 'expenses'));
      transaction.set(expenseRef, {
        ...expense,
        userId,
        createdAt: serverTimestamp(),
      });
    });

    return {
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
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        categoryId: data.categoryId,
        amount: data.amount,
        description: data.description,
        date: data.date,
        month: data.month || format(new Date(data.date), 'yyyy-MM')
      };
    });
  } catch (error: any) {
    console.error('Error getting expenses:', error);
    if (error.message?.includes('requires an index')) {
      throw error;
    }
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
      // First, do all reads
      const expenseRef = doc(db, 'expenses', expenseId);
      const expenseDoc = await transaction.get(expenseRef);
      
      if (!expenseDoc.exists()) {
        throw new Error('Expense not found');
      }

      const categoryRef = doc(db, 'categories', categoryId);
      const categoryDoc = await transaction.get(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Category not found');
      }

      // Verify ownership
      if (expenseDoc.data().userId !== userId) {
        throw new Error('Unauthorized');
      }
      
      // Then, do all writes
      const currentSpent = categoryDoc.data().spent || 0;
      
      // Update category spent amount
      transaction.update(categoryRef, {
        spent: Math.max(0, currentSpent - amount), // Prevent negative values
        updatedAt: serverTimestamp()
      });
      
      // Delete the expense
      transaction.delete(expenseRef);
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw new Error('Failed to delete expense');
  }
};

export const getUserCategoryById = async (
  userId: string,
  categoryId: string
): Promise<Category> => {
  try {
    const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
    if (!categoryDoc.exists() || categoryDoc.data().userId !== userId) {
      throw new Error('Category not found');
    }
    
    const data = categoryDoc.data();
    return {
      id: categoryDoc.id,
      name: data.name,
      budget: data.budget,
      spent: data.spent || 0,
    };
  } catch (error) {
    console.error('Error getting category:', error);
    throw new Error('Failed to fetch category');
  }
};

export const getUserExpensesByCategory = async (
  userId: string,
  categoryId: string,
  month: string
): Promise<Expense[]> => {
  try {
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      where('categoryId', '==', categoryId),
      where('month', '==', month),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        categoryId: data.categoryId,
        amount: data.amount,
        description: data.description,
        date: data.date,
        month: data.month
      };
    });
  } catch (error: any) {
    console.error('Error getting category expenses:', error);
    if (error.message?.includes('requires an index')) {
      throw error;
    }
    throw new Error('Failed to fetch category expenses');
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

// New interfaces
interface FirebaseBill extends Omit<Bill, 'id'> {}
interface FirebaseIncome extends Omit<Income, 'id'> {}

// Bills Collection Functions
export async function getUserBills(userId: string): Promise<Bill[]> {
  try {
    const billsRef = collection(db, 'users', userId, 'bills');
    const q = query(billsRef, orderBy('dueDate', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Bill[];
  } catch (error) {
    console.error('Error getting bills:', error);
    throw error;
  }
}

export async function addBill(userId: string, bill: Omit<Bill, 'id'>): Promise<Bill> {
  try {
    const billsRef = collection(db, 'users', userId, 'bills');
    const docRef = await addDoc(billsRef, {
      ...bill,
      isRecurring: bill.isRecurring || false,
      createdAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...bill,
      isRecurring: bill.isRecurring || false
    };
  } catch (error) {
    console.error('Error adding bill:', error);
    throw error;
  }
}

export async function updateBill(userId: string, billId: string, updates: Partial<Bill>): Promise<void> {
  try {
    // Ensure we're using the base bill ID
    const baseId = billId.split('_')[0];
    const billRef = doc(db, 'users', userId, 'bills', baseId);
    
    // Verify the document exists before updating
    const billDoc = await getDoc(billRef);
    if (!billDoc.exists()) {
      throw new Error('Bill not found');
    }

    await updateDoc(billRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    throw error;
  }
}

export async function deleteBill(userId: string, billId: string): Promise<void> {
  try {
    const billRef = doc(db, 'users', userId, 'bills', billId);
    await deleteDoc(billRef);
  } catch (error) {
    console.error('Error deleting bill:', error);
    throw error;
  }
}

// Income Collection Functions
export async function getUserIncomes(userId: string): Promise<Income[]> {
  try {
    const incomesRef = collection(db, 'users', userId, 'incomes');
    const q = query(incomesRef, orderBy('receiveDate', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Income[];
  } catch (error) {
    console.error('Error getting incomes:', error);
    throw error;
  }
}

export async function addIncome(userId: string, income: Omit<Income, 'id'>): Promise<Income> {
  try {
    const incomesRef = collection(db, 'users', userId, 'incomes');
    const docRef = await addDoc(incomesRef, {
      ...income,
      createdAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...income
    };
  } catch (error) {
    console.error('Error adding income:', error);
    throw error;
  }
}

export async function updateIncome(userId: string, incomeId: string, updates: Partial<Income>): Promise<void> {
  try {
    const incomeRef = doc(db, 'users', userId, 'incomes', incomeId);
    await updateDoc(incomeRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating income:', error);
    throw error;
  }
}

export async function deleteIncome(userId: string, incomeId: string): Promise<void> {
  try {
    const incomeRef = doc(db, 'users', userId, 'incomes', incomeId);
    await deleteDoc(incomeRef);
  } catch (error) {
    console.error('Error deleting income:', error);
    throw error;
  }
}

export async function toggleBillPaid(
  userId: string, 
  billId: string, 
  bill: Bill, 
  categoryId?: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      // First, do all reads
      const billRef = doc(db, 'users', userId, 'bills', billId);
      
      let categoryDoc;
      if (!bill.isPaid && categoryId) {
        const categoryRef = doc(db, 'categories', categoryId);
        categoryDoc = await transaction.get(categoryRef);
        if (!categoryDoc.exists()) {
          throw new Error('Category not found');
        }
      }

      // Then, do all writes
      const updates = {
        isPaid: !bill.isPaid,
        lastPaid: !bill.isPaid ? formatDateForDB(new Date()) : null
      };
      
      transaction.update(billRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // If marking as paid and we have a category, create an expense
      if (!bill.isPaid && categoryId && categoryDoc) {
        const currentSpent = categoryDoc.data().spent || 0;
        
        // Update category spent amount
        transaction.update(doc(db, 'categories', categoryId), {
          spent: currentSpent + bill.amount,
        });

        // Create expense
        const expenseRef = doc(collection(db, 'expenses'));
        transaction.set(expenseRef, {
          userId,
          categoryId,
          amount: bill.amount,
          description: `Bill Payment: ${bill.title}`,
          date: formatDateForDB(new Date()),
          createdAt: serverTimestamp(),
          billId: billId
        });
      }
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    throw error;
  }
}

// Add these new functions
export const getMonthlyBudgets = async (userId: string, month: string): Promise<MonthlyBudget[]> => {
  try {
    const q = query(
      collection(db, 'monthlyBudgets'),
      where('userId', '==', userId),
      where('month', '==', month)
    );
    const snapshot = await getDocs(q);
    const budgets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MonthlyBudget[];

    // Get categories to add names if they're missing
    const categories = await getUserCategories(userId);
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

    return budgets.map(budget => ({
      ...budget,
      categoryName: budget.categoryName || categoryMap.get(budget.categoryId)?.name
    }));
  } catch (error) {
    console.error('Error getting monthly budgets:', error);
    throw error;
  }
};

export const getMonthlyExpenses = async (userId: string, month: string): Promise<Expense[]> => {
  try {
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      where('month', '==', month),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        categoryId: data.categoryId,
        amount: data.amount,
        description: data.description,
        date: data.date,
        month: data.month
      };
    });
  } catch (error: any) {
    console.error('Error getting monthly expenses:', error);
    if (error.message?.includes('requires an index')) {
      throw error;
    }
    throw new Error('Failed to fetch monthly expenses');
  }
};

export const updateMonthlyBudget = async (
  userId: string,
  budgetId: string,
  updates: Partial<MonthlyBudget>
): Promise<void> => {
  try {
    const budgetRef = doc(db, 'monthlyBudgets', budgetId);
    await updateDoc(budgetRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating monthly budget:', error);
    throw error;
  }
};

// Add function to copy current categories to monthly budgets
export const initializeMonthlyBudgets = async (userId: string, month: string): Promise<void> => {
  try {
    const categories = await getUserCategories(userId);
    const batch = writeBatch(db);
    
    for (const category of categories) {
      const monthlyBudgetRef = doc(collection(db, 'monthlyBudgets'));
      batch.set(monthlyBudgetRef, {
        userId,
        month,
        categoryId: category.id,
        budget: category.budget,
        spent: 0,
        createdAt: serverTimestamp()
      });
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error initializing monthly budgets:', error);
    throw error;
  }
};

// Add function to get or create monthly budgets
export const getOrCreateMonthlyBudgets = async (userId: string, month: string): Promise<MonthlyBudget[]> => {
  try {
    // First, get existing monthly budgets
    const existingBudgets = await getMonthlyBudgets(userId, month);
    
    // If we have budgets for this month, return them
    if (existingBudgets.length > 0) {
      // Get categories to add names
      const categories = await getUserCategories(userId);
      const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
      
      return existingBudgets.map(budget => ({
        ...budget,
        categoryName: categoryMap.get(budget.categoryId)?.name
      }));
    }

    // If no budgets exist for this month, create them from current categories
    const categories = await getUserCategories(userId);
    const batch = writeBatch(db);
    
    // Create a new monthly budget for each category
    const newBudgets: MonthlyBudget[] = [];
    
    for (const category of categories) {
      const monthlyBudgetRef = doc(collection(db, 'monthlyBudgets'));
      const newBudget: MonthlyBudget = {
        id: monthlyBudgetRef.id,
        month,
        categoryId: category.id,
        budget: category.budget,
        spent: 0,
        userId,
        categoryName: category.name
      };
      
      batch.set(monthlyBudgetRef, {
        userId,
        month,
        categoryId: category.id,
        budget: category.budget,
        spent: 0,
        categoryName: category.name,
        createdAt: serverTimestamp()
      });
      
      newBudgets.push(newBudget);
    }
    
    await batch.commit();
    return newBudgets;
  } catch (error) {
    console.error('Error getting/creating monthly budgets:', error);
    throw error;
  }
};