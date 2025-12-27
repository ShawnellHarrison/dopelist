@@ .. @@
 import { supabase } from '../lib/supabase';
 import { useAuth } from '../hooks/useAuth';
+import { useStripe } from '../hooks/useStripe';
 import { Upload, X, MapPin, DollarSign, Calendar, Tag } from 'lucide-react';
+import { Link } from 'react-router-dom';
 
 interface Category {
@@ .. @@
 export function PostForm() {
   const navigate = useNavigate();
   const { user } = useAuth();
+  const { hasPremiumAccess } = useStripe();
   const [categories, setCategories] = useState<Category[]>([]);
@@ .. @@
         </div>
       </div>

+      {!hasPremiumAccess && (
+        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
+          <div className="flex items-start">
+            <div className="flex-shrink-0">
+              <Tag className="w-5 h-5 text-yellow-600" />
+            </div>
+            <div className="ml-3">
+              <h3 className="text-sm font-medium text-yellow-800">
+                Upgrade to Premium for Better Results
+              </h3>
+              <p className="mt-1 text-sm text-yellow-700">
+                Premium listings get 5x more views and sell 3x faster. Get enhanced visibility, priority placement, and more features.
+              </p>
+              <div className="mt-3">
+                <Link
+                  to="/pricing"
+                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 transition-colors"
+                >
+                  Learn More
+                </Link>
+              </div>
+            </div>
+          </div>
+        </div>
+      )}
+
       <form onSubmit={handleSubmit} className="space-y-6">