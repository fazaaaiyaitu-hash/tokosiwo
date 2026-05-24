// Variabel global
let products = [];
let cart = JSON.parse(localStorage.getItem('elysian_cart') || '[]');

// Fungsi helper
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 1800);
}

function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartCount').innerText = total;
    localStorage.setItem('elysian_cart', JSON.stringify(cart));
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID').format(angka);
}

function renderCartModal() {
    const container = document.getElementById('cartItems');
    const totalContainer = document.getElementById('cartTotal');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart"><i class="fas fa-bag-shopping"></i><p>Keranjang masih kosong</p></div>';
        totalContainer.innerHTML = '';
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach((item, idx) => {
        const subtotal = item.price * item.qty;
        total += subtotal;
        html += `
            <div class="cart-item">
                <div><strong>${escapeHtml(item.name)}</strong><br>Rp ${formatRupiah(item.price)}</div>
                <div>
                    <button class="qty-btn" data-idx="${idx}" data-delta="-1" style="background:#eee; border:none; width:28px; border-radius:20px;">-</button>
                    <span style="margin:0 10px;">${item.qty}</span>
                    <button class="qty-btn" data-idx="${idx}" data-delta="1" style="background:#eee; border:none; width:28px; border-radius:20px;">+</button>
                    <button class="remove-item" data-idx="${idx}" style="background:none; border:none; color:#b47c48;"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    totalContainer.innerHTML = `<strong>Total: Rp ${formatRupiah(total)}</strong>`;

    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            const delta = parseInt(btn.dataset.delta);
            const newQty = cart[idx].qty + delta;
            if (newQty <= 0) {
                cart.splice(idx, 1);
            } else {
                cart[idx].qty = newQty;
            }
            updateCartCount();
            renderCartModal();
        };
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            cart.splice(idx, 1);
            updateCartCount();
            renderCartModal();
        };
    });
}

async function loadProducts() {
    const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
    products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProducts();
}

function renderProducts() {
    const container = document.getElementById('productList');
    if (!container) return;
    if (products.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:3rem;">✨ Belum ada produk, cek lagi nanti ✨</div>';
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="product-img"><i class="fas fa-gem"></i></div>
            <div class="product-info">
                <div class="product-title">${escapeHtml(p.name)}</div>
                <div class="product-price">Rp ${formatRupiah(p.price)}</div>
                <p style="font-size:0.8rem; color:#846b53;">${escapeHtml(p.description?.substring(0, 70) || '')}</p>
                <button class="btn-buy" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-price="${p.price}"><i class="fas fa-cart-plus"></i> Tambah ke Keranjang</button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.btn-buy').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            const price = parseInt(btn.dataset.price);
            const existing = cart.find(item => item.id === id);
            if (existing) {
                existing.qty += 1;
            } else {
                cart.push({ id, name, price, qty: 1 });
            }
            updateCartCount();
            showToast(`✨ ${name} ditambahkan ke keranjang`);
        };
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== INITIALIZATION ====================
setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.classList.add('hide');
    setTimeout(() => {
        document.getElementById('app').style.display = 'block';
    }, 200);
}, 1500);

document.getElementById('cartBtn').onclick = () => {
    renderCartModal();
    document.getElementById('cartModal').classList.add('show');
};
document.getElementById('closeModal').onclick = () => {
    document.getElementById('cartModal').classList.remove('show');
};
window.onclick = (e) => {
    const modal = document.getElementById('cartModal');
    if (e.target === modal) modal.classList.remove('show');
};

updateCartCount();
loadProducts();
