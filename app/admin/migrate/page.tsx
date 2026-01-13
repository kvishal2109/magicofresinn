"use client";

import { useState, useEffect } from "react";
import { Database, Upload, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface MigrationStatus {
  blobStorage: { count: number };
  supabase: { count: number };
  migrationNeeded: boolean;
}

interface MigrationResult {
  success: boolean;
  message: string;
  error?: string;
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results?: Array<{ productId: string; success: boolean; message: string }>;
}

export default function MigratePage() {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [options, setOptions] = useState({
    migrateImages: true,
    skipExisting: true,
    batchSize: 10,
  });

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/admin/migrate/products");
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      setStatus(data);
    } catch (error: any) {
      toast.error("Failed to fetch migration status");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleMigrate = async () => {
    if (!status?.migrationNeeded) {
      toast.error("No migration needed - all products are already in Supabase");
      return;
    }

    setMigrating(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/migrate/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      const data: MigrationResult = await response.json();

      if (data.success) {
        toast.success(data.message);
        setResult(data);
        fetchStatus(); // Refresh status
      } else {
        toast.error(data.error || "Migration failed");
        setResult(data);
      }
    } catch (error: any) {
      toast.error("Migration failed: " + error.message);
      console.error(error);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Migration</h1>
        <p className="text-gray-600 mt-1">
          Migrate products from Blob Storage to Supabase and Cloudinary
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Migration Status</h2>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {status ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Blob Storage</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{status.blobStorage.count}</p>
              <p className="text-xs text-gray-500 mt-1">products</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Supabase</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{status.supabase.count}</p>
              <p className="text-xs text-gray-500 mt-1">products</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {status.migrationNeeded ? (
                  <XCircle className="w-5 h-5 text-orange-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                <span className="text-sm font-medium text-gray-600">Status</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {status.migrationNeeded ? "Migration Needed" : "Up to Date"}
              </p>
              {status.migrationNeeded && (
                <p className="text-xs text-orange-600 mt-1">
                  {status.blobStorage.count - status.supabase.count} products to migrate
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Migration Options */}
      {status?.migrationNeeded && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Migration Options</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.migrateImages}
                onChange={(e) =>
                  setOptions({ ...options, migrateImages: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Migrate Images to Cloudinary
                </span>
                <p className="text-xs text-gray-500">
                  Upload product images to Cloudinary (images already on Cloudinary will be skipped)
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.skipExisting}
                onChange={(e) =>
                  setOptions({ ...options, skipExisting: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Skip Existing Products
                </span>
                <p className="text-xs text-gray-500">
                  Skip products that already exist in Supabase (recommended)
                </p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Batch Size: {options.batchSize}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={options.batchSize}
                onChange={(e) =>
                  setOptions({ ...options, batchSize: parseInt(e.target.value) })
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of products to process at once (smaller = more reliable, larger = faster)
              </p>
            </div>
          </div>

          <button
            onClick={handleMigrate}
            disabled={migrating || !status.migrationNeeded}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {migrating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Migrating...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Start Migration</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Migration Results */}
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Migration Results</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{result.total}</p>
            </div>
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <p className="text-sm font-medium text-green-700 mb-1">Successful</p>
              <p className="text-2xl font-bold text-green-700">{result.successful}</p>
            </div>
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <p className="text-sm font-medium text-red-700 mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-700">{result.failed}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-1">Skipped</p>
              <p className="text-2xl font-bold text-gray-900">{result.skipped}</p>
            </div>
          </div>

          {result.results && result.results.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Detailed Results</h3>
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Product ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {result.results.map((r, idx) => (
                      <tr key={idx} className={r.success ? "bg-white" : "bg-red-50"}>
                        <td className="px-4 py-2 font-mono text-xs">{r.productId}</td>
                        <td className="px-4 py-2">
                          {r.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-600">{r.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Migration Information</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Products will be migrated from Vercel Blob Storage to Supabase</li>
          <li>Product images will be uploaded to Cloudinary (if enabled)</li>
          <li>Product IDs, timestamps, and all metadata will be preserved</li>
          <li>Existing products in Supabase will be skipped (if enabled)</li>
          <li>The migration process may take several minutes depending on the number of products</li>
        </ul>
      </div>
    </div>
  );
}

