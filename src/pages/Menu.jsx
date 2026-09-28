import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuAPI } from '../services/api';
import { useCart } from '../context/CartContext';

export default function Menu() {
  const navigate = useNavigate();
  const { cart, addItem, getItemCount, getSubtotal } = useCart();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const res = await menuAPI.getMenu();
      setCategories(res.data.categories || []);
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchCat = activeCategory === 'all' || item.category_id === activeCategory;
    const matchSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddItem = (item) => {
    // If item has variants or add-ons → go to details page
    if (item.variants?.length > 0 || item.addons?.length > 0) {
      navigate(`/item/${item.id}`);
      return;
    }

    // Simple item → add directly
    addItem({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      variant_name: null,
      spice_level: null,
      addons: [],
      addons_total: 0,
      special_note: '',
      quantity: 1
    });
  };

  const getItemQty = (itemId) => {
    return cart
      .filter(c => c.id === itemId)
      .reduce((s, c) => s + c.quantity, 0);
  };

  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '16px', color: '#666' }}>Loading menu...</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: cart.length > 0 ? '100px' : '20px' }}>

      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px 20px',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', fontSize: '20px', color: '#333' }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: '800' }}>Menu</h1>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{ background: 'none', fontSize: '20px' }}
          >
            🔍
          </button>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '12px',
              border: '1.5px solid #e5e5e5',
              borderRadius: '10px',
              fontSize: '14px'
            }}
          />
        )}
      </div>

      {/* Categories */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '14px 20px',
        overflowX: 'auto',
        background: '#fff',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: '60px',
        zIndex: 40
      }}>
        <button
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            whiteSpace: 'nowrap',
            background: activeCategory === 'all' ? '#e23744' : '#f0f0f0',
            color: activeCategory === 'all' ? '#fff' : '#333',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              whiteSpace: 'nowrap',
              background: activeCategory === cat.id ? '#e23744' : '#f0f0f0',
              color: activeCategory === cat.id ? '#fff' : '#333',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items */}
      <div style={{ padding: '0 20px' }}>
        {filteredItems.length === 0 ? (
          <p style={{
            textAlign: 'center',
            color: '#999',
            padding: '60px 0'
          }}>
            No items found
          </p>
        ) : (
          filteredItems.map(item => {
            const qty = getItemQty(item.id);
            const hasOptions = item.variants?.length > 0 || item.addons?.length > 0;

            return (
              <div key={item.id} style={{
                display: 'flex',
                gap: '14px',
                padding: '16px 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                {/* Image / Icon */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  flexShrink: 0
                }}>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                    />
                  ) : (
                    '🍽️'
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span className={`veg-dot ${item.is_veg ? '' : 'non-veg'}`} style={{
                      display: 'inline-block',
                      width: '14px',
                      height: '14px',
                      border: item.is_veg ? '1.5px solid #16a34a' : '1.5px solid #b8142a',
                      borderRadius: '3px',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '6px',
                        height: '6px',
                        background: item.is_veg ? '#16a34a' : '#b8142a',
                        borderRadius: '50%'
                      }}></span>
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: '700' }}>{item.name}</h3>
                  </div>

                  {item.description && (
                    <p style={{
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '6px',
                      lineHeight: 1.4
                    }}>
                      {item.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700' }}>
                      ₹{item.price}
                    </span>
                    {hasOptions && (
                      <span style={{
                        fontSize: '10px',
                        color: '#e23744',
                        fontWeight: '600',
                        background: '#fff5f6',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        CUSTOMIZABLE
                      </span>
                    )}
                  </div>

                  {item.is_best_seller && (
                    <span style={{
                      fontSize: '10px',
                      background: '#fef3c7',
                      color: '#b45309',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontWeight: '700'
                    }}>
                      ⭐ Best Seller
                    </span>
                  )}
                </div>

                {/* Add Button */}
                <div style={{ alignSelf: 'center' }}>
                  {qty > 0 ? (
                    <div style={{
                      background: '#e23744',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '700',
                      minWidth: '50px',
                      textAlign: 'center'
                    }}>
                      {qty} ✓
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddItem(item)}
                      style={{
                        background: '#e23744',
                        color: '#fff',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    >
                      ADD
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div
          onClick={() => navigate('/cart')}
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '480px',
            width: '100%',
            background: '#16a34a',
            color: '#fff',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
            zIndex: 60
          }}
        >
          <div>
            <div style={{ fontSize: '13px' }}>{getItemCount()} items</div>
            <div style={{ fontSize: '16px', fontWeight: '800' }}>₹{getSubtotal()}</div>
          </div>
          <div style={{ fontWeight: '700', fontSize: '15px' }}>
            View Cart →
          </div>
        </div>
      )}
    </div>
  );
}