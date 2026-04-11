import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import AppLayout from '@/components/layout/AppLayout'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import PrivateRoute from '@/routes/PrivateRoute'
import PublicRoute from '@/routes/PublicRoute'

import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Suspended from '@/pages/Suspended'
import StoreSetup from '@/pages/StoreSetup'
import Explore from '@/pages/Explore'
import Search from '@/pages/Search'
import Wishlist from '@/pages/Wishlist'
import Following from '@/pages/Following'
import Messages from '@/pages/Messages'
import ListingDetail from '@/pages/ListingDetail'
import StorePage from '@/pages/StorePage'
import CreateListing from '@/pages/CreateListing'
import Dashboard from '@/pages/Dashboard'
import DashboardSettings from '@/pages/DashboardSettings'
import Profile from '@/pages/Profile'
import AdminOverview from '@/pages/admin/AdminOverview'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminListings from '@/pages/admin/AdminListings'
import AdminStores from '@/pages/admin/AdminStores'
import AdminReports from '@/pages/admin/AdminReports'
import AdminSettings from '@/pages/admin/AdminSettings'

export default function App() {
  const user = useAuthStore((s) => s.user)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route path="/suspended" element={<Suspended />} />

        <Route
          path="/"
          element={
            user ? (
              <AppLayout>
                <Home />
              </AppLayout>
            ) : (
              <Home />
            )
          }
        />

        <Route
          path="/explore"
          element={
            <AppLayout>
              <Explore />
            </AppLayout>
          }
        />
        <Route
          path="/search"
          element={
            <AppLayout>
              <Search />
            </AppLayout>
          }
        />
        <Route
          path="/listing/:id"
          element={
            <AppLayout>
              <ListingDetail />
            </AppLayout>
          }
        />
        <Route
          path="/store/:handle"
          element={
            <AppLayout>
              <StorePage />
            </AppLayout>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <AppLayout>
                <Profile />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <PrivateRoute>
              <AppLayout>
                <Wishlist />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/following"
          element={
            <PrivateRoute>
              <AppLayout>
                <Following />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <PrivateRoute>
              <AppLayout>
                <Messages />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/store-setup"
          element={
            <PrivateRoute>
              <AppLayout>
                <StoreSetup />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AppLayout>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/listings"
          element={
            <PrivateRoute>
              <AppLayout>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/create"
          element={
            <PrivateRoute>
              <AppLayout>
                <DashboardLayout>
                  <CreateListing />
                </DashboardLayout>
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/social"
          element={
            <PrivateRoute>
              <AppLayout>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <PrivateRoute>
              <AppLayout>
                <DashboardLayout>
                  <DashboardSettings />
                </DashboardLayout>
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AppLayout>
                <AdminLayout>
                  <AdminOverview />
                </AdminLayout>
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute>
              <AppLayout>
                <AdminLayout>
                  <AdminUsers />
                </AdminLayout>
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/listings"
          element={
            <PrivateRoute>
              <AppLayout>
                <AdminLayout>
                  <AdminListings />
                </AdminLayout>
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/stores"
          element={
            <PrivateRoute>
              <AppLayout>
                <AdminLayout>
                  <AdminStores />
                </AdminLayout>
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <PrivateRoute>
              <AppLayout>
                <AdminLayout>
                  <AdminReports />
                </AdminLayout>
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute>
              <AppLayout>
                <AdminLayout>
                  <AdminSettings />
                </AdminLayout>
              </AppLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
