import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Common Pages
import Login from './pages/Login';
import DownloadApp from './pages/DownloadApp';

// VOXdBOOK Pages
import SmartDashboard from './pages/VOXdBOOK/Dashboard';
import SmartTransactions from './pages/VOXdBOOK/Transactions';
import SmartTasks from './pages/VOXdBOOK/Tasks';
import SmartTodos from './pages/VOXdBOOK/Todos';
import SmartCategories from './pages/VOXdBOOK/Categories';
import SmartRenewals from './pages/VOXdBOOK/Renewals';
import SmartReminders from './pages/VOXdBOOK/Reminders';
import DietPlanner from './pages/VOXdBOOK/DietPlanner/index';
import DayPlanner from './pages/VOXdBOOK/DayPlanner/index';
import Notes from './pages/VOXdBOOK/Notes';
import VehicleManagement from './pages/VOXdBOOK/VehicleManagement';
import GoalTracker from './pages/VOXdBOOK/GoalTracker';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  const { initialize, isInitialized } = useAuth();

  useEffect(() => {
    try {
      if (!isInitialized) {
        initialize();
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }, []); // Run only once on mount

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/voxdbook" replace />} />

            {/* Protected routes with Layout */}
            <Route
              path="/voxdbook"
              element={
                <PrivateRoute>
                  <Layout>
                    <SmartDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/transactions"
              element={
                <PrivateRoute>
                  <Layout>
                    <SmartTransactions />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/tasks"
              element={
                <PrivateRoute>
                  <Layout>
                    <SmartTasks />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/todos"
              element={
                <PrivateRoute>
                  <Layout>
                    <SmartTodos />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/categories"
              element={
                <PrivateRoute>
                  <Layout>
                    <SmartCategories />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/diet-planner"
              element={
                <PrivateRoute>
                  <Layout>
                    <DietPlanner />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/day-planner"
              element={
                <PrivateRoute>
                  <Layout>
                    <DayPlanner />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/goal-tracker"
              element={
                <PrivateRoute>
                  <Layout>
                    <GoalTracker />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/renewals"
              element={
                <PrivateRoute>
                  <Layout>
                    <SmartRenewals />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/reminders"
              element={
                <PrivateRoute>
                  <Layout>
                    <SmartReminders />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/notes"
              element={
                <PrivateRoute>
                  <Layout>
                    <Notes />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/vehicle-management"
              element={
                <PrivateRoute>
                  <Layout>
                    <VehicleManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/download"
              element={<DownloadApp />}
            />


            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
