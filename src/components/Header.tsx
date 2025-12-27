@@ .. @@
 import React from 'react';
-import { Link } from 'react-router-dom';
+import { Link, useNavigate } from 'react-router-dom';
 import { useAuth } from '../hooks/useAuth';
-import { Plus, User, LogOut, Search } from 'lucide-react';
+import { Plus, User, LogOut, Search, CreditCard } from 'lucide-react';
+import { PremiumBadge } from './PremiumBadge';
 
 export function Header() {
   const { user, signOut } = useAuth();
+  const navigate = useNavigate();
 
   return (
@@ .. @@
         <div className="flex items-center space-x-4">
           {user ? (
             <>
+              <PremiumBadge />
               <Link
                 to="/post"
                 className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
@@ .. @@
                 <Plus className="w-4 h-4" />
                 Post Ad
               </Link>
+              <button
+                onClick={() => navigate('/pricing')}
+                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
+              >
+                <CreditCard className="w-4 h-4" />
+                Premium
+              </button>
               <div className="flex items-center space-x-2">
                 <User className="w-5 h-5 text-gray-600" />
                 <span className="text-gray-700">{user.email}</span>