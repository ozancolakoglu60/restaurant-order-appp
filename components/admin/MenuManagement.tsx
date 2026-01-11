'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { Plus, Edit, Trash2, X, Check } from 'lucide-react'

type Product = Database['public']['Tables']['products']['Row']

export default function MenuManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
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
    if (!supabase) return
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

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const form = e.currentTarget
    if (!form || !(form instanceof HTMLFormElement)) {
      alert('Form bulunamadı')
      return
    }

    // FormData'yı hemen oluştur
    const formData = new FormData(form)
    const name = formData.get('name') as string
    const price = parseFloat(formData.get('price') as string)
    const isActive = formData.get('is_active') === 'on'
    
    // Get user's restaurant_id
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Kullanıcı bilgisi alınamadı')
      return
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('restaurant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.restaurant_id) {
      alert('Restoran bilgisi bulunamadı. Lütfen giriş yaptığınızdan emin olun.')
      return
    }

    const { error } = await supabase.from('products').insert({
      restaurant_id: userProfile.restaurant_id,
      name,
      price,
      is_active: isActive,
      stock_quantity: 0,
      stock_enabled: false,
    } as any)

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      await loadProducts()
      setShowAddForm(false)
      form.reset()
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingProduct) return

    const form = e.currentTarget
    if (!form || !(form instanceof HTMLFormElement)) {
      alert('Form bulunamadı')
      return
    }

    // FormData'yı hemen oluştur
    const formData = new FormData(form)
    const name = formData.get('name') as string
    const price = parseFloat(formData.get('price') as string)
    const isActive = formData.get('is_active') === 'on'

    const { error } = await supabase
      .from('products')
      .update({
        name,
        price,
        is_active: isActive,
      })
      .eq('id', editingProduct.id)

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      await loadProducts()
      setEditingProduct(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return

    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      await loadProducts()
    }
  }

  const toggleActive = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      await loadProducts()
    }
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold">Ürünler</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Yeni Ürün Ekle
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">Yeni Ürün Ekle</h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün Adı
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiyat (₺)
              </label>
              <input
                type="number"
                name="price"
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700">Aktif</label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Ekle
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {editingProduct && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">Ürün Düzenle</h4>
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
                Ürün Adı
              </label>
              <input
                type="text"
                name="name"
                defaultValue={editingProduct.name}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiyat (₺)
              </label>
              <input
                type="number"
                name="price"
                step="0.01"
                min="0"
                defaultValue={editingProduct.price}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={editingProduct.is_active}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700">Aktif</label>
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
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ürün Adı
              </th>
              <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fiyat
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Durum
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div>{product.name}</div>
                  <div className="sm:hidden text-xs text-gray-500 mt-1">{product.price.toFixed(2)} ₺</div>
                </td>
                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.price.toFixed(2)} ₺
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      product.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => toggleActive(product)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title={product.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                  >
                    {product.is_active ? (
                      <Check className="w-4 h-4 inline" />
                    ) : (
                      <X className="w-4 h-4 inline" />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Düzenle"
                  >
                    <Edit className="w-4 h-4 inline" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
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
