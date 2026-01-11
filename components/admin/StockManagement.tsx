'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { Edit, X, Check } from 'lucide-react'

type Product = Database['public']['Tables']['products']['Row']

export default function StockManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const supabase = useMemo(() => {
    if (typeof window !== 'undefined') {
      return createClient()
    }
    return null
  }, [])

  useEffect(() => {
    if (!supabase) return
    loadProducts()
  }, [supabase])

  const loadProducts = async () => {
    // Get user's restaurant_id
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('restaurant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.restaurant_id) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', userProfile.restaurant_id)
      .order('name')

    if (data) {
      setProducts(data)
    }
    setLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingProduct) return

    const formData = new FormData(e.currentTarget)
    const stockQuantity = parseInt(formData.get('stock_quantity') as string)
    const stockEnabled = formData.get('stock_enabled') === 'on'

    const updateData: Partial<Product> = {
      stock_quantity: stockQuantity,
      stock_enabled: stockEnabled,
    }

    // If stock is enabled and quantity is 0, set product as inactive
    if (stockEnabled && stockQuantity === 0) {
      updateData.is_active = false
    } else if (stockEnabled && stockQuantity > 0) {
      // If stock is enabled and quantity > 0, set product as active
      updateData.is_active = true
    }

    const { error } = await supabase
      .from('products')
      .update(updateData as any)
      .eq('id', editingProduct.id)

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      await loadProducts()
      setEditingProduct(null)
    }
  }

  const toggleStockEnabled = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ stock_enabled: !product.stock_enabled } as any)
      .eq('id', product.id)

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      await loadProducts()
    }
  }

  const getStockStatus = (product: Product) => {
    if (!product.stock_enabled) {
      return { text: 'Stok Takibi Kapalı', color: 'bg-gray-100 text-gray-800' }
    }
    if (product.stock_quantity === 0) {
      return { text: 'Stok Tükendi', color: 'bg-red-100 text-red-800' }
    }
    if (product.stock_quantity < 5) {
      return { text: 'Düşük Stok', color: 'bg-yellow-100 text-yellow-800' }
    }
    return { text: 'Stokta Var', color: 'bg-green-100 text-green-800' }
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <div className="space-y-4">
      {/* Edit Form */}
      {editingProduct && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">
              Stok Düzenle - {editingProduct.name}
            </h4>
            <button
              onClick={() => setEditingProduct(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stok Miktarı
              </label>
              <input
                type="number"
                name="stock_quantity"
                min="0"
                defaultValue={editingProduct.stock_quantity}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="stock_enabled"
                defaultChecked={editingProduct.stock_enabled}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                Stok Takibi Açık
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Kaydet
              </button>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ürün Adı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stok Durumu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stok Miktarı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stok Takibi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const stockStatus = getStockStatus(product)
              return (
                <tr key={product.id}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div>{product.name}</div>
                    <div className="md:hidden mt-1 space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded inline-block ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded inline-block ${
                        product.stock_enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.stock_enabled ? 'Açık' : 'Kapalı'}
                      </span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${stockStatus.color}`}
                    >
                      {stockStatus.text}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.stock_enabled ? product.stock_quantity : '∞'}
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        product.stock_enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.stock_enabled ? 'Açık' : 'Kapalı'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Düzenle"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">Ürün bulunamadı</div>
        )}
      </div>
    </div>
  )
}
